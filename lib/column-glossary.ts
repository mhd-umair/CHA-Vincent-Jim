/**
 * Hand-curated descriptions, aliases, and sample-value notes for the columns
 * that the natural-language pipeline most often needs. The dump-schema script
 * merges these into the generated schema markdown so the LLM sees friendly
 * vocabulary alongside bare column names.
 *
 * Coverage is intentionally narrow — only the tables that show up in
 * `*-queries.ts`. Unlisted tables/columns fall back to bare schema lines.
 */

export type GlossaryEntry = {
  /** One-line description in business English. */
  description: string;
  /** Optional synonyms users might say instead of the column name. */
  aliases?: string[];
  /**
   * Optional explicit sample-value list. The dump script will inline distinct
   * values automatically for low-cardinality TEXT columns; specify this only
   * when you want to override or curate the sample list.
   */
  sampleValues?: string[];
};

/**
 * `Table.column` -> entry. Wildcard `*` allowed for table-level notes
 * rendered above the column list.
 */
export const COLUMN_GLOSSARY: Record<string, GlossaryEntry> = {
  // --------------------------------------------------------------- InvoiceHeader
  "InvoiceHeader.*": {
    description:
      "One row per invoice document (sales, work order, rental). Revenue lives here as TotalInvoice when Status is finalized/archived.",
  },
  "InvoiceHeader.InvoiceDocId": {
    description: "Primary key. Joins to InvoiceDetail, SalesTax, Payment.",
  },
  "InvoiceHeader.DocNo": {
    description: "Human-readable document number (often shown to users).",
    aliases: ["doc number", "document no"],
  },
  "InvoiceHeader.InvoiceNo": {
    description: "Customer-facing invoice number.",
    aliases: ["invoice number"],
  },
  "InvoiceHeader.Status": {
    description:
      "Lifecycle status. For revenue use Status IN ('finalized','archived'); other values are not yet booked.",
    aliases: ["state", "invoice status"],
    sampleValues: [
      "finalized",
      "archived",
      "voided",
      "quote",
      "committed",
      "draft",
    ],
  },
  "InvoiceHeader.InvoiceType": {
    description:
      "Type code: 'in' = standard sale invoice, 'wo' = work order, 'rl' = rental.",
    aliases: ["type", "invoice kind"],
    sampleValues: ["in", "wo", "rl"],
  },
  "InvoiceHeader.ActivityDate": {
    description:
      "Primary date for time-series rollups. Stored as ISO-ish TEXT; use strftime('%Y-%m', ...) for monthly buckets.",
    aliases: ["date", "transaction date", "sale date"],
  },
  "InvoiceHeader.CustomerId": {
    description: "Foreign key to Customer.CustomerId.",
  },
  "InvoiceHeader.CustomerName": {
    description:
      "Denormalized customer name on the invoice. Prefer this for grouping by customer when only the invoice header is in scope.",
    aliases: ["account", "client"],
  },
  "InvoiceHeader.CustomerNo": {
    description: "Customer code/account number.",
  },
  "InvoiceHeader.SalesPersonName": {
    description:
      "Denormalized rep name. Empty string means 'Unassigned' — coalesce in dashboards.",
    aliases: ["sales rep", "rep", "ae", "seller"],
  },
  "InvoiceHeader.LocationId": {
    description: "Foreign key to SettingsLocation.LocationId.",
  },
  "InvoiceHeader.TotalInvoice": {
    description:
      "Total invoice amount. SUM(TotalInvoice) filtered by POSTED_SALES is canonical 'revenue'.",
    aliases: ["amount", "total", "billed amount", "invoice amount"],
  },
  "InvoiceHeader.DiscountAmt": {
    description: "Total discount applied to the invoice.",
    aliases: ["discount", "promo amount"],
  },
  "InvoiceHeader.DiscountPct": {
    description: "Discount as a percent of subtotal.",
  },
  "InvoiceHeader.WOEstimate": {
    description: "Work-order estimated total (set on WO creation).",
    aliases: ["estimate"],
  },
  "InvoiceHeader.WOStatusId": {
    description:
      "Foreign key to SettingsWorkOrderStatus. Joins for human-readable WO status text.",
  },
  "InvoiceHeader.FinalizedDate": {
    description: "Timestamp when the invoice was finalized.",
  },
  "InvoiceHeader.EntDate": {
    description: "When the row was first entered. Used for WO age math.",
  },
  "InvoiceHeader.IsActive": {
    description:
      "Soft-delete flag. Note that voided invoices keep IsActive=1; use Status, not IsActive, for revenue filters.",
  },

  // ----------------------------------------------------------------- Customer
  "Customer.*": {
    description: "Customer master. Names are anonymized but treat as sensitive.",
  },
  "Customer.CustomerId": {
    description: "Primary key.",
  },
  "Customer.CustomerNo": {
    description: "Customer code/account number.",
    aliases: ["account number"],
  },
  "Customer.CustomerName": {
    description: "Display name.",
    aliases: ["account", "client"],
  },
  "Customer.IsBusiness": {
    description: "1 = business, 0 = individual.",
  },
  "Customer.IsActive": {
    description: "1 = active, 0 = inactive/archived.",
  },
  "Customer.CredLimit": {
    description: "Credit limit assigned to the customer.",
    aliases: ["credit limit"],
  },
  "Customer.LocationId": {
    description: "Home branch foreign key (SettingsLocation).",
  },

  // ----------------------------------------------------------------- UnitBase
  "UnitBase.*": {
    description:
      "Unit inventory master (machines on the lot). Use IsActive=1 for current stock count.",
  },
  "UnitBase.UnitId": { description: "Primary key." },
  "UnitBase.StockNo": {
    description: "Stock number assigned at receiving.",
    aliases: ["stock number"],
  },
  "UnitBase.Make": {
    description: "Manufacturer / make on the unit (free-text).",
    aliases: ["manufacturer", "brand", "oem"],
  },
  "UnitBase.Model": {
    description: "Model designation.",
  },
  "UnitBase.Year": { description: "Model year." },
  "UnitBase.StockStatus": {
    description: "Current stock status label.",
    aliases: ["status", "lot status"],
  },
  "UnitBase.Rental": {
    description: "1 if the unit is in the rental fleet.",
  },
  "UnitBase.IsActive": {
    description:
      "1 if the unit is active in inventory. Use this for 'units in stock'.",
  },
  "UnitBase.LocationId": {
    description: "Branch where the unit is held (SettingsLocation).",
  },
  "UnitBase.BaseRetail": {
    description: "Retail price.",
    aliases: ["price", "retail"],
  },
  "UnitBase.BaseCost": {
    description: "Cost basis.",
  },
  "UnitBase.UnitCategoryId": {
    description: "Joins to UnitCategory for category/product-line label.",
  },
  "UnitBase.UnitConditionId": {
    description: "Joins to UnitCondition (new/used/etc).",
  },
  "UnitBase.CurrentCustomerId": {
    description:
      "If currently sold/rented, the customer. NULL means still in stock.",
  },

  // -------------------------------------------------------------- PartMaster
  "PartMaster.*": {
    description: "Part master. PartNo is the natural key users speak in.",
  },
  "PartMaster.PartId": { description: "Primary key." },
  "PartMaster.PartNo": {
    description: "Part number (catalog / SKU).",
    aliases: ["sku", "part number"],
  },
  "PartMaster.Description": {
    description: "Short description shown on invoices.",
  },
  "PartMaster.MfgId": {
    description: "Joins to PartManufacturer for brand/manufacturer label.",
  },
  "PartMaster.PartGroupId": {
    description: "Joins to PartGroup.",
  },
  "PartMaster.PartStatus": {
    description: "Active/inactive lifecycle marker for the part.",
    sampleValues: ["A", "I"],
  },
  "PartMaster.PartType": {
    description: "Part-type code (e.g., regular, kit, labor).",
  },
  "PartMaster.IsActive": {
    description: "1 = active in catalog.",
  },

  // --------------------------------------------------------- PartManufacturer
  "PartManufacturer.*": {
    description: "Lookup table for part manufacturers / brands.",
  },
  "PartManufacturer.MfgId": { description: "Primary key." },
  "PartManufacturer.MfgCode": {
    description: "Short code for the manufacturer.",
  },
  "PartManufacturer.DisplayText": {
    description: "Human-readable manufacturer name.",
    aliases: ["manufacturer name", "brand", "oem"],
  },
  "PartManufacturer.ProductLineId": {
    description: "Joins to PartProductLine for product-line rollups.",
  },

  // ---------------------------------------------------------- SettingsLocation
  "SettingsLocation.*": {
    description: "Branch / location lookup.",
  },
  "SettingsLocation.LocationId": { description: "Primary key." },
  "SettingsLocation.DisplayText": {
    description: "Branch label for charts.",
    aliases: ["branch", "store name", "site"],
  },
  "SettingsLocation.IsActive": { description: "1 = currently operating." },

  // -------------------------------------------------------------- SalePart
  "SalePart.*": {
    description:
      "Part-level invoice line items. Join via InvoiceDetail to InvoiceHeader for date/customer.",
  },
  "SalePart.ItemId": {
    description: "Joins to InvoiceDetail.ItemId.",
  },
  "SalePart.PartId": { description: "Foreign key to PartMaster." },
  "SalePart.PartNo": {
    description: "Denormalized part number on the line.",
    aliases: ["sku"],
  },
  "SalePart.Description": {
    description: "Description shown on the line.",
  },
  "SalePart.Qty": {
    description: "Quantity sold.",
    aliases: ["quantity", "units"],
  },
  "SalePart.NetExt": {
    description:
      "Net extended line revenue (price * qty net of discount). Canonical 'parts revenue'.",
    aliases: ["line revenue", "net amount", "extended"],
  },
  "SalePart.AvgCost": {
    description:
      "Average cost at time of sale. Used for margin: (NetExt - Qty*AvgCost) / NetExt.",
    aliases: ["cost", "avg cost"],
  },
  "SalePart.MfgId": {
    description: "Manufacturer fk for this line.",
  },
  "SalePart.MfgCode": { description: "Denormalized manufacturer code." },

  // ---------------------------------------------------------- InvoiceDetail
  "InvoiceDetail.*": {
    description:
      "Generic invoice line table that bridges InvoiceHeader to part/unit/labor specific tables (SalePart, SaleUnit, etc.).",
  },
  "InvoiceDetail.InvoiceDocId": { description: "Foreign key to InvoiceHeader." },
  "InvoiceDetail.ItemId": {
    description: "Foreign key into per-line tables (SalePart, SaleUnit, ...).",
  },
  "InvoiceDetail.ExtAmount": {
    description: "Extended line amount on the generic line.",
    aliases: ["line amount"],
  },

  // ----------------------------------------------------------------- Payment
  "Payment.*": {
    description: "Payment receipts. Filter Payment.IsActive=1 for valid rows.",
  },
  "Payment.PaymentId": { description: "Primary key." },
  "Payment.InvoiceDocId": {
    description: "Invoice the payment was applied to.",
  },
  "Payment.PaymentMethodId": {
    description: "Joins to PaymentMethod for human-readable method.",
  },
  "Payment.PmtType": {
    description: "Payment-type code.",
    aliases: ["method code"],
  },
  "Payment.Amount": {
    description: "Payment amount collected.",
    aliases: ["amount paid", "receipt"],
  },
  "Payment.EntDate": {
    description: "When the payment was entered. Use for time-series of receipts.",
  },
  "Payment.IsActive": {
    description:
      "1 = active payment row. Voided/reversed rows are 0 — always filter.",
  },

  // ----------------------------------------------------------------- SalesTax
  "SalesTax.*": {
    description: "Sales tax rows attached to invoices via InvoiceDocId.",
  },
  "SalesTax.InvoiceDocId": { description: "Foreign key to InvoiceHeader." },
  "SalesTax.TotalTax": {
    description: "Tax amount on the invoice.",
    aliases: ["tax", "sales tax"],
  },
  "SalesTax.TaxableAmount": {
    description: "Portion of the invoice that was taxable.",
  },
  "SalesTax.NonTaxableAmount": {
    description: "Portion that was non-taxable.",
  },
  "SalesTax.JurisdictionDisplayText": {
    description: "Tax jurisdiction label.",
    aliases: ["jurisdiction"],
  },

  // ---------------------------------------------------------- WorkInProgress
  "WorkInProgress.*": {
    description: "Tech labor punches against work orders.",
  },
  "WorkInProgress.TechId": {
    description: "Joins to AppUser for technician name.",
  },
  "WorkInProgress.ElapsedHours": {
    description: "Hours logged on the punch.",
    aliases: ["hours", "labor hours"],
  },
  "WorkInProgress.IsActive": {
    description: "1 = valid punch row.",
  },
  "WorkInProgress.EntDate": {
    description: "When the punch was created. Use for time-series of labor.",
  },
};

/**
 * Look up a glossary entry, returning `undefined` if neither a column-level
 * nor a wildcard table-level entry exists.
 */
export function getGlossaryEntry(
  table: string,
  column: string,
): GlossaryEntry | undefined {
  return COLUMN_GLOSSARY[`${table}.${column}`];
}

export function getTableNote(table: string): GlossaryEntry | undefined {
  return COLUMN_GLOSSARY[`${table}.*`];
}
