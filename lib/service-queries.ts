import { runSelect, getScalar } from "@/lib/db";
import {
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

/** A WO is "open" when it's a wo invoice and not voided/finalized/archived. */
const OPEN_WO = `lower(ih.InvoiceType) = 'wo' AND lower(ih.Status) NOT IN ('finalized', 'archived', 'voided')`;
/** A WO is "closed" / posted when finalized or archived. */
const POSTED_WO = `lower(ih.InvoiceType) = 'wo' AND lower(ih.Status) IN ('finalized', 'archived')`;

export type ServiceKpis = {
  openWoCount: number;
  totalLaborHours: number;
  avgWoAgeDays: number;
  woRevenue: number;
  woCompletedCount: number;
};

export function getServiceKpis(range: DateRange): ServiceKpis {
  const df = dateFilter("ih.ActivityDate", range);
  const dfWip = dateFilter("wip.EntDate", range);

  const openWoCount = Number(
    getScalar(
      `SELECT COUNT(*) FROM InvoiceHeader ih WHERE ${OPEN_WO}`,
    ) ?? 0,
  );
  const totalLaborHours = Number(
    getScalar(
      `SELECT SUM(wip.ElapsedHours)
       FROM WorkInProgress wip
       WHERE wip.IsActive = 1 AND ${dfWip.sql}`,
      dfWip.params,
    ) ?? 0,
  );
  /**
   * Avg age in days for currently open WOs based on EntDate.
   * SQLite julianday('now') minus julianday(EntDate) gives days as float.
   */
  const avgWoAgeDays = Number(
    getScalar(
      `SELECT AVG(julianday('now') - julianday(ih.EntDate))
       FROM InvoiceHeader ih
       WHERE ${OPEN_WO} AND length(ih.EntDate) >= 7`,
    ) ?? 0,
  );
  const woRevenue = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice) FROM InvoiceHeader ih
       WHERE ${POSTED_WO} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const woCompletedCount = Number(
    getScalar(
      `SELECT COUNT(*) FROM InvoiceHeader ih
       WHERE ${POSTED_WO} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );

  return {
    openWoCount,
    totalLaborHours: Math.round(totalLaborHours * 10) / 10,
    avgWoAgeDays: Math.round(avgWoAgeDays * 10) / 10,
    woRevenue,
    woCompletedCount,
  };
}

export type WoStatusRow = { Status: string; count: number };

export function getOpenWoByStatus(): WoStatusRow[] {
  return runSelect<WoStatusRow>(
    `SELECT COALESCE(swos.DisplayText, 'Unassigned') AS Status,
            COUNT(*) AS count
     FROM InvoiceHeader ih
     LEFT JOIN SettingsWorkOrderStatus swos ON swos.WorkOrderStatusId = ih.WOStatusId
     WHERE ${OPEN_WO}
     GROUP BY 1
     ORDER BY count DESC`,
  ).map((r) => ({
    Status: String(r.Status),
    count: Number(r.count) || 0,
  }));
}

export type TechHoursRow = { Technician: string; hours: number };

export function getLaborHoursByTechnician(
  range: DateRange,
  limit = 10,
): TechHoursRow[] {
  const df = dateFilter("wip.EntDate", range);
  return runSelect<TechHoursRow>(
    `SELECT COALESCE(NULLIF(trim(au.UserName), ''),
            (au.FirstName || ' ' || au.LastName), 'Tech ' || wip.TechId) AS Technician,
            SUM(wip.ElapsedHours) AS hours
     FROM WorkInProgress wip
     LEFT JOIN AppUser au ON au.AppUserId = wip.TechId
     WHERE wip.IsActive = 1 AND ${df.sql}
     GROUP BY wip.TechId
     ORDER BY hours DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    Technician: String(r.Technician),
    hours: Math.round((Number(r.hours) || 0) * 10) / 10,
  }));
}

export type WoMonthlyRow = { month: string; revenue: number };

