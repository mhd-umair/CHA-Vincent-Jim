/**
 * Server-only customer-health queries powering the Management dashboard's
 * "Customer health" widgets. All windows are anchored to `julianday('now')`
 * so the result is a snapshot view independent of the page's date range.
 *
 * Numerics are coerced with `Number(...)` because better-sqlite3 returns
 * SUM/COUNT aggregates as `unknown` in our generic helper.
 */

import { runSelect } from "@/lib/db";
import { POSTED_SALES } from "@/lib/sql-constants";

export type DecliningCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  prior_revenue: number;
  current_revenue: number;
  drop_pct: number;
  last_activity: string | null;
};

/**
 * Customers whose trailing-90-day posted-sales revenue is at least 30%
 * lower than the prior 90 days (i.e. days 91–180 ago). Filters out
 * customers without prior-window activity (we can't compute a drop
 * against zero).
 *
 * `drop_pct` is `(prior - current) / prior` in [0, 1].
 */
export function getDecliningCustomers(limit = 10): DecliningCustomerRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(CASE
                  WHEN julianday(ih.ActivityDate) >= julianday('now') - 180
                   AND julianday(ih.ActivityDate) <  julianday('now') - 90
                  THEN ih.TotalInvoice ELSE 0
                END) AS prior_revenue,
            SUM(CASE
                  WHEN julianday(ih.ActivityDate) >= julianday('now') - 90
                   AND julianday(ih.ActivityDate) <= julianday('now')
                  THEN ih.TotalInvoice ELSE 0
                END) AS current_revenue,
            MAX(ih.ActivityDate) AS last_activity
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES}
       AND length(ih.ActivityDate) >= 7
       AND julianday(ih.ActivityDate) >= julianday('now') - 180
     GROUP BY ih.CustomerId
     HAVING prior_revenue > 0
        AND current_revenue < prior_revenue * 0.7
     ORDER BY (prior_revenue - current_revenue) / prior_revenue DESC
     LIMIT ?`,
    [limit],
  ).map((r) => {
    const prior = Number(r.prior_revenue) || 0;
    const current = Number(r.current_revenue) || 0;
    const drop = prior > 0 ? (prior - current) / prior : 0;
    return {
      CustomerId: Number(r.CustomerId),
      CustomerName: String(r.CustomerName ?? ""),
      prior_revenue: prior,
      current_revenue: current,
      drop_pct: drop,
      last_activity: r.last_activity ? String(r.last_activity) : null,
    };
  });
}

export type DormantCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  last_activity: string | null;
  lifetime_revenue: number;
  lifetime_invoices: number;
};

/**
 * Active customers (`Customer.IsActive = 1`) with at least one historical
 * posted standard-sale invoice but none in the last `sinceDays` days.
 * Ordered by lifetime revenue DESC so the most valuable lapsed accounts
 * surface first.
 */
export function getDormantCustomers(
  limit = 15,
  sinceDays = 180,
): DormantCustomerRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT c.CustomerId AS CustomerId,
            c.CustomerName AS CustomerName,
            MAX(ih.ActivityDate) AS last_activity,
            SUM(ih.TotalInvoice) AS lifetime_revenue,
            COUNT(*) AS lifetime_invoices
     FROM Customer c
     JOIN InvoiceHeader ih ON ih.CustomerId = c.CustomerId
     WHERE c.IsActive = 1
       AND ${POSTED_SALES}
       AND length(ih.ActivityDate) >= 7
     GROUP BY c.CustomerId
     HAVING (julianday('now') - julianday(MAX(ih.ActivityDate))) > ?
     ORDER BY lifetime_revenue DESC
     LIMIT ?`,
    [sinceDays, limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? ""),
    last_activity: r.last_activity ? String(r.last_activity) : null,
    lifetime_revenue: Number(r.lifetime_revenue) || 0,
    lifetime_invoices: Number(r.lifetime_invoices) || 0,
  }));
}

export type ContactBucket =
  | "no_contacts"
  | "missing_email"
  | "missing_phone"
  | "complete";

export type ContactCompletenessRow = {
  bucket: string;
  count: number;
};

/**
 * The 4 buckets, in deterministic display order, used by both the chart
 * and the drill-down list lookup.
 *
 * Precedence (collapsed to 4 buckets per spec):
 *   1. No active Contact row              → "No contacts on file"
 *   2. Has email AND has phone            → "Complete (email + phone)"
 *   3. Else: missing email                → "Missing email"
 *      (this captures the "missing both" case so we don't need a 5th
 *      bucket — missing-email is the stronger signal)
 *   4. Else: missing phone (but has email) → "Missing phone"
 */
