/**
 * Curated question-to-SQL examples used as few-shots in the freeform NL→SQL
 * fallback. Each `sql` is taken (and trimmed) from the working
 * `lib/*-queries.ts` files so the LLM copies *real* schema usage rather than
 * inventing columns.
 *
 * Keep examples small and focused. The full set (currently 18) is short
 * enough to inject into the prompt verbatim.
 */

export type FewShot = {
  q: string;
  sql: string;
  /** Optional tags so we can later switch to per-domain retrieval. */
  tags?: string[];
};

export const FEW_SHOTS: FewShot[] = [
  // ---------------------------------------------------------- core revenue
  {
    q: "Monthly revenue trend",
    sql: `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
       SUM(ih.TotalInvoice) AS revenue
FROM InvoiceHeader ih
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
  AND length(ih.ActivityDate) >= 7
GROUP BY 1
HAVING month IS NOT NULL
ORDER BY month`,
    tags: ["revenue", "trend", "month"],
  },
  {
    q: "Top 10 customers by revenue",
    sql: `SELECT ih.CustomerId AS CustomerId,
       MAX(ih.CustomerName) AS CustomerName,
       SUM(ih.TotalInvoice) AS revenue
FROM InvoiceHeader ih
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
GROUP BY ih.CustomerId
ORDER BY revenue DESC
LIMIT 10`,
    tags: ["revenue", "customer", "top"],
  },
  {
    q: "Revenue by salesperson",
    sql: `SELECT
       CASE
         WHEN ih.SalesPersonName IS NULL OR trim(ih.SalesPersonName) = '' THEN 'Unassigned'
         ELSE ih.SalesPersonName
       END AS SalesPersonName,
       SUM(ih.TotalInvoice) AS revenue,
       COUNT(*) AS invoices
FROM InvoiceHeader ih
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
GROUP BY 1
ORDER BY revenue DESC
LIMIT 10`,
    tags: ["revenue", "salesperson"],
  },
  {
    q: "Average invoice over time",
    sql: `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
       ROUND(AVG(ih.TotalInvoice), 2) AS avg_invoice
FROM InvoiceHeader ih
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
  AND length(ih.ActivityDate) >= 7
GROUP BY 1
HAVING month IS NOT NULL
ORDER BY month`,
    tags: ["avg", "trend"],
  },
  {
    q: "Invoice count by status",
    sql: `SELECT
       CASE
         WHEN ih.Status IS NULL OR trim(ih.Status) = '' THEN 'Unknown'
         ELSE lower(ih.Status)
       END AS Status,
       COUNT(*) AS count
FROM InvoiceHeader ih
WHERE lower(ih.InvoiceType) = 'in'
GROUP BY 1
ORDER BY count DESC`,
    tags: ["status", "invoices"],
  },

  // -------------------------------------------------------------- parts
  {
    q: "Top 10 parts by revenue",
    sql: `SELECT sp.PartNo AS PartNo,
       MAX(sp.Description) AS Description,
       SUM(sp.NetExt) AS line_revenue
FROM SalePart sp
JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
GROUP BY sp.PartNo
ORDER BY line_revenue DESC
LIMIT 10`,
    tags: ["parts", "top", "revenue"],
  },
  {
    q: "Top parts by quantity sold",
    sql: `SELECT sp.PartNo AS PartNo,
       MAX(sp.Description) AS Description,
       SUM(sp.Qty) AS qty
FROM SalePart sp
JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
GROUP BY sp.PartNo
ORDER BY qty DESC
LIMIT 10`,
    tags: ["parts", "qty"],
  },
  {
    q: "Parts revenue by manufacturer",
    sql: `SELECT COALESCE(pm.DisplayText, sp.MfgCode, 'Unknown') AS Manufacturer,
       SUM(sp.NetExt) AS revenue
FROM SalePart sp
JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
GROUP BY 1
ORDER BY revenue DESC
LIMIT 6`,
    tags: ["parts", "manufacturer"],
  },
  {
    q: "Parts revenue for Caterpillar",
    sql: `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
       SUM(sp.NetExt) AS line_revenue
FROM SalePart sp
JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId
WHERE lower(ih.Status) IN ('finalized','archived')
  AND lower(ih.InvoiceType) = 'in'
  AND (lower(pm.DisplayText) LIKE lower('%caterpillar%')
       OR lower(sp.MfgCode) LIKE lower('%caterpillar%'))
  AND length(ih.ActivityDate) >= 7
GROUP BY 1
HAVING month IS NOT NULL
ORDER BY month`,
    tags: ["parts", "manufacturer", "value-filter"],
  },

  // -------------------------------------------------------------- service / WO
  {
    q: "Open work orders by status",
    sql: `SELECT COALESCE(swos.DisplayText, 'Unassigned') AS Status,
       COUNT(*) AS count
FROM InvoiceHeader ih
LEFT JOIN SettingsWorkOrderStatus swos ON swos.WorkOrderStatusId = ih.WOStatusId
WHERE lower(ih.InvoiceType) = 'wo'
  AND lower(ih.Status) NOT IN ('finalized','archived','voided')
GROUP BY 1
ORDER BY count DESC`,
    tags: ["service", "wo", "status"],
  },
  {
    q: "Labor hours by technician",
    sql: `SELECT COALESCE(NULLIF(trim(au.UserName), ''),
                (au.FirstName || ' ' || au.LastName), 'Tech ' || wip.TechId) AS Technician,
       SUM(wip.ElapsedHours) AS hours
FROM WorkInProgress wip
LEFT JOIN AppUser au ON au.AppUserId = wip.TechId
WHERE wip.IsActive = 1
GROUP BY wip.TechId
ORDER BY hours DESC
LIMIT 10`,
    tags: ["service", "labor", "tech"],
  },
  {
    q: "Work order aging buckets",
    sql: `SELECT bucket, count FROM (
  SELECT '0-7 days' AS bucket,
         SUM(CASE WHEN age <= 7 THEN 1 ELSE 0 END) AS count,
         1 AS sort
  FROM (
    SELECT (julianday('now') - julianday(ih.EntDate)) AS age
    FROM InvoiceHeader ih
    WHERE lower(ih.InvoiceType) = 'wo'
      AND lower(ih.Status) NOT IN ('finalized','archived','voided')
      AND length(ih.EntDate) >= 7
  )
  UNION ALL
  SELECT '8-30 days', SUM(CASE WHEN age > 7 AND age <= 30 THEN 1 ELSE 0 END), 2
  FROM (
    SELECT (julianday('now') - julianday(ih.EntDate)) AS age
    FROM InvoiceHeader ih
    WHERE lower(ih.InvoiceType) = 'wo'
      AND lower(ih.Status) NOT IN ('finalized','archived','voided')
      AND length(ih.EntDate) >= 7
  )
)
ORDER BY sort`,
    tags: ["service", "aging"],
  },

  // -------------------------------------------------------------- finance
  {
    q: "Payments by method",
    sql: `SELECT COALESCE(pm.DisplayText, p.PmtType, 'Unknown') AS Method,
       SUM(p.Amount) AS amount
FROM Payment p
LEFT JOIN PaymentMethod pm ON pm.PaymentMethodId = p.PaymentMethodId
WHERE p.IsActive = 1
GROUP BY 1
ORDER BY amount DESC
LIMIT 10`,
    tags: ["finance", "payment", "method"],
  },
  {
    q: "Monthly payment activity",
    sql: `SELECT strftime('%Y-%m', p.EntDate) AS month,
       SUM(p.Amount) AS amount
FROM Payment p
WHERE p.IsActive = 1
  AND length(p.EntDate) >= 7
GROUP BY 1
HAVING month IS NOT NULL
ORDER BY month`,
    tags: ["finance", "payment", "trend"],
  },
  {
    q: "Top customers by outstanding AR",
    sql: `SELECT ih.CustomerId AS CustomerId,
       MAX(ih.CustomerName) AS CustomerName,
       SUM(ih.TotalInvoice - COALESCE(paid.amt, 0)) AS balance
FROM InvoiceHeader ih
LEFT JOIN (
  SELECT InvoiceDocId, SUM(Amount) AS amt
  FROM Payment
  WHERE IsActive = 1
  GROUP BY InvoiceDocId
) AS paid ON paid.InvoiceDocId = ih.InvoiceDocId
WHERE lower(ih.Status) IN ('finalized','archived')
GROUP BY ih.CustomerId
HAVING balance > 0
ORDER BY balance DESC
LIMIT 10`,
    tags: ["finance", "ar"],
  },
  {
    q: "Revenue by location",
    sql: `SELECT COALESCE(sl.DisplayText, 'Unknown') AS Location,
       SUM(ih.TotalInvoice) AS revenue
FROM InvoiceHeader ih
LEFT JOIN SettingsLocation sl ON sl.LocationId = ih.LocationId
WHERE lower(ih.Status) IN ('finalized','archived')
GROUP BY 1
ORDER BY revenue DESC`,
    tags: ["revenue", "location"],
  },
  {
    q: "Tax collected by jurisdiction",
    sql: `SELECT COALESCE(NULLIF(trim(st.JurisdictionDisplayText), ''), 'Unknown') AS Jurisdiction,
       SUM(st.TotalTax) AS tax
FROM SalesTax st
JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId
WHERE lower(ih.Status) IN ('finalized','archived')
GROUP BY 1
ORDER BY tax DESC
LIMIT 10`,
    tags: ["finance", "tax"],
  },

  // -------------------------------------------------------------- inventory
  {
    q: "Units in stock by make",
    sql: `SELECT
       CASE WHEN ub.Make IS NULL OR trim(ub.Make) = '' THEN 'Unknown' ELSE ub.Make END AS Make,
       COUNT(*) AS units
FROM UnitBase ub
WHERE ub.IsActive = 1
GROUP BY 1
ORDER BY units DESC
LIMIT 10`,
    tags: ["inventory", "units"],
  },
  {
    q: "Units in stock by status",
    sql: `SELECT
       CASE WHEN ub.StockStatus IS NULL OR trim(ub.StockStatus) = '' THEN 'Unknown' ELSE ub.StockStatus END AS StockStatus,
       COUNT(*) AS units
FROM UnitBase ub
WHERE ub.IsActive = 1
GROUP BY 1
ORDER BY units DESC`,
    tags: ["inventory", "status"],
  },
];

/**
 * Render the few-shot block for the prompt. Keep ordering stable so the
 * model's context is deterministic across calls.
 */
export function renderFewShotsForPrompt(): string {
  const blocks = FEW_SHOTS.map(
    (ex, i) => `### Example ${i + 1}: ${ex.q}\n\n\`\`\`sql\n${ex.sql}\n\`\`\``,
  );
  return `## Reference SQL examples (real, working queries)\n\n${blocks.join("\n\n")}`;
}