export function getWoRevenueByMonth(range: DateRange): WoMonthlyRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<WoMonthlyRow>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     WHERE ${POSTED_WO}
       AND length(ih.ActivityDate) >= 7
       AND ${df.sql}
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month`,
    df.params,
  ).map((r) => ({
    month: String(r.month),
    revenue: Number(r.revenue) || 0,
  }));
}

export type AgingRow = { bucket: string; count: number };

export function getWoAgingBuckets(): AgingRow[] {
  type Agg = { b1: number; b2: number; b3: number; b4: number };
  const rows = runSelect<Agg>(
    `SELECT
        SUM(CASE WHEN age <= 7 THEN 1 ELSE 0 END) AS b1,
        SUM(CASE WHEN age > 7 AND age <= 30 THEN 1 ELSE 0 END) AS b2,
        SUM(CASE WHEN age > 30 AND age <= 90 THEN 1 ELSE 0 END) AS b3,
        SUM(CASE WHEN age > 90 THEN 1 ELSE 0 END) AS b4
     FROM (
       SELECT (julianday('now') - julianday(ih.EntDate)) AS age
       FROM InvoiceHeader ih
       WHERE ${OPEN_WO} AND length(ih.EntDate) >= 7
     )`,
  );
  const r = rows[0];
  if (!r) return [];
  return [
    { bucket: "0-7 days", count: Number(r.b1) || 0 },
    { bucket: "8-30 days", count: Number(r.b2) || 0 },
    { bucket: "31-90 days", count: Number(r.b3) || 0 },
    { bucket: "90+ days", count: Number(r.b4) || 0 },
  ];
}

export type AdherenceRow = { adherence: string; count: number };

export function getScheduleAdherence(range: DateRange): AdherenceRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  type Agg = { on_time: number; late: number; missing: number };
  const rows = runSelect<Agg>(
    `SELECT
        SUM(CASE
              WHEN wos.ActualEndTime IS NOT NULL AND wos.ScheduledEndTime IS NOT NULL
                   AND wos.ActualEndTime <= wos.ScheduledEndTime THEN 1 ELSE 0 END) AS on_time,
        SUM(CASE
              WHEN wos.ActualEndTime IS NOT NULL AND wos.ScheduledEndTime IS NOT NULL
                   AND wos.ActualEndTime > wos.ScheduledEndTime THEN 1 ELSE 0 END) AS late,
        SUM(CASE
              WHEN wos.ActualEndTime IS NULL OR wos.ScheduledEndTime IS NULL THEN 1 ELSE 0 END) AS missing
     FROM WorkOrderSchedule wos
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = wos.InvoiceDocId
     WHERE ${POSTED_WO} AND ${df.sql}`,
    df.params,
  );
  const r = rows[0];
  if (!r) return [];
  return [
    { adherence: "On time", count: Number(r.on_time) || 0 },
    { adherence: "Late", count: Number(r.late) || 0 },
    { adherence: "Missing data", count: Number(r.missing) || 0 },
  ];
}

export type EstimateActualRow = {
  InvoiceDocId: number;
  DocNo: string;
  WOEstimate: number;
  TotalInvoice: number;
};

export function getEstimateVsActual(
  range: DateRange,
  limit = 200,
): EstimateActualRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<EstimateActualRow>(
    `SELECT ih.InvoiceDocId AS InvoiceDocId,
            ih.DocNo AS DocNo,
            ih.WOEstimate AS WOEstimate,
            ih.TotalInvoice AS TotalInvoice
     FROM InvoiceHeader ih
     WHERE ${POSTED_WO}
       AND ih.WOEstimate > 0
       AND ih.TotalInvoice > 0
       AND ${df.sql}
     ORDER BY ih.ActivityDate DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    InvoiceDocId: Number(r.InvoiceDocId) || 0,
    DocNo: String(r.DocNo ?? ""),
    WOEstimate: Number(r.WOEstimate) || 0,
    TotalInvoice: Number(r.TotalInvoice) || 0,
  }));
}