const BUCKET_ORDER: { key: ContactBucket; label: string }[] = [
  { key: "no_contacts", label: "No contacts on file" },
  { key: "missing_email", label: "Missing email" },
  { key: "missing_phone", label: "Missing phone" },
  { key: "complete", label: "Complete (email + phone)" },
];

/** Map a customer's per-flag booleans to our 4-bucket precedence. */
function classify(
  has_contact: number,
  has_email: number,
  has_phone: number,
): ContactBucket {
  if (!has_contact) return "no_contacts";
  if (has_email && has_phone) return "complete";
  if (!has_email) return "missing_email";
  return "missing_phone";
}

/**
 * 4-bucket breakdown of contact-data completeness across active customers.
 * Returns rows in the deterministic order [no_contacts, missing_email,
 * missing_phone, complete] regardless of zero counts so the bar chart's
 * x-axis is stable.
 */
export function getContactCompleteness(): ContactCompletenessRow[] {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT c.CustomerId,
            CASE WHEN EXISTS (
              SELECT 1 FROM Contact ct
              WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
            ) THEN 1 ELSE 0 END AS has_contact,
            CASE WHEN EXISTS (
              SELECT 1 FROM Contact ct
              JOIN CustomerEmail ce ON ce.ContactId = ct.ContactId
                                   AND ce.IsActive = 1
              WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
            ) THEN 1 ELSE 0 END AS has_email,
            CASE WHEN EXISTS (
              SELECT 1 FROM Contact ct
              JOIN CustomerPhone cp ON cp.ContactId = ct.ContactId
                                   AND cp.IsActive = 1
              WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
            ) THEN 1 ELSE 0 END AS has_phone
     FROM Customer c
     WHERE c.IsActive = 1`,
  );

  const counts: Record<ContactBucket, number> = {
    no_contacts: 0,
    missing_email: 0,
    missing_phone: 0,
    complete: 0,
  };
  for (const r of rows) {
    const b = classify(
      Number(r.has_contact) || 0,
      Number(r.has_email) || 0,
      Number(r.has_phone) || 0,
    );
    counts[b] += 1;
  }
  return BUCKET_ORDER.map((b) => ({ bucket: b.label, count: counts[b.key] }));
}

export type ContactBucketCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  IsActive: number;
  last_activity: string | null;
};

/**
 * Customers belonging to a specific contact-completeness bucket. Powers the
 * drill-down list when the user clicks a bar in the completeness chart.
 *
 * `last_activity` uses any-status `InvoiceHeader.ActivityDate` (not just
 * posted) so accounts with stalled drafts still surface a recent date.
 */
export function getCustomersByContactBucket(
  bucket: ContactBucket,
  limit = 200,
): ContactBucketCustomerRow[] {
  let bucketFilter: string;
  switch (bucket) {
    case "no_contacts":
      bucketFilter = "has_contact = 0";
      break;
    case "missing_email":
      bucketFilter = "has_contact = 1 AND has_email = 0";
      break;
    case "missing_phone":
      bucketFilter =
        "has_contact = 1 AND has_email = 1 AND has_phone = 0";
      break;
    case "complete":
      bucketFilter =
        "has_contact = 1 AND has_email = 1 AND has_phone = 1";
      break;
  }
  return runSelect<Record<string, unknown>>(
    `WITH cust AS (
       SELECT c.CustomerId, c.CustomerName, c.IsActive,
              CASE WHEN EXISTS (
                SELECT 1 FROM Contact ct
                WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
              ) THEN 1 ELSE 0 END AS has_contact,
              CASE WHEN EXISTS (
                SELECT 1 FROM Contact ct
                JOIN CustomerEmail ce ON ce.ContactId = ct.ContactId
                                     AND ce.IsActive = 1
                WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
              ) THEN 1 ELSE 0 END AS has_email,
              CASE WHEN EXISTS (
                SELECT 1 FROM Contact ct
                JOIN CustomerPhone cp ON cp.ContactId = ct.ContactId
                                     AND cp.IsActive = 1
                WHERE ct.CustomerId = c.CustomerId AND ct.IsActive = 1
              ) THEN 1 ELSE 0 END AS has_phone,
              (SELECT MAX(ih.ActivityDate)
                 FROM InvoiceHeader ih
                 WHERE ih.CustomerId = c.CustomerId) AS last_activity
       FROM Customer c
       WHERE c.IsActive = 1
     )
     SELECT CustomerId, CustomerName, IsActive, last_activity
     FROM cust
     WHERE ${bucketFilter}
     ORDER BY CustomerName
     LIMIT ?`,
    [limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? ""),
    IsActive: Number(r.IsActive) || 0,
    last_activity: r.last_activity ? String(r.last_activity) : null,
  }));
}
