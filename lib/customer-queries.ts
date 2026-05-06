import { runSelect } from "@/lib/db";
import { POSTED_SALES } from "@/lib/sql-constants";

export type CustomerRow = {
  CustomerId: number;
  CustomerNo: string;
  CustomerName: string;
  IsActive: number;
  CredLimit: number;
};

export function getCustomerById(customerId: number): CustomerRow | undefined {
  const rows = runSelect<CustomerRow>(
    `SELECT CustomerId, CustomerNo, CustomerName, IsActive, CredLimit
     FROM Customer WHERE CustomerId = ?`,
    [customerId],
  );
  return rows[0];
}

export type CustomerInvoiceRow = {
  InvoiceDocId: number;
  InvoiceNo: string;
  ActivityDate: string;
  TotalInvoice: number;
  Status: string;
};

export function getCustomerRecentInvoices(customerId: number, limit = 15) {
  return runSelect<CustomerInvoiceRow>(
    `SELECT ih.InvoiceDocId, ih.InvoiceNo, ih.ActivityDate, ih.TotalInvoice, ih.Status
     FROM InvoiceHeader ih
     WHERE ih.CustomerId = ?
     ORDER BY ih.ActivityDate DESC
     LIMIT ?`,
    [customerId, limit],
  );
}

export function getCustomerRevenueSummary(customerId: number) {
  const row = runSelect<{ revenue: number; invoices: number; last_activity: string | null }>(
    `SELECT SUM(ih.TotalInvoice) AS revenue,
            COUNT(*) AS invoices,
            MAX(ih.ActivityDate) AS last_activity
     FROM InvoiceHeader ih
     WHERE ih.CustomerId = ? AND ${POSTED_SALES}`,
    [customerId],
  )[0];
  return {
    revenue: Number(row?.revenue) || 0,
    invoices: Number(row?.invoices) || 0,
    lastActivity: row?.last_activity ?? null,
  };
}

export type CustomerContactRow = {
  ContactId: number;
  FirstName: string;
  LastName: string;
  TitleDept: string;
  IsPrimary: number;
  Email: string | null;
  Phone: string | null;
};

/**
 * One row per active contact for the customer with the contact's preferred
 * email and phone (default if present, else the lowest-id active value).
 * Aggregation lives inside correlated subqueries so we keep one row per
 * `ContactId` without a `GROUP BY` over every projected column.
 */
export function getCustomerContacts(customerId: number): CustomerContactRow[] {
  return runSelect<CustomerContactRow>(
    `SELECT c.ContactId,
            c.FirstName,
            c.LastName,
            c.TitleDept,
            c.IsPrimary,
            (SELECT ce.Addr
               FROM CustomerEmail ce
               WHERE ce.ContactId = c.ContactId AND ce.IsActive = 1
               ORDER BY ce.IsDefault DESC, ce.EmailId ASC
               LIMIT 1) AS Email,
            (SELECT cp.Phone
               FROM CustomerPhone cp
               WHERE cp.ContactId = c.ContactId AND cp.IsActive = 1
               ORDER BY cp.IsDefault DESC, cp.PhoneId ASC
               LIMIT 1) AS Phone
     FROM Contact c
     WHERE c.CustomerId = ? AND c.IsActive = 1
     ORDER BY c.IsPrimary DESC, c.LastName, c.FirstName`,
    [customerId],
  ).map((r) => ({
    ContactId: Number(r.ContactId),
    FirstName: String(r.FirstName ?? ""),
    LastName: String(r.LastName ?? ""),
    TitleDept: String(r.TitleDept ?? ""),
    IsPrimary: Number(r.IsPrimary) || 0,
    Email: r.Email ? String(r.Email) : null,
    Phone: r.Phone ? String(r.Phone) : null,
  }));
}

export type CustomerPurchasedPartRow = {
  PartNo: string;
  Description: string;
  qty: number;
  revenue: number;
  last_purchase: string | null;
};

/**
 * Parts this customer has purchased on posted standard sales, grouped by
 * `PartNo`. Description is taken via `MAX` because the same `PartNo` may
 * appear with slightly different descriptions across line items.
 */
export function getCustomerPurchasedParts(
  customerId: number,
  limit = 25,
): CustomerPurchasedPartRow[] {
  return runSelect<CustomerPurchasedPartRow>(
    `SELECT sp.PartNo AS PartNo,
            MAX(sp.Description) AS Description,
            SUM(sp.Qty) AS qty,
            SUM(sp.NetExt) AS revenue,
            MAX(ih.ActivityDate) AS last_purchase
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ih.CustomerId = ? AND ${POSTED_SALES}
     GROUP BY sp.PartNo
     ORDER BY revenue DESC
     LIMIT ?`,
    [customerId, limit],
  ).map((r) => ({
    PartNo: String(r.PartNo ?? ""),
    Description: String(r.Description ?? ""),
    qty: Number(r.qty) || 0,
    revenue: Number(r.revenue) || 0,
    last_purchase: r.last_purchase ? String(r.last_purchase) : null,
  }));
}

export type CustomerActivityTrendRow = { month: string; revenue: number };

/**
 * Monthly posted standard-sale revenue for this customer. Range-independent
 * by design (customer profile shows the customer's full activity); the
 * caller can slice the trailing window in the UI if desired.
 */
export type CustomerDirectoryRow = {
  CustomerId: number;
  CustomerName: string;
  CustomerNo: string;
  IsActive: number;
  last_activity: string | null;
  lifetime_revenue: number;
};

/**
 * Active customers with optional name/number search and sort. Posted standard
 * sales only for lifetime revenue and last activity.
 */
export function getCustomerDirectory(opts: {
  search?: string;
  limit?: number;
  sort?: "name" | "last_activity" | "lifetime_revenue";
}): CustomerDirectoryRow[] {
  const limit = opts.limit ?? 200;
  const sort = opts.sort ?? "name";
  const search = opts.search?.trim();
  const searchClause = search
    ? `AND (LOWER(c.CustomerName) LIKE '%' || LOWER(?) || '%' OR LOWER(c.CustomerNo) LIKE '%' || LOWER(?) || '%')`
    : "";
  const params: unknown[] = [];
  if (search) {
    params.push(search, search);
  }
  const orderBy =
    sort === "last_activity"
      ? "CASE WHEN last_activity IS NULL THEN 1 ELSE 0 END ASC, last_activity DESC, c.CustomerName ASC"
      : sort === "lifetime_revenue"
        ? "lifetime_revenue DESC, c.CustomerName ASC"
        : "c.CustomerName ASC";
  return runSelect<CustomerDirectoryRow>(
    `SELECT c.CustomerId,
            c.CustomerName,
            c.CustomerNo,
            c.IsActive,
            ih_agg.last_activity AS last_activity,
            COALESCE(ih_agg.lifetime_revenue, 0) AS lifetime_revenue
     FROM Customer c
     LEFT JOIN (
       SELECT ih.CustomerId,
              MAX(ih.ActivityDate) AS last_activity,
              SUM(ih.TotalInvoice) AS lifetime_revenue
       FROM InvoiceHeader ih
       WHERE ${POSTED_SALES}
       GROUP BY ih.CustomerId
     ) ih_agg ON ih_agg.CustomerId = c.CustomerId
     WHERE c.IsActive = 1
       ${searchClause}
     ORDER BY ${orderBy}
     LIMIT ?`,
    [...params, limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? ""),
    CustomerNo: String(r.CustomerNo ?? ""),
    IsActive: Number(r.IsActive) || 0,
    last_activity: r.last_activity ? String(r.last_activity) : null,
    lifetime_revenue: Number(r.lifetime_revenue) || 0,
  }));
}

export function getCustomerActivityTrend(
  customerId: number,
): CustomerActivityTrendRow[] {
  return runSelect<CustomerActivityTrendRow>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     WHERE ih.CustomerId = ?
       AND ${POSTED_SALES}
       AND length(ih.ActivityDate) >= 7
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month ASC`,
    [customerId],
  ).map((r) => ({
    month: String(r.month),
    revenue: Number(r.revenue) || 0,
  }));
}
