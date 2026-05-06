# Generated schema (do not edit by hand)

Run `npm run dump-schema` after schema changes. Annotations come from `lib/column-glossary.ts`; sample values are inlined for low-cardinality TEXT columns.

## AppUser

- **AppUserId** (INTEGER) _PK, NOT NULL_
- **DefaultLocationId** (INTEGER) _NOT NULL_
- **Salutation** (TEXT) _NOT NULL_ — values: Mr, Mis, Dr
- **UserName** (TEXT) _NOT NULL_
- **FirstName** (TEXT) _NOT NULL_
- **MiddleName** (TEXT) _NOT NULL_
- **LastName** (TEXT) _NOT NULL_
- **Suffix** (TEXT) _NOT NULL_
- **Password** (TEXT) _NOT NULL_
- **ClockPIN** (TEXT) _NOT NULL_
- **HourlyRate** (NUMERIC) _NOT NULL_
- **OTRate** (NUMERIC) _NOT NULL_
- **IsSales** (INTEGER) _NOT NULL_
- **IsServiceTech** (INTEGER) _NOT NULL_
- **IsSystem** (INTEGER) _NOT NULL_
- **IsADUser** (INTEGER) _NOT NULL_
- **ADAuthority** (TEXT) _NOT NULL_
- **ADUserName** (TEXT) _NOT NULL_
- **AllowLogin** (INTEGER) _NOT NULL_
- **Note** (TEXT) _NOT NULL_
- **AllowQueryTool** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2025-03-13 22:17:41.090000, 2024-05-14 16:05:43.493000, 2024-05-14 16:07:32.283000, 2022-01-13 13:00:59.253000, 2025-04-11 11:14:42.477000, 2020-04-17 14:05:11.120000, 2023-02-17 16:02:26.177000, 2024-12-20 12:37:51.723000, 2024-09-27 15:10:53.733000, 2023-10-16 12:01:21.523000, 2023-10-16 12:02:09.807000, 2023-10-16 12:03:52.783000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Katie, JordanM
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2017-06-05 10:47:34.577000, 2017-06-05 11:43:21.270000, 2017-06-05 11:47:45.817000, 2017-06-05 11:51:02.393000, 2017-06-05 11:52:29.957000, 2017-06-05 11:55:19.003000, 2017-06-05 11:57:02.850000, 2017-06-05 11:58:37.210000, 2017-06-05 12:01:16.433000, 2017-06-05 12:02:26.470000, 2017-06-05 12:03:35.423000
- **EntBy** (TEXT) _NOT NULL_ — values: System, Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_
- **EmployeeNo** (TEXT) _NOT NULL_
- **RegHrsIncomeCode** (TEXT) _NOT NULL_ — values: Hourly Tech
- **OTHrsIncomeCode** (TEXT) _NOT NULL_ — values: Overtime Tech
- **RacfId** (TEXT) _NOT NULL_
- **AllowAIM** (INTEGER) _NOT NULL_
- **AllowAIMPremium** (INTEGER) _NOT NULL_
- **IsIntegrator** (INTEGER) _NOT NULL_
- **IntegratorToken** (TEXT)
- **PasswordHash** (TEXT)
- **PasswordSalt** (TEXT)
- **ESignEmail** (TEXT)

## Contact

- **ContactId** (INTEGER) _PK, NOT NULL_
- **CustomerId** (INTEGER) _NOT NULL_
- **FirstName** (TEXT) _NOT NULL_
- **LastName** (TEXT) _NOT NULL_
- **MiddleName** (TEXT) _NOT NULL_
- **Salutation** (TEXT) _NOT NULL_ — values: Mr, Mr., Ms, Dr, Mrs, Rob, Leno
- **Suffix** (TEXT) _NOT NULL_ — values: Jr, Sr, III
- **TitleDept** (TEXT) _NOT NULL_ — values: 5640 Old Lakeport, Worker, Tyson Hides
- **Note** (TEXT) _NOT NULL_
- **OtherInfo** (TEXT) _NOT NULL_
- **IsPrimary** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Katie, Admin, KMiller, CathyF, GregM, KevinP, DebH, sys-target, JordanM, KyleH, Hunter, ByronL
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, TerryN, JordanM, KyleH, DougM, AndrewM, KevinP, ByronL, JoeH, BrettN, DebH, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **PortalUserName** (TEXT) _NOT NULL_
- **PortalPassword** (TEXT) _NOT NULL_
- **PortalAccessFromCust** (INTEGER) _NOT NULL_
- **PortalAccessInvoiceView** (INTEGER) _NOT NULL_
- **PortalAccessPartOrders** (INTEGER)
- **PortalAccessPayments** (INTEGER)

## Customer

_Customer master. Names are anonymized but treat as sensitive._

- **CustomerId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **LocationId** (INTEGER) _NOT NULL_ — Home branch foreign key (SettingsLocation).
- **BillingAddressId** (INTEGER) _NOT NULL_
- **DefSalespersonId** (INTEGER)
- **SpecialPricingId** (INTEGER)
- **TaxExemptId** (INTEGER)
- **CustomerNo** (TEXT) _NOT NULL_ — Customer code/account number. · aliases: account number
- **IsBusiness** (INTEGER) _NOT NULL_ — 1 = business, 0 = individual.
- **CustomerName** (TEXT) _NOT NULL_ — Display name. · aliases: account, client
- **TaxIdNo** (TEXT) _NOT NULL_
- **TaxIdNoLast4** (TEXT) _NOT NULL_
- **POSComment** (TEXT)
- **Comment** (TEXT) _NOT NULL_
- **CalcSvcCharge** (INTEGER) _NOT NULL_
- **LaborDisc** (INTEGER) _NOT NULL_
- **CreditHoldFlag** (INTEGER) _NOT NULL_
- **PrintPastDue** (INTEGER) _NOT NULL_
- **IsPORequired** (INTEGER) _NOT NULL_
- **StatementFlag** (INTEGER) _NOT NULL_
- **IgnoreSaleFlag** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_ — 1 = active, 0 = inactive/archived.
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Katie, Admin, JordanM, CathyF, KMiller, KyleH, ByronL, CarterG, GregM, KevinP, Hunter, sys-target
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, TerryN, KyleH, DougM, AndrewM, KevinP, ByronL, JordanM, JoeH, BrettN, DebH, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **CredLimit** (NUMERIC) _NOT NULL_ — Credit limit assigned to the customer. · aliases: credit limit
- **AltCustomerNo** (TEXT) _NOT NULL_
- **TaxGroupOverrideId** (INTEGER)
- **DefaultDeliverOnInv** (INTEGER) _NOT NULL_
- **DefaultRentalDiscPct** (NUMERIC) _NOT NULL_
- **ExcludeFromSalesHist** (INTEGER) _NOT NULL_
- **PortalPassword** (TEXT) _NOT NULL_
- **PortalAccessAll** (INTEGER) _NOT NULL_
- **PortalAccessInvoiceView** (INTEGER) _NOT NULL_
- **PortalAccessPartOrders** (INTEGER)
- **PortalAccessPayments** (INTEGER)
- **PortalAccessDetailPricing** (TEXT)
- **StihlCustomerNumberId** (INTEGER)

## CustomerAddress

- **AddressId** (INTEGER) _PK, NOT NULL_
- **CustomerId** (INTEGER) _NOT NULL_
- **ShipMethodId** (INTEGER)
- **ZoneId** (INTEGER)
- **TaxGroupId** (INTEGER)
- **DisplayText** (TEXT) _NOT NULL_
- **Company** (TEXT) _NOT NULL_
- **LastName** (TEXT) _NOT NULL_
- **MiddleName** (TEXT) _NOT NULL_
- **FirstName** (TEXT) _NOT NULL_
- **Salutation** (TEXT) _NOT NULL_ — values: Mr, Mr., Ms, Dr, Mrs, Rob
- **Suffix** (TEXT) _NOT NULL_ — values: Jr, III
- **Add1** (TEXT) _NOT NULL_
- **Add2** (TEXT) _NOT NULL_
- **City** (TEXT) _NOT NULL_
- **County** (TEXT) _NOT NULL_
- **State** (TEXT) _NOT NULL_ — values: IA, NE, SD, MN, MO, ND, WI, TN, NC, UT, OK, KS
- **Country** (TEXT) _NOT NULL_ — values: US
- **Zip** (TEXT) _NOT NULL_
- **Note** (TEXT) _NOT NULL_
- **MailingFlag** (INTEGER) _NOT NULL_
- **Phone** (TEXT) _NOT NULL_
- **IsDefault** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, CathyF, JordanM, GregM, KevinP, DebH, sys-target, KyleH, Katie, KMiller, Hunter, ByronL
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, TerryN, JordanM, KyleH, DougM, AndrewM, KevinP, ByronL, JoeH, DebH, BrettN, GregM
- **RowVersion** (BLOB) _NOT NULL_

## CustomerClass

- **ClassId** (INTEGER) _PK, NOT NULL_
- **ClassTypeId** (INTEGER) _NOT NULL_
- **CustomerId** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: JordanM, TerryN, Katie, KyleH, KevinP, AndrewM, DougM, JoeH, BrettN, DebH, Admin, sys-target
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KevinP, TerryN, KyleH, AndrewM, DougM, JoeH, BrettN, DebH, Katie, JordanM, Admin, Hunter
- **RowVersion** (BLOB) _NOT NULL_

## CustomerClassType

- **ClassTypeId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2017-05-31 14:59:11.693000, 2017-05-31 14:59:04.913000, 2009-07-01 00:00:00, 2017-05-31 14:59:22.417000, 2022-12-22 11:23:02.893000, 2017-05-31 15:00:15.510000, 2017-05-31 15:00:22.210000, 2017-05-31 14:59:25.710000, 2022-12-21 15:07:58.487000, 2022-12-22 11:22:53.393000, 2022-12-22 11:43:21.090000, 2022-12-28 10:16:01.963000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Install, Katie
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2021-12-08 09:28:40.357000, 2022-12-21 13:38:56.350000, 2022-12-21 15:07:58.487000, 2022-12-22 11:22:53.393000, 2022-12-22 11:43:21.090000, 2022-12-28 10:16:01.963000, 2023-02-03 13:00:45.283000, 2023-10-18 14:19:22.623000, 2023-12-20 11:40:01.467000
- **EntBy** (TEXT) _NOT NULL_ — values: Install, Katie
- **RowVersion** (BLOB) _NOT NULL_

## CustomerEmail

- **EmailId** (INTEGER) _PK, NOT NULL_
- **ContactId** (INTEGER) _NOT NULL_
- **EmailTypeId** (INTEGER) _NOT NULL_
- **Addr** (TEXT) _NOT NULL_
- **BroadcastFlag** (INTEGER) _NOT NULL_
- **IsDefault** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Katie, Admin, ByronL, DougM, KMiller, CathyF, JordanM, sys-target, Hunter, KevinP, AndrewM, TerryN
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, JordanM, JoeH, KyleH, AndrewM, DougM, ByronL, DebH, TerryN, KevinP, BrettN, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **Comment** (TEXT)
- **Statement** (INTEGER) _NOT NULL_

## CustomerPhone

- **PhoneId** (INTEGER) _PK, NOT NULL_
- **ContactId** (INTEGER) _NOT NULL_
- **PhoneTypeId** (INTEGER) _NOT NULL_
- **Phone** (TEXT) _NOT NULL_
- **IsDefault** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, ByronL, CathyF, sys-target, Katie, BrettN, AndrewM, KevinP, Hunter, KMiller, TerryN, CarterG
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, KevinP, TerryN, JordanM, KyleH, AndrewM, DougM, ByronL, JoeH, BrettN, DebH, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **Comment** (TEXT)

## InvoiceDetail

_Generic invoice line table that bridges InvoiceHeader to part/unit/labor specific tables (SalePart, SaleUnit, etc.)._

- **ItemId** (INTEGER) _PK, NOT NULL_ — Foreign key into per-line tables (SalePart, SaleUnit, ...).
- **InvoiceDocId** (INTEGER) _NOT NULL_ — Foreign key to InvoiceHeader.
- **SegmentId** (INTEGER)
- **ItemType** (TEXT) _NOT NULL_ — values: MC, PA, QU, RE, RU, SL, TR, UN
- **LineNo** (INTEGER) _NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Qty** (NUMERIC) _NOT NULL_
- **Price** (NUMERIC) _NOT NULL_
- **PriceLocked** (INTEGER) _NOT NULL_
- **DiscountAmt** (NUMERIC) _NOT NULL_
- **DistDiscountAmt** (NUMERIC) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_
- **Taxable** (INTEGER) _NOT NULL_
- **Summary** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: ByronL, TerryN, KyleH, Admin, KevinP, DougM, JoeH, BrettN, JordanM, AndrewM, Hunter, Maddie
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KyleH, Admin, ByronL, TerryN, KevinP, JoeH, BrettN, DougM, AndrewM, JordanM, DebH, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **RentalSegmentId** (INTEGER)
- **Source** (TEXT) _NOT NULL_ — values: renthub, shelvedreceipt
- **SourceId** (INTEGER)
- **ListPrice** (NUMERIC)
- **DLPriceLocked** (INTEGER)
- **NewDLPrice** (NUMERIC)
- **ServiceContractGroupInvoiceDetailID** (INTEGER)

## InvoiceHeader

_One row per invoice document (sales, work order, rental). Revenue lives here as TotalInvoice when Status is finalized/archived._

- **InvoiceDocId** (INTEGER) _PK, NOT NULL_ — Primary key. Joins to InvoiceDetail, SalesTax, Payment.
- **DocNo** (TEXT) _NOT NULL_ — Human-readable document number (often shown to users). · aliases: doc number, document no
- **InvoiceNo** (TEXT) _NOT NULL_ — Customer-facing invoice number. · aliases: invoice number
- **QuoteNo** (TEXT) _NOT NULL_
- **ParentQuoteId** (INTEGER)
- **Status** (TEXT) _NOT NULL_ — Lifecycle status. For revenue use Status IN ('finalized','archived'); other values are not yet booked. · aliases: state, invoice status · values: finalized, archived, voided, quote, committed, draft
- **InvoiceType** (TEXT) _NOT NULL_ — Type code: 'in' = standard sale invoice, 'wo' = work order, 'rl' = rental. · aliases: type, invoice kind · values: in, wo, rl
- **JEHeaderId** (INTEGER)
- **ActivityDate** (TEXT) _NOT NULL_ — Primary date for time-series rollups. Stored as ISO-ish TEXT; use strftime('%Y-%m', ...) for monthly buckets. · aliases: date, transaction date, sale date
- **CustomerId** (INTEGER) _NOT NULL_ — Foreign key to Customer.CustomerId.
- **CustomerName** (TEXT) _NOT NULL_ — Denormalized customer name on the invoice. Prefer this for grouping by customer when only the invoice header is in scope. · aliases: account, client
- **CustomerNo** (TEXT) _NOT NULL_ — Customer code/account number.
- **BillingAdd1** (TEXT) _NOT NULL_
- **BillingAdd2** (TEXT) _NOT NULL_
- **SalesPersonId** (INTEGER) _NOT NULL_
- **SalesPersonName** (TEXT) _NOT NULL_ — Denormalized rep name. Empty string means 'Unassigned' — coalesce in dashboards. · aliases: sales rep, rep, ae, seller
- **CustomerAltAddressId** (INTEGER)
- **DeliverToShippingAddress** (INTEGER) _NOT NULL_
- **PORefNo** (TEXT)
- **POReq** (INTEGER) _NOT NULL_
- **DiscountPct** (NUMERIC) _NOT NULL_ — Discount as a percent of subtotal.
- **DiscountAmt** (NUMERIC) _NOT NULL_ — Total discount applied to the invoice. · aliases: discount, promo amount
- **TotalInvoice** (NUMERIC) _NOT NULL_ — Total invoice amount. SUM(TotalInvoice) filtered by POSTED_SALES is canonical 'revenue'. · aliases: amount, total, billed amount, invoice amount
- **LocationId** (INTEGER) _NOT NULL_ — Foreign key to SettingsLocation.LocationId.
- **BillingCity** (TEXT) _NOT NULL_
- **BillingState** (TEXT) _NOT NULL_ — values: NE, IA, SD, WI, ND, SC, TX, AR, NM, MI, MN, CO
- **BillingZip** (TEXT) _NOT NULL_
- **BillingCounty** (TEXT) _NOT NULL_
- **BillingCountry** (TEXT) _NOT NULL_ — values: US
- **BillingPhone** (TEXT) _NOT NULL_
- **BillingEmail** (TEXT) _NOT NULL_
- **LocTaxGroupId** (INTEGER)
- **Salutation** (TEXT) _NOT NULL_ — values: Mr, Dr, Scot, ik
- **FirstName** (TEXT) _NOT NULL_
- **MiddleName** (TEXT) _NOT NULL_
- **LastName** (TEXT) _NOT NULL_
- **Suffix** (TEXT) _NOT NULL_
- **ShippingAddress1** (TEXT) _NOT NULL_
- **ShippingAddress2** (TEXT) _NOT NULL_
- **ShippingCity** (TEXT) _NOT NULL_
- **ShippingState** (TEXT) _NOT NULL_ — values: IA, NE, SD, OH, TX, AR, TN, MN, UT, MT, MB
- **ShippingZip** (TEXT) _NOT NULL_
- **ShippingTaxGroupId** (INTEGER)
- **ShippingPhone** (TEXT) _NOT NULL_
- **County** (TEXT) _NOT NULL_ — values: Monona, Cumming, NE State, Woodbury, Wayne 1.5/NE State 5.5
- **ShippingCountry** (TEXT) _NOT NULL_
- **ZoneId** (INTEGER)
- **WeightKgs** (NUMERIC) _NOT NULL_
- **Dimensions** (TEXT) _NOT NULL_
- **PrintableComment** (TEXT) _NOT NULL_
- **NonPrintableComment** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_ — Soft-delete flag. Note that voided invoices keep IsActive=1; use Status, not IsActive, for revenue filters.
- **Internal** (INTEGER) _NOT NULL_
- **AltTaxGroupId** (INTEGER)
- **UsePrePrintedPaper** (INTEGER) _NOT NULL_
- **WODisplayText** (TEXT) _NOT NULL_
- **WODescription** (TEXT) _NOT NULL_
- **WOStatusId** (INTEGER) — Foreign key to SettingsWorkOrderStatus. Joins for human-readable WO status text.
- **WOTechId** (INTEGER)
- **WOPickupDate** (TEXT)
- **WODeliveryDate** (TEXT) — values: 2023-05-05 00:00:00
- **WOPriorityId** (INTEGER)
- **InvoiceFormat** (TEXT) _NOT NULL_ — values: counterstd, s-multiunit, h-multiunit, d-multiunit, countersimple1
- **WOEstimate** (NUMERIC) _NOT NULL_ — Work-order estimated total (set on WO creation). · aliases: estimate
- **WOUnitId** (INTEGER)
- **WOUnitDescription** (TEXT) _NOT NULL_
- **WOUnitNo** (TEXT) _NOT NULL_
- **WOMeterType** (TEXT) _NOT NULL_ — values: hours, hectare, sephours, miles, seasonsusd, kilometers, enginehrs
- **WOMeter** (NUMERIC) _NOT NULL_
- **WOMeterDate** (TEXT)
- **WOWarrantyDate** (TEXT) — values: 2018-12-21 00:00:00, 2020-03-09 00:00:00, 2023-05-24 00:00:00, 2022-09-06 00:00:00
- **WOUnitModel** (TEXT) _NOT NULL_
- **WOUnitTag** (TEXT) _NOT NULL_
- **WOUnitBaseSerial** (TEXT) _NOT NULL_
- **WOUnitIsNew** (INTEGER) _NOT NULL_
- **WOUnitIsAttachment** (INTEGER) _NOT NULL_
- **SigCapType** (TEXT) — values: none, devpresent, manual
- **CommittedDate** (TEXT)
- **CommittedBy** (TEXT) _NOT NULL_ — values: system, KyleH, Admin, TerryN, KevinP, JordanM, ByronL, DougM, AndrewM, JoeH, GregM, BrettN
- **FinalizedDate** (TEXT) — Timestamp when the invoice was finalized.
- **FinalizedBy** (TEXT) _NOT NULL_ — values: system, KyleH, Admin, TerryN, KevinP, JordanM, ByronL, DougM, AndrewM, JoeH, GregM, BrettN
- **ClosedDate** (TEXT)
- **ClosedBy** (TEXT) _NOT NULL_
- **VoidedDate** (TEXT)
- **VoidedBy** (TEXT) _NOT NULL_ — values: Admin, TerryN, ByronL, KyleH, KevinP, JordanM, AndrewM, DougM, JoeH, BrettN, GregM, Katie
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: system, TerryN, ByronL, KyleH, Admin, KevinP, JordanM, DougM, AndrewM, JoeH, CathyF, BrettN
- **EntDate** (TEXT) _NOT NULL_ — When the row was first entered. Used for WO age math.
- **EntBy** (TEXT) _NOT NULL_ — values: system, TerryN, KyleH, Admin, KevinP, ByronL, JordanM, DougM, AndrewM, JoeH, BrettN, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **DefaultDeliver** (INTEGER) _NOT NULL_
- **RentalTaxGroupId** (INTEGER)
- **OwnerId** (INTEGER)
- **WorksheetType** (TEXT) _NOT NULL_
- **WarrSubmissionTypeId** (INTEGER)
- **Source** (TEXT) _NOT NULL_ — values: 8798, RlReturn, copydocexact, copyrentalexact, copyrentalpartial, deposit-104402, deposit-106259, deposit-107065, deposit-107352, deposit-108354, deposit-108562, deposit-108705
- **SourceId** (INTEGER)
- **DefAltStockLocationId** (INTEGER)
- **IsReturnInvoice** (INTEGER)
- **ReturnInvoiceDocId** (INTEGER)
- **AltContactName** (TEXT)
- **AltContactPhone** (TEXT)
- **ShippingNote** (TEXT)
- **WOSearchType** (TEXT)
- **WOUnitNoSearchType** (TEXT) — values: stockno, customer, serial
- **ParentInvDocId** (INTEGER)
- **IsManualBillRecurr** (INTEGER)
- **PartOnOrderTaxTotal** (NUMERIC)
- **IsRentHubInvoice** (INTEGER)

## InvoiceMiscellaneousCharge

- **MiscChargeDetailId** (INTEGER) _PK, NOT NULL_
- **MiscChargeId** (INTEGER) _NOT NULL_
- **ItemId** (INTEGER) _NOT NULL_
- **MiscCharge** (TEXT) _NOT NULL_
- **Qty** (NUMERIC) _NOT NULL_
- **Deliver** (INTEGER) _NOT NULL_
- **UseAltTax** (INTEGER) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **DiscountAmt** (NUMERIC) _NOT NULL_
- **DiscountPct** (NUMERIC) _NOT NULL_
- **Price** (NUMERIC) _NOT NULL_
- **PriceLocked** (INTEGER) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_
- **TaxExemptReasonId** (INTEGER)
- **TaxExemptReasonDisplayText** (TEXT)
- **IsLabor** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: KyleH, ByronL, TerryN, JoeH, KevinP, Admin, DougM, JordanM, BrettN, GregM, KMiller, AndrewM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KyleH, ByronL, TerryN, JoeH, KevinP, Admin, DougM, JordanM, BrettN, GregM, KMiller, AndrewM
- **RowVersion** (BLOB) _NOT NULL_
- **PennyRoundingPaymentID** (INTEGER)

## InvoiceSegment

- **SegmentId** (INTEGER) _PK, NOT NULL_
- **InvDocId** (INTEGER) _NOT NULL_
- **LineNo** (INTEGER) _NOT NULL_
- **ItemId** (INTEGER) _NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Memo** (TEXT) _NOT NULL_
- **ActualHrs** (NUMERIC) _NOT NULL_
- **BillAs** (TEXT) _NOT NULL_ — values: flatrate, actual
- **FlatRateLaborHrs** (NUMERIC) _NOT NULL_
- **LaborRate** (NUMERIC) _NOT NULL_
- **LaborDiscPct** (NUMERIC) _NOT NULL_
- **LaborDiscAmt** (NUMERIC) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_
- **SvcCodeId** (INTEGER) _NOT NULL_
- **Status** (TEXT) _NOT NULL_ — values: Complete, complete, open, quote
- **Deliver** (INTEGER) _NOT NULL_
- **UseAltTax** (INTEGER) _NOT NULL_
- **LaborTaxExemptId** (INTEGER)
- **NonLaborTaxExemptId** (INTEGER)
- **ShopSuppAmt** (NUMERIC) _NOT NULL_
- **HasLabor** (INTEGER) _NOT NULL_
- **HasMiscCharge** (INTEGER) _NOT NULL_
- **HasParts** (INTEGER) _NOT NULL_
- **ShopFeeAmt** (NUMERIC) _NOT NULL_
- **ShopFeePct** (NUMERIC) _NOT NULL_
- **MaxShopFee** (NUMERIC) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: ByronL, JoeH, Admin, BrettN, KyleH, TerryN, DebH, GregM, KMiller, JordanM, AndrewM, KevinP
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: ByronL, JoeH, BrettN, Admin, TerryN, DebH, GregM, KevinP, JordanM, KMiller, AndrewM, CarterG
- **RowVersion** (BLOB) _NOT NULL_
- **StdJobSteps** (TEXT) _NOT NULL_
- **StdJobHeaderId** (INTEGER)
- **StdJobDescription** (TEXT) _NOT NULL_
- **StdJobSource** (TEXT) _NOT NULL_ — values: manual
- **StdJobCode** (TEXT) _NOT NULL_ — values: A3NV12022, B3BL11205, A3LJ38962, S205, A3NV11527, ALJU12232, A00311359, S595, E35, E85, S750, T750
- **StdJobRecommendedHrs** (NUMERIC)
- **StdJobUnitModelId** (INTEGER)
- **DefAltStockLocationId** (INTEGER)
- **WOUnitId** (INTEGER)
- **WOUnitDescription** (TEXT) _NOT NULL_
- **WOUnitNo** (TEXT) _NOT NULL_ — values: 350, 10547, 60, 10560, 11570, 12800, 11716, 12114, 10734, 13653, 11416, 15811
- **WOMeterType** (TEXT) _NOT NULL_ — values: hours
- **WOMeter** (NUMERIC) _NOT NULL_
- **WOMeterDate** (TEXT) — values: 2017-08-03 00:00:00, 2017-09-21 00:00:00, 2018-04-09 00:00:00, 2018-10-22 00:00:00, 2021-02-16 00:00:00, 2022-04-22 00:00:00, 2023-01-19 00:00:00, 2024-01-19 00:00:00, 2024-05-08 00:00:00
- **WOWarrantyDate** (TEXT)
- **WOUnitModel** (TEXT) _NOT NULL_ — values: S450, S130, T595, S630, S300, S64, E35, S205, UW56, S740, 84539381
- **WOUnitTag** (TEXT) _NOT NULL_ — values: B Machine
- **WOUnitBaseSerial** (TEXT) _NOT NULL_ — values: AUVB11301, 524614735, B3NK12933, A3NT11918, 525815113, B4SC11017, B3Y214404, B3NK33948, A3LJ36786, B4RC11229, B3BT11382, 309497
- **WOUnitIsNew** (INTEGER) _NOT NULL_
- **WOUnitIsAttachment** (INTEGER) _NOT NULL_
- **ShopSuppTaxExemptId** (INTEGER)

## PartGroup

- **PartGroupId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2017-05-31 15:15:37.367000, 2017-05-31 15:15:37.427000
- **ModBy** (TEXT) _NOT NULL_ — values: Install, Admin
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2017-05-31 15:15:37.367000, 2017-05-31 15:15:37.427000
- **EntBy** (TEXT) _NOT NULL_ — values: System, Install, Admin
- **RowVersion** (BLOB) _NOT NULL_

## PartLocation

- **PartLocationId** (INTEGER) _PK, NOT NULL_
- **LocationId** (INTEGER) _NOT NULL_
- **PartId** (INTEGER) _NOT NULL_
- **OFCCode** (TEXT) _NOT NULL_ — values: minmax, nonstock, bysales
- **LockOFCCode** (INTEGER) _NOT NULL_
- **OrderCodeGroupId** (INTEGER)
- **PriceClassId** (INTEGER)
- **Bin** (TEXT) _NOT NULL_
- **OverflowBin** (TEXT) _NOT NULL_ — values: USE 25K30816, SHOWROOM
- **MinStock** (INTEGER) _NOT NULL_
- **MaxStock** (INTEGER) _NOT NULL_
- **SeasonId** (INTEGER)
- **NonTaxId** (INTEGER)
- **AlwaysNonTax** (INTEGER) _NOT NULL_
- **AlwaysTaxable** (INTEGER) _NOT NULL_
- **Discountable** (TEXT) _NOT NULL_ — values: all, never
- **LastCountDate** (TEXT)
- **LocatorDate** (TEXT) _NOT NULL_
- **LastOFCUpdate** (TEXT)
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Maddie, CarterG, Hunter, TerryN, ByronL, Admin, Katie, JordanM, Rental, KyleH, DougM, JoeH
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, KyleH, TerryN, ByronL, DougM, JoeH, JordanM, AndrewM, KevinP, BrettN, GregM, KMiller
- **RowVersion** (BLOB) _NOT NULL_
- **AltPartNo** (TEXT) _NOT NULL_
- **CNHAmaxLastSentDate** (TEXT)
- **CNHAmaxAPRCode** (TEXT) _NOT NULL_ — values: A, a
- **CNHAmaxAPRSource** (TEXT) _NOT NULL_ — values: D, d
- **CNHAmaxAPRReqQty** (NUMERIC) _NOT NULL_
- **CNHAmaxAPRSeason** (TEXT) _NOT NULL_
- **BinZoneId** (INTEGER)
- **DaysForNextCount** (INTEGER) _NOT NULL_
- **SchedCount** (INTEGER) _NOT NULL_
- **SchedCountDate** (TEXT)

## PartManufacturer

_Lookup table for part manufacturers / brands._

- **MfgId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **SysMfgId** (INTEGER) _NOT NULL_
- **ProductLineId** (INTEGER) _NOT NULL_ — Joins to PartProductLine for product-line rollups.
- **DefaultPriceClassId** (INTEGER) _NOT NULL_
- **InventoryAccountId** (INTEGER) _NOT NULL_
- **InventoryDeptId** (INTEGER)
- **PartSalesAccountId** (INTEGER) _NOT NULL_
- **PartSalesDeptId** (INTEGER)
- **PartCostAccountId** (INTEGER) _NOT NULL_
- **PartCostDeptId** (INTEGER)
- **PartDiscountAccountId** (INTEGER) _NOT NULL_
- **PartDiscountDeptId** (INTEGER)
- **PartAdjustmentAccountId** (INTEGER) _NOT NULL_
- **PartAdjustmentDeptId** (INTEGER)
- **SvcSalesAccountId** (INTEGER) _NOT NULL_
- **SvcSalesDeptId** (INTEGER)
- **SvcCostAccountId** (INTEGER) _NOT NULL_
- **SvcCostDeptId** (INTEGER)
- **SvcDiscountAccountId** (INTEGER) _NOT NULL_
- **SvcDiscountDeptId** (INTEGER)
- **OrderCodeGroupId** (INTEGER)
- **MfgCode** (TEXT) _NOT NULL_ — Short code for the manufacturer. · values: ANS, ATT, BOB, INT, OTH
- **DisplayText** (TEXT) _NOT NULL_ — Human-readable manufacturer name. · aliases: manufacturer name, brand, oem
- **DefaultDLPBaseType** (TEXT) _NOT NULL_ — values: m
- **LastPriceUpdate** (TEXT) — values: 2026-04-07 03:31:55.617000
- **LastPriceUpdateBy** (TEXT) — values: System
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2023-11-09 12:29:56.513000, 2023-11-09 12:29:56.547000, 2023-11-09 15:40:57.693000, 2023-11-09 15:32:24.713000
- **ModBy** (TEXT) _NOT NULL_ — values: Katie
- **EntDate** (TEXT) _NOT NULL_ — values: 2017-05-31 15:08:05.690000, 2017-05-31 15:14:47.163000, 2017-05-31 15:14:47.183000, 2017-05-31 15:14:47.187000, 2017-07-26 11:28:08.133000
- **EntBy** (TEXT) _NOT NULL_ — values: Admin
- **RowVersion** (BLOB) _NOT NULL_
- **ExcessSalesSupplyDays** (INTEGER) _NOT NULL_
- **DaysForNextCount** (INTEGER) _NOT NULL_
- **SchedCount** (INTEGER) _NOT NULL_
- **ExchangeRateId** (INTEGER)

## PartMaster

_Part master. PartNo is the natural key users speak in._

- **PartId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **MfgId** (INTEGER) _NOT NULL_ — Joins to PartManufacturer for brand/manufacturer label.
- **OEMId** (INTEGER)
- **ReturnId** (INTEGER) _NOT NULL_
- **PriceClassId** (INTEGER) _NOT NULL_
- **DLPBaseType** (TEXT) _NOT NULL_ — values: m
- **CommodityId** (INTEGER)
- **PartGroupId** (INTEGER) — Joins to PartGroup.
- **CorePartId** (INTEGER)
- **CurrentStockingPartId** (INTEGER)
- **OrderCodeGroupId** (INTEGER)
- **PartStatus** (TEXT) _NOT NULL_ — Active/inactive lifecycle marker for the part. · values: A, I
- **PartType** (TEXT) _NOT NULL_ — Part-type code (e.g., regular, kit, labor). · values: r, c, n
- **PartNo** (TEXT) _NOT NULL_ — Part number (catalog / SKU). · aliases: sku, part number
- **Description** (TEXT) _NOT NULL_ — Short description shown on invoices.
- **UPC** (TEXT) _NOT NULL_
- **PkgQty** (INTEGER) _NOT NULL_
- **ConversionFactor** (NUMERIC) _NOT NULL_
- **OrderCriteria** (TEXT) _NOT NULL_ — values: ORDER 30, ORDER 50
- **MiscUserDefined1** (TEXT) _NOT NULL_
- **MiscUserDefined2** (TEXT) _NOT NULL_
- **UpdateMSRPViaPF** (INTEGER) _NOT NULL_
- **Weight** (NUMERIC) _NOT NULL_
- **NoUpdateOnHand** (INTEGER) _NOT NULL_
- **Serialized** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_ — 1 = active in catalog.
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: System, TerryN, Hunter, ByronL, Admin, JordanM, CarterG, Rental, Katie, KevinP, KyleH, DougM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, KyleH, System, ByronL, DougM, TerryN, JordanM, Katie, Hunter, CarterG
- **RowVersion** (BLOB) _NOT NULL_
- **POSNotification** (TEXT) _NOT NULL_ — values: Use part number 6729776PK., Use Part 7322705, Use 7101736
- **AltPartNo** (TEXT) _NOT NULL_
- **MiscUserDefined3** (TEXT) _NOT NULL_
- **MiscUserDefined4** (TEXT) _NOT NULL_
- **MiscUserDefined5** (TEXT) _NOT NULL_
- **PartSource** (TEXT) _NOT NULL_
- **UpdateDescViaPF** (INTEGER) _NOT NULL_
- **Dimensions** (TEXT) _NOT NULL_
- **MfgInfo** (TEXT) _NOT NULL_
- **CreateUnit** (INTEGER) _NOT NULL_
- **UnitMake** (TEXT) _NOT NULL_
- **UnitModel** (TEXT) _NOT NULL_
- **UnitYear** (INTEGER) _NOT NULL_
- **UnitConditionId** (INTEGER)
- **UnitCategoryId** (INTEGER)
- **SearchPartNo** (TEXT)
- **IsKubotaLink** (INTEGER)
- **iskubotacanadalink** (INTEGER)
- **KubotaSaleStatus** (TEXT)

## PartProductLine

- **ProductLineId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2016-03-11 10:01:15.357000, 2017-05-31 15:02:37.690000, 2017-05-31 15:02:37.810000, 2016-03-11 10:01:14.233000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2017-05-31 15:02:37.810000
- **EntBy** (TEXT) _NOT NULL_ — values: Install, Admin
- **RowVersion** (BLOB) _NOT NULL_

## Payment

_Payment receipts. Filter Payment.IsActive=1 for valid rows._

- **InvoiceDocId** (INTEGER) _NOT NULL_ — Invoice the payment was applied to.
- **PaymentMethodId** (INTEGER) _NOT NULL_ — Joins to PaymentMethod for human-readable method.
- **PaymentId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **PmtType** (TEXT) _NOT NULL_ — Payment-type code. · aliases: method code · values: apvouch, chargeitpro, deposit, gl, mancc, recv, recvpmt, unit
- **DisplayText** (TEXT) _NOT NULL_
- **Amount** (NUMERIC) _NOT NULL_ — Payment amount collected. · aliases: amount paid, receipt
- **Summary** (TEXT) _NOT NULL_
- **Authorized** (INTEGER) _NOT NULL_
- **Internal** (INTEGER) _NOT NULL_
- **AcctId** (INTEGER)
- **DeptId** (INTEGER)
- **SigCapType** (TEXT) _NOT NULL_ — values: none, devpresent, manual
- **IsActive** (INTEGER) _NOT NULL_ — 1 = active payment row. Voided/reversed rows are 0 — always filter.
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: system, KyleH, ByronL, Admin, TerryN, KevinP, JordanM, DougM, AndrewM, JoeH, BrettN, Hunter
- **EntDate** (TEXT) _NOT NULL_ — When the payment was entered. Use for time-series of receipts.
- **EntBy** (TEXT) _NOT NULL_ — values: system, KyleH, ByronL, Admin, TerryN, KevinP, JordanM, DougM, AndrewM, JoeH, BrettN, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **StdLang** (TEXT) _NOT NULL_ — values: Charitable Contribution, 501(c) Tax Ded Contribution, Charitable Donation - Not Tax Deductible
- **Source** (TEXT) _NOT NULL_ — values: roaautoapply, changedue, warrcredit, roacredit, RentHub
- **SourceId** (INTEGER)
- **EmergePayPayment** (INTEGER) _NOT NULL_

## PaymentMethod

- **PaymentMethodId** (INTEGER) _PK, NOT NULL_
- **ParentPaymentMethodId** (INTEGER)
- **Restricted** (INTEGER) _NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **PayType** (TEXT) _NOT NULL_ — values: apvouch, chargeitpro, deposit, gl, mancc, recv, recvpmt, unit
- **SetByCustomer** (INTEGER) _NOT NULL_
- **AcctId** (INTEGER) _NOT NULL_
- **DeptId** (INTEGER)
- **UseLoc00** (INTEGER) _NOT NULL_
- **ReduceTaxBasis** (INTEGER) _NOT NULL_
- **CashTender** (INTEGER) _NOT NULL_
- **StdLang** (TEXT) _NOT NULL_ — values: 501(c) Tax Ded Contribution, Charitable Donation - Not Tax Deductible, CC payment made through CRM link., Customer Bad Debt Write-Off
- **SigCapType** (TEXT) _NOT NULL_ — values: none, manual, devpresent
- **Internal** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2017-05-31 15:46:50.873000, 2025-12-23 12:33:23.597000, 2025-12-23 12:33:23.567000, 2025-12-23 12:33:23.643000, 2017-06-13 01:09:46.680000, 2017-07-10 17:28:40.920000, 2017-05-31 15:54:51.027000, 2024-04-09 17:19:25.840000, 2017-06-14 23:20:56.580000, 2017-06-02 11:38:18.563000, 2017-06-13 10:28:03.417000, 2017-06-13 10:28:03.447000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Katie, JordanM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Install, Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_

## PaymentReceivablesDetail

- **DetailId** (INTEGER) _PK, NOT NULL_
- **PaymentId** (INTEGER) _NOT NULL_
- **BillToCustomerId** (INTEGER) _NOT NULL_
- **BillToCustomerName** (TEXT) _NOT NULL_
- **BillToCustomerNo** (TEXT) _NOT NULL_
- **ShowPORefNo** (INTEGER) _NOT NULL_
- **PORefNoReq** (INTEGER) _NOT NULL_
- **PORefNoMinLen** (INTEGER) _NOT NULL_
- **PORefNo** (TEXT)
- **DaysDue** (INTEGER) _NOT NULL_
- **FinanceChargeRate** (NUMERIC) _NOT NULL_
- **AllowSplit** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: system, ByronL, Admin, TerryN, KevinP, KyleH, JordanM, DougM, AndrewM, JoeH, BrettN, KMiller
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: system, ByronL, Admin, TerryN, KevinP, KyleH, JordanM, DougM, AndrewM, JoeH, BrettN, KMiller
- **RowVersion** (BLOB) _NOT NULL_

## QuoteDetails

- **InvoiceDocId** (INTEGER) _PK, NOT NULL_
- **QuoteStatus** (TEXT) _NOT NULL_ — values: unqualified, inactive, won, salescontract
- **ClosureReasonId** (INTEGER)
- **ClosureDate** (TEXT)
- **ClosureComment** (TEXT) _NOT NULL_
- **SalesContractDate** (TEXT)
- **InvoiceFinalizedDate** (TEXT)
- **ClosedDocId** (INTEGER)
- **ExpectedClosedDate** (TEXT) — values: 2010-09-14 00:00:00
- **ExpiredDate** (TEXT) — values: 2010-09-14 00:00:00
- **PreviousVersionInvDocId** (INTEGER)
- **Confidence** (NUMERIC) _NOT NULL_
- **RowVersion** (BLOB) _NOT NULL_

## RentalContract

- **RentalContractId** (INTEGER) _PK, NOT NULL_
- **InvoiceDocId** (INTEGER) _NOT NULL_
- **ParentContractId** (INTEGER)
- **ContractNo** (TEXT) _NOT NULL_
- **ContractStatus** (TEXT) _NOT NULL_ — values: cancel, complete, deliv, init, res
- **TransactionType** (TEXT) _NOT NULL_ — values: adjust, bill, deposit, parent, return
- **RecurringFreq** (TEXT) _NOT NULL_ — values: month28, month, week
- **NextRecurringBillingDate** (TEXT)
- **BillingStart** (TEXT)
- **BillingEnd** (TEXT)
- **EstPickup** (TEXT) — values: 2026-04-30 18:43:10.720000
- **EstDelivery** (TEXT)
- **ResvGroupId** (INTEGER)
- **Delivered** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: KevinP, system, KyleH, Admin, JordanM, TerryN, AndrewM, DougM, ByronL, KMiller, Hunter, Katie
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KevinP, KyleH, Admin, JordanM, TerryN, AndrewM, ByronL, KMiller, Hunter, Katie, CarterG, Rental
- **RowVersion** (BLOB) _NOT NULL_
- **RentHubReservationId** (INTEGER)

## RentalGroup

- **RentalGroupId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **DepreciationPct** (NUMERIC) _NOT NULL_
- **AddlCapacity** (INTEGER) _NOT NULL_
- **RentalCOSAcctId** (INTEGER) _NOT NULL_
- **RentalCOSDeptId** (INTEGER)
- **RentalDiscAcctId** (INTEGER) _NOT NULL_
- **RentalDiscDeptId** (INTEGER)
- **RentalRevAcctId** (INTEGER) _NOT NULL_
- **RentalRevDeptId** (INTEGER)
- **LocationId** (INTEGER)
- **UnitGroupId** (INTEGER)
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2017-06-05 12:28:37.303000, 2017-06-05 12:28:37.320000, 2017-06-12 11:27:16.957000, 2017-06-05 12:28:37.287000, 2017-06-05 11:09:27.537000, 2017-06-05 12:28:37.240000, 2024-07-01 17:18:11.343000, 2019-04-23 11:40:58.347000, 2020-03-03 14:49:08.567000, 2020-03-03 14:49:08.600000, 2023-11-07 16:15:13.517000, 2020-12-29 13:55:05.780000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Katie, JordanM
- **EntDate** (TEXT) _NOT NULL_ — values: 2017-06-05 10:13:13.263000, 2017-06-05 10:13:13.327000, 2017-06-05 10:13:13.340000, 2017-06-05 10:13:13.357000, 2017-06-22 14:48:01.573000, 2019-04-23 11:40:03.580000, 2020-03-03 14:47:32.927000, 2020-03-03 14:47:32.957000, 2020-09-15 13:44:12.447000, 2020-12-29 13:55:05.780000, 2021-12-08 12:45:10.063000, 2023-11-07 16:16:53.760000
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_
- **UnitCostGroupId** (INTEGER)

## RentalRateMatrix

- **RentalRateMatrixId** (INTEGER) _PK, NOT NULL_
- **LocationId** (INTEGER)
- **DisplayText** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2017-06-12 11:22:31.850000, 2017-06-12 11:22:31.893000, 2017-06-12 11:22:31.897000, 2017-06-12 16:51:21.030000, 2019-12-16 15:26:22.980000, 2017-06-12 11:22:31.900000, 2021-09-23 14:24:12.183000, 2017-06-12 11:22:31.903000, 2017-06-12 11:22:31.907000, 2017-06-12 11:22:31.910000, 2017-06-12 11:22:31.913000, 2017-06-12 11:22:31.917000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Katie, JordanM
- **EntDate** (TEXT) _NOT NULL_ — values: 2017-06-05 10:25:51.127000, 2017-06-05 12:31:19.233000, 2017-06-05 13:11:08.657000, 2017-06-05 13:15:31.457000, 2017-06-05 13:27:26.737000, 2017-06-05 13:34:25.697000, 2017-06-05 13:40:37.863000, 2017-06-05 13:52:13.603000, 2017-06-05 13:55:59.417000, 2017-06-05 14:01:56.150000, 2017-06-05 14:04:15.107000, 2017-06-05 19:46:04.227000
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_
- **CustomRate** (INTEGER)

## RentalUnit

- **RentalUnitId** (INTEGER) _PK, NOT NULL_
- **ItemId** (INTEGER) _NOT NULL_
- **UnitId** (INTEGER) _NOT NULL_
- **StockNo** (TEXT) _NOT NULL_
- **CategoryCode** (TEXT) _NOT NULL_ — values: REN, USD, BCE, BCA, OTH
- **Deliver** (INTEGER) _NOT NULL_
- **UseAltTax** (INTEGER) _NOT NULL_
- **RentalUseTax** (INTEGER) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Discountamt** (NUMERIC) _NOT NULL_
- **DiscountPct** (NUMERIC) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_
- **NetExtLock** (INTEGER) _NOT NULL_
- **TaxExemptReasonId** (INTEGER)
- **TaxExemptReasonDisplayText** (TEXT)
- **Model** (TEXT) _NOT NULL_
- **IsAttachment** (INTEGER) _NOT NULL_
- **BaseSerial** (TEXT) _NOT NULL_
- **IsNew** (INTEGER) _NOT NULL_
- **Tag** (TEXT) _NOT NULL_
- **DepreciationAmt** (NUMERIC) _NOT NULL_
- **SalvageValue** (NUMERIC) _NOT NULL_
- **IsReturned** (INTEGER) _NOT NULL_
- **DepreciationPct** (NUMERIC) _NOT NULL_
- **RentalCOSAcctId** (INTEGER)
- **RentalCOSDeptId** (INTEGER)
- **RentalDiscAcctId** (INTEGER)
- **RentalDiscDeptId** (INTEGER)
- **RentalRevAcctId** (INTEGER)
- **RentalRevDeptId** (INTEGER)
- **InventoryAcctId** (INTEGER)
- **InventoryDeptId** (INTEGER)
- **ClearingAcctId** (INTEGER)
- **ClearingDeptId** (INTEGER)
- **UnitGroupId** (INTEGER)
- **RateMatrixItemDisplayText** (TEXT) _NOT NULL_
- **OverageRate** (NUMERIC) _NOT NULL_
- **MeterAllowancePerDuration** (NUMERIC) _NOT NULL_
- **MeterUnit** (TEXT) _NOT NULL_ — values: hours
- **MeterRate** (NUMERIC) _NOT NULL_
- **MinChargeAmt** (NUMERIC) _NOT NULL_
- **RateAmtPerDuration** (NUMERIC) _NOT NULL_
- **RentalDuration** (TEXT) _NOT NULL_ — values: day, week, mon, hour
- **StartDate** (TEXT)
- **EndDate** (TEXT)
- **ReturnDate** (TEXT)
- **DurationQty** (NUMERIC) _NOT NULL_
- **OrigDurationQty** (NUMERIC)
- **MeterBegin** (NUMERIC) _NOT NULL_
- **MeterEnd** (NUMERIC) _NOT NULL_
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KevinP, KyleH, Admin, JordanM, TerryN, AndrewM, ByronL, KMiller, Hunter, Katie, CarterG, Rental
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: KevinP, KyleH, Admin, JordanM, TerryN, AndrewM, ByronL, KMiller, Hunter, Katie, CarterG, Rental
- **RowVersion** (BLOB) _NOT NULL_
- **ReturnedAgainstRentalUnitId** (INTEGER)
- **IsContractDurationApplied** (INTEGER)
- **IsFromAvailability** (INTEGER) _NOT NULL_

## SalePart

_Part-level invoice line items. Join via InvoiceDetail to InvoiceHeader for date/customer._

- **PartsDetailId** (INTEGER) _PK, NOT NULL_
- **PartId** (INTEGER) _NOT NULL_ — Foreign key to PartMaster.
- **ItemId** (INTEGER) _NOT NULL_ — Joins to InvoiceDetail.ItemId.
- **PartNo** (TEXT) _NOT NULL_ — Denormalized part number on the line. · aliases: sku
- **QtyRequested** (NUMERIC) _NOT NULL_
- **Qty** (NUMERIC) _NOT NULL_ — Quantity sold. · aliases: quantity, units
- **Deliver** (INTEGER) _NOT NULL_
- **UseAltTax** (INTEGER) _NOT NULL_
- **Description** (TEXT) _NOT NULL_ — Description shown on the line.
- **DiscountAmt** (NUMERIC) _NOT NULL_
- **DiscountPct** (NUMERIC) _NOT NULL_
- **UnitPrice** (NUMERIC) _NOT NULL_
- **PriceLocked** (INTEGER) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_ — Net extended line revenue (price * qty net of discount). Canonical 'parts revenue'. · aliases: line revenue, net amount, extended
- **TaxExemptReasonId** (INTEGER)
- **TaxExemptReasonDisplayText** (TEXT)
- **WeightKg** (NUMERIC) _NOT NULL_
- **MfgId** (INTEGER) _NOT NULL_ — Manufacturer fk for this line.
- **MfgCode** (TEXT) _NOT NULL_ — Denormalized manufacturer code. · values: BOB, OTH, ATT, INT, ANS
- **Serialized** (INTEGER) _NOT NULL_
- **SerialNo** (TEXT) _NOT NULL_ — values: A8WB02047, A00W07062, 944255996, A7DD11702
- **AvgCost** (NUMERIC) — Average cost at time of sale. Used for margin: (NetExt - Qty*AvgCost) / NetExt. · aliases: cost, avg cost
- **AcctId** (INTEGER)
- **DeptId** (INTEGER)
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: ByronL, Admin, KyleH, TerryN, KevinP, JoeH, AndrewM, DougM, JordanM, BrettN, Hunter, Maddie
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KyleH, ByronL, Admin, TerryN, KevinP, JoeH, AndrewM, DougM, JordanM, BrettN, DebH, GregM
- **RowVersion** (BLOB) _NOT NULL_
- **ShelfLocation** (TEXT) _NOT NULL_
- **AltStockLocationId** (INTEGER)
- **DealerListPrice** (NUMERIC)
- **DLPriceLocked** (INTEGER)
- **NewDLPrice** (NUMERIC)

## SaleUnit

- **UnitsDetailId** (INTEGER) _PK, NOT NULL_
- **UnitId** (INTEGER) _NOT NULL_
- **ItemId** (INTEGER) _NOT NULL_
- **StockNo** (TEXT) _NOT NULL_
- **CategoryCode** (TEXT) _NOT NULL_ — values: USD, BCE, REN, OTH, BCA, CON
- **DeliveryDate** (TEXT) _NOT NULL_
- **Qty** (NUMERIC) _NOT NULL_
- **Deliver** (INTEGER) _NOT NULL_
- **UseAltTax** (INTEGER) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Discountamt** (NUMERIC) _NOT NULL_
- **DiscountPct** (NUMERIC) _NOT NULL_
- **Price** (NUMERIC) _NOT NULL_
- **PriceLocked** (INTEGER) _NOT NULL_
- **NetExt** (NUMERIC) _NOT NULL_
- **TaxExemptReasonId** (INTEGER)
- **TaxExemptReasonDisplayText** (TEXT)
- **PrintOptions** (INTEGER) _NOT NULL_
- **Model** (TEXT) _NOT NULL_
- **IsAttachment** (INTEGER) _NOT NULL_
- **BaseSerial** (TEXT) _NOT NULL_
- **WarrantyDate** (TEXT) — values: 2018-12-21 00:00:00, 2020-03-09 00:00:00, 2020-04-22 00:00:00, 2020-06-15 00:00:00, 2021-09-09 00:00:00, 2022-09-06 00:00:00, 2023-05-24 00:00:00, 2023-11-16 00:00:00
- **IsNew** (INTEGER) _NOT NULL_
- **Tag** (TEXT) _NOT NULL_
- **AcctId** (INTEGER)
- **DeptId** (INTEGER)
- **InvoiceCost** (NUMERIC)
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, DougM, AndrewM, KevinP, JordanM, TerryN, KyleH, KMiller, ByronL, Hunter, Katie, CarterG
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, KevinP, DougM, AndrewM, JordanM, TerryN, KyleH, KMiller, ByronL, Hunter, Katie, CarterG
- **RowVersion** (BLOB) _NOT NULL_
- **QuotedUnitId** (INTEGER)

## SaleUnitTradeIn

- **TradeDetailId** (INTEGER) _PK, NOT NULL_
- **UnitId** (INTEGER) _NOT NULL_
- **ItemId** (INTEGER) _NOT NULL_
- **StockNo** (TEXT) _NOT NULL_
- **Retail** (NUMERIC) _NOT NULL_
- **OverAllowance** (NUMERIC) _NOT NULL_
- **TradeValue** (NUMERIC) _NOT NULL_
- **CategoryId** (INTEGER) _NOT NULL_
- **ConditionId** (INTEGER) _NOT NULL_
- **Tag** (TEXT) _NOT NULL_
- **MeterUnit** (TEXT) _NOT NULL_ — values: hours, hectare, miles, enginehrs
- **MeterReading** (NUMERIC) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Model** (TEXT) _NOT NULL_
- **IsAttachment** (INTEGER) _NOT NULL_
- **BaseSerial** (TEXT) _NOT NULL_
- **TaxNetOfTrade** (INTEGER) _NOT NULL_
- **ApplicableUnitId** (INTEGER)
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: DougM, JordanM, KevinP, Admin, TerryN, KMiller, AndrewM, Katie, CathyF, Maddie, ByronL, KyleH
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: KevinP, DougM, JordanM, Admin, TerryN, KMiller, AndrewM, Katie, CathyF, Rental, Maddie, Hunter
- **RowVersion** (BLOB) _NOT NULL_
- **InventoryValue** (NUMERIC) _NOT NULL_
- **EstimatedReconditionExpense** (NUMERIC) _NOT NULL_
- **EstimatedPayoff** (NUMERIC) _NOT NULL_
- **ApplicableUnitType** (TEXT) _NOT NULL_ — values: unit, quotedunit
- **ApplicableQuotedUnitId** (INTEGER)
- **TradeValuation** (TEXT) _NOT NULL_ — values: tradevalue, invvalue

## SalesTax

_Sales tax rows attached to invoices via InvoiceDocId._

- **InvoiceDocId** (INTEGER) _NOT NULL_ — Foreign key to InvoiceHeader.
- **TaxId** (INTEGER) _PK, NOT NULL_
- **JurisdictionId** (INTEGER) _NOT NULL_
- **JurisdictionDisplayText** (TEXT) _NOT NULL_ — Tax jurisdiction label. · aliases: jurisdiction
- **TaxableAmount** (NUMERIC) _NOT NULL_ — Portion of the invoice that was taxable.
- **NonTaxableAmount** (NUMERIC) — Portion that was non-taxable.
- **TotalSales** (NUMERIC) _NOT NULL_
- **TotalTax** (NUMERIC) _NOT NULL_ — Tax amount on the invoice. · aliases: tax, sales tax
- **TotalTrade** (NUMERIC) _NOT NULL_
- **Deliver** (INTEGER) _NOT NULL_
- **AltTax** (INTEGER) _NOT NULL_
- **RentalUseTax** (INTEGER) _NOT NULL_
- **AcctId** (INTEGER)
- **DeptId** (INTEGER)
- **RowVersion** (BLOB) _NOT NULL_
- **PrintInvAs** (TEXT) _NOT NULL_

## SettingsDepartment

- **DepartmentID** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **GLNo** (TEXT) _NOT NULL_ — values: 20, 30, 40
- **Enabled** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00
- **ModBy** (TEXT) _NOT NULL_ — values: Install
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00
- **EntBy** (TEXT) _NOT NULL_ — values: Install
- **RowVersion** (BLOB) _NOT NULL_

## SettingsLocation

_Branch / location lookup._

- **LocationId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **DisplayText** (TEXT) _NOT NULL_ — Branch label for charts. · aliases: branch, store name, site
- **CompanyName** (TEXT) _NOT NULL_
- **GLNo** (TEXT) _NOT NULL_ — values: 01
- **Addr1** (TEXT) _NOT NULL_
- **Addr2** (TEXT) _NOT NULL_
- **City** (TEXT) _NOT NULL_ — values: Sioux City
- **State** (TEXT) _NOT NULL_ — values: IA
- **Zip** (TEXT) _NOT NULL_ — values: 51105
- **County** (TEXT) _NOT NULL_ — values: Woodbury
- **Country** (TEXT) _NOT NULL_ — values: US
- **Phone** (TEXT) _NOT NULL_
- **FaxNo** (TEXT) _NOT NULL_ — values: 555-0100
- **WebAddr** (TEXT) _NOT NULL_
- **EmailAddr** (TEXT) _NOT NULL_
- **TaxGroupId** (INTEGER)
- **TaxExemptId** (INTEGER)
- **IsActive** (INTEGER) _NOT NULL_ — 1 = currently operating.
- **ModDate** (TEXT) _NOT NULL_ — values: 2026-04-06 11:35:08.590000
- **ModBy** (TEXT) _NOT NULL_ — values: Katie
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00
- **EntBy** (TEXT) _NOT NULL_ — values: Install
- **RowVersion** (BLOB) _NOT NULL_
- **DefaultPOSCustomerId** (INTEGER)
- **ConsoleLockoutMin** (INTEGER) _NOT NULL_
- **EverestDealerID** (INTEGER)

## SettingsSalesTaxJurisdiction

- **TaxJurisdictionId** (INTEGER) _PK, NOT NULL_
- **GLChartId** (INTEGER) _NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **CalcLevel** (INTEGER) _NOT NULL_
- **PerItemFlag** (INTEGER) _NOT NULL_
- **PostSummaryTaxHistory** (INTEGER) _NOT NULL_
- **Labor** (INTEGER) _NOT NULL_
- **Units** (INTEGER) _NOT NULL_
- **Parts** (INTEGER) _NOT NULL_
- **RentalTaxCode** (TEXT) — values: sales
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2024-01-19 14:50:42.113000, 2024-01-19 14:52:13.563000, 2024-01-19 14:58:04.730000, 2024-01-19 14:59:15.967000, 2020-06-09 15:13:51.273000, 2024-01-19 14:50:42.130000, 2024-01-19 14:54:29.843000, 2025-06-13 13:12:52.760000, 2023-07-10 14:22:17.487000, 2024-01-19 14:59:15.983000, 2020-10-07 10:25:22.083000, 2020-06-09 15:05:54.390000
- **ModBy** (TEXT) _NOT NULL_ — values: Katie, Admin, JordanM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_
- **PrintInvAs** (TEXT) _NOT NULL_
- **ServiceContract** (INTEGER)

## SettingsSalesTaxRate

- **TaxRateId** (INTEGER) _PK, NOT NULL_
- **TaxJurisdictionId** (INTEGER) _NOT NULL_
- **MinAmt** (NUMERIC) _NOT NULL_
- **MaxAmt** (NUMERIC)
- **TaxPercent** (NUMERIC) _NOT NULL_
- **BaseAmount** (NUMERIC) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, DougM, Katie, JordanM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, JordanM, Katie
- **RowVersion** (BLOB) _NOT NULL_

## SettingsStateProvince

- **StateId** (INTEGER) _PK, NOT NULL_
- **Abbrev** (TEXT) _NOT NULL_
- **Name** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2018-12-07 11:32:58.200000, 2018-12-07 11:33:07.263000, 2018-12-07 11:33:13.153000, 2018-12-07 11:33:19.840000, 2018-12-07 11:33:25.777000, 2018-12-07 11:33:29.717000, 2017-05-31 14:57:12.783000, 2018-12-07 11:33:53.153000, 2018-12-07 11:33:36.670000, 2018-12-07 11:33:42.967000, 2018-12-07 11:33:48.590000, 2018-12-07 11:34:04.403000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Install
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2010-09-21 00:00:00
- **EntBy** (TEXT) _NOT NULL_ — values: Install
- **RowVersion** (BLOB) _NOT NULL_

## SettingsWorkOrderStatus

- **WorkOrderStatusId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **IsDefault** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2013-11-26 15:28:19.233000, 2017-06-05 09:39:43.567000, 2017-06-05 09:39:43.617000, 2017-06-20 13:56:35.183000, 2017-06-20 14:13:42.480000, 2018-10-09 09:21:05.667000, 2018-11-20 15:31:14.320000, 2021-04-27 14:08:01.357000, 2022-12-22 14:33:07.117000, 2023-01-07 13:21:25.657000, 2023-02-02 12:22:42.023000
- **ModBy** (TEXT) _NOT NULL_ — values: Install, Admin, ByronL, Katie
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2013-11-26 15:28:19.233000, 2017-06-05 09:39:43.567000, 2017-06-05 09:39:43.617000, 2017-06-20 13:56:35.183000, 2017-06-20 14:13:42.480000, 2018-10-09 09:21:05.667000, 2018-11-20 15:31:14.320000, 2021-04-27 14:08:01.357000, 2022-12-22 14:33:07.117000, 2023-01-07 13:21:25.657000, 2023-02-02 12:22:42.023000
- **EntBy** (TEXT) _NOT NULL_ — values: Install, Admin, ByronL, Katie
- **RowVersion** (BLOB) _NOT NULL_

## UnitBase

_Unit inventory master (machines on the lot). Use IsActive=1 for current stock count._

- **UnitId** (INTEGER) _PK, NOT NULL_ — Primary key.
- **StockNo** (TEXT) _NOT NULL_ — Stock number assigned at receiving. · aliases: stock number
- **UnitCategoryId** (INTEGER) _NOT NULL_ — Joins to UnitCategory for category/product-line label.
- **UnitConditionId** (INTEGER) _NOT NULL_ — Joins to UnitCondition (new/used/etc).
- **UnitGroupId** (INTEGER)
- **OtherStatusId** (INTEGER)
- **LocationId** (INTEGER) _NOT NULL_ — Branch where the unit is held (SettingsLocation).
- **ParentUnitId** (INTEGER)
- **Make** (TEXT) _NOT NULL_ — Manufacturer / make on the unit (free-text). · aliases: manufacturer, brand, oem
- **StockStatus** (TEXT) _NOT NULL_ — Current stock status label. · aliases: status, lot status · values: customer, expected, instock
- **Rental** (INTEGER) _NOT NULL_ — 1 if the unit is in the rental fleet.
- **Attachment** (INTEGER) _NOT NULL_
- **BaseSerial** (TEXT) _NOT NULL_
- **BaseWarrantyDate** (TEXT) — values: 2018-12-21 00:00:00, 2020-04-22 00:00:00, 2020-03-09 00:00:00, 2020-06-15 00:00:00, 2021-09-09 00:00:00, 2022-01-14 00:00:00, 2022-09-06 00:00:00, 2023-05-24 00:00:00, 2023-11-16 00:00:00
- **Model** (TEXT) _NOT NULL_ — Model designation.
- **Tag** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Year** (INTEGER) _NOT NULL_ — Model year.
- **MiscUserDefined1** (TEXT)
- **MiscUserDefined2** (TEXT)
- **PrintOptions** (INTEGER) _NOT NULL_
- **SKU** (TEXT) _NOT NULL_
- **StockArea** (TEXT) _NOT NULL_ — values: 1500
- **BaseRetail** (NUMERIC) _NOT NULL_ — Retail price. · aliases: price, retail
- **BaseCost** (NUMERIC) _NOT NULL_ — Cost basis.
- **MarginPct** (NUMERIC) _NOT NULL_
- **MarginMarkup** (NUMERIC) _NOT NULL_
- **DateOrdered** (TEXT)
- **DatePurchased** (TEXT)
- **OrderRefNo** (TEXT) _NOT NULL_
- **DateReceived** (TEXT)
- **ReminderDate** (TEXT)
- **IsActive** (INTEGER) _NOT NULL_ — 1 if the unit is active in inventory. Use this for 'units in stock'.
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: KevinP, system, CathyF, Admin, ByronL, JordanM, Katie, JoeH, KMiller, AndrewM, BrettN, Hunter
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, ByronL, KevinP, JoeH, BrettN, DougM, JordanM, TerryN, DebH, KyleH, GregM, KMiller
- **RowVersion** (BLOB) _NOT NULL_
- **CurrentCustomerId** (INTEGER) — If currently sold/rented, the customer. NULL means still in stock.
- **AltUnitNo** (TEXT) _NOT NULL_
- **LastSentStockStatusDTF** (TEXT) _NOT NULL_
- **UnitChangedDateJDSC** (TEXT)
- **SalvageValue** (NUMERIC) _NOT NULL_
- **TaxRegistrationExpDate** (TEXT)
- **TaxUnitRegNo** (TEXT) _NOT NULL_
- **RentalGroupId** (INTEGER)
- **SubjectToRentalUseTax** (INTEGER) _NOT NULL_
- **WeightKg** (NUMERIC) _NOT NULL_
- **POSNotification** (TEXT) — values: 2/28/2019 - 706.4 hours, Ron bought from someone else
- **OrderLineId** (INTEGER)
- **RegistrationDate** (TEXT)
- **RentalUtilizationGroupId** (INTEGER)
- **RentalFleetDate** (TEXT) — values: 2023-06-06 00:00:00, 2022-06-29 00:00:00, 2022-05-03 00:00:00, 2024-05-15 00:00:00, 2024-08-08 00:00:00, 2025-09-22 00:00:00, 2018-10-03 00:00:00, 2023-10-25 00:00:00, 2024-07-01 00:00:00, 2022-05-25 00:00:00, 2019-04-25 00:00:00, 2022-12-27 00:00:00
- **PublicComment** (TEXT)
- **LastSentDateJDSC** (TEXT)
- **IsKubotaUnit** (INTEGER)
- **JohnDeereEquipmentIdentifier** (TEXT)
- **IsKubotaCanadaUnit** (INTEGER)
- **MiscUserDefined3** (TEXT) — values: 4466228 - WAR credit, 4008984, 3633779, FL8 - B4V107694, 3948721 credit, 4231435 new invoice, 4250345 - B4ST13087 credit
- **MiscUserDefined4** (TEXT) — values: 4466279 - WAR credit
- **MiscUserDefined5** (TEXT)
- **ServiceContractGroupID** (INTEGER)
- **OriginalBaseRetail** (NUMERIC)
- **OriginalBaseCost** (NUMERIC)

## UnitCategory

- **UnitCategoryId** (INTEGER) _PK, NOT NULL_
- **UnitCategoryCode** (TEXT) _NOT NULL_ — values: BCA, BCE, CON, OTH, REN, USD
- **DisplayText** (TEXT) _NOT NULL_
- **ProductLineId** (INTEGER) _NOT NULL_
- **InventoryAcctId** (INTEGER) _NOT NULL_
- **InventoryDeptId** (INTEGER)
- **UnitSalesAcctId** (INTEGER) _NOT NULL_
- **UnitSalesDeptId** (INTEGER)
- **UnitCostAcctId** (INTEGER) _NOT NULL_
- **UnitCostDeptId** (INTEGER)
- **UnitDiscountAcctId** (INTEGER) _NOT NULL_
- **UnitDiscountDeptId** (INTEGER)
- **UnitOverallowAcctId** (INTEGER) _NOT NULL_
- **UnitOverallowDeptId** (INTEGER)
- **ClearingAcctId** (INTEGER) _NOT NULL_
- **ClearingDeptId** (INTEGER)
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2017-06-05 08:39:53.360000, 2017-06-05 08:39:53.533000, 2017-06-05 08:39:53.550000, 2022-12-14 17:59:20.830000, 2018-02-09 16:03:31.777000
- **ModBy** (TEXT) _NOT NULL_ — values: Admin
- **EntDate** (TEXT) _NOT NULL_ — values: 2017-06-05 08:39:53.360000, 2017-06-05 08:39:53.533000, 2017-06-05 08:39:53.550000, 2017-06-13 12:20:38.070000, 2018-02-09 16:03:31.777000
- **EntBy** (TEXT) _NOT NULL_ — values: Admin
- **RowVersion** (BLOB) _NOT NULL_
- **RequiresPO** (INTEGER) _NOT NULL_
- **DesiredMargin** (NUMERIC) _NOT NULL_

## UnitCondition

- **UnitConditionId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **Description** (TEXT) _NOT NULL_
- **Scale** (INTEGER) _NOT NULL_
- **IsNew** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2009-08-05 08:07:09.720000, 2015-06-11 12:39:59.900000, 2009-07-01 00:00:00
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, Install
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00
- **EntBy** (TEXT) _NOT NULL_ — values: Install
- **RowVersion** (BLOB) _NOT NULL_

## UnitCustomer

- **CustomerUnitId** (INTEGER) _PK, NOT NULL_
- **UnitId** (INTEGER) _NOT NULL_
- **CustomerId** (INTEGER)
- **Activity** (TEXT) — values: Invoiced, Returned, Trade-In, add, transfer, voided
- **EventDate** (TEXT)
- **InvoiceAmount** (NUMERIC)
- **TradeAmount** (NUMERIC) _NOT NULL_
- **ConfiguredCost** (NUMERIC) _NOT NULL_
- **Comment** (TEXT) _NOT NULL_
- **ListAmount** (NUMERIC) _NOT NULL_
- **Source** (TEXT)
- **SourceId** (INTEGER)
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: ByronL, system, Admin, KevinP, JoeH, BrettN, DougM, JordanM, TerryN, DebH, KyleH, GregM
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: ByronL, system, Admin, KevinP, JoeH, BrettN, DougM, JordanM, TerryN, DebH, KyleH, GregM
- **RowVersion** (BLOB) _NOT NULL_

## UnitMake

- **MakeId** (INTEGER) _PK, NOT NULL_
- **DisplayText** (TEXT) _NOT NULL_
- **IronCode** (TEXT) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2018-12-13 23:32:20.897000, 2018-12-13 23:32:20.900000, 2018-12-13 23:32:20.903000
- **ModBy** (TEXT) _NOT NULL_ — values: System
- **EntDate** (TEXT) _NOT NULL_ — values: 2009-07-01 00:00:00, 2018-12-13 23:32:20.897000, 2018-12-13 23:32:20.900000, 2018-12-13 23:32:20.903000
- **EntBy** (TEXT) _NOT NULL_ — values: System
- **RowVersion** (BLOB) _NOT NULL_

## UnitSerial

- **UnitSerialId** (INTEGER) _PK, NOT NULL_
- **UnitId** (INTEGER) _NOT NULL_
- **SerialTypeId** (INTEGER) _NOT NULL_
- **SerialNo** (TEXT) _NOT NULL_
- **WarrantyDate** (TEXT) — values: 2022-01-14 00:00:00
- **IsActive** (INTEGER) _NOT NULL_
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: Admin, ByronL, JoeH, KevinP, BrettN, JordanM, DougM, TerryN, AndrewM, DebH, KMiller, KyleH
- **EntDate** (TEXT) _NOT NULL_
- **EntBy** (TEXT) _NOT NULL_ — values: Admin, ByronL, KevinP, JoeH, BrettN, DougM, JordanM, TerryN, DebH, KyleH, GregM, KMiller
- **RowVersion** (BLOB) _NOT NULL_

## WorkInProgress

_Tech labor punches against work orders._

- **WIPId** (INTEGER) _PK, NOT NULL_
- **SegmentId** (INTEGER) _NOT NULL_
- **TimeOn** (TEXT) _NOT NULL_
- **TimeOff** (TEXT)
- **ElapsedHours** (NUMERIC) _NOT NULL_ — Hours logged on the punch. · aliases: hours, labor hours
- **LaborAdjCodeId** (INTEGER)
- **TechId** (INTEGER) _NOT NULL_ — Joins to AppUser for technician name.
- **IsClock** (INTEGER) _NOT NULL_
- **IsActive** (INTEGER) _NOT NULL_ — 1 = valid punch row.
- **ModDate** (TEXT) _NOT NULL_
- **ModBy** (TEXT) _NOT NULL_ — values: ByronL, JoeH, BrettN, ScottM, GregM, MikeM, JonahL, KyleH, TerryN, JuanA, Admin, LoganN
- **EntDate** (TEXT) _NOT NULL_ — When the punch was created. Use for time-series of labor.
- **EntBy** (TEXT) _NOT NULL_ — values: ByronL, JoeH, BrettN, ScottM, GregM, MikeM, JonahL, JuanA, Admin, AndrewM, LoganN, DebH
- **RowVersion** (BLOB) _NOT NULL_
- **Comment** (TEXT) _NOT NULL_
- **TechComment** (TEXT)
- **IsOrigWOSegment** (INTEGER)
- **TransferSegmentId** (INTEGER)
- **TransferWIPId** (INTEGER)
- **TransferWorkOrderId** (INTEGER)

## WorkOrderSchedule

- **WorkOrderScheduleId** (INTEGER) _PK, NOT NULL_
- **InvoiceDocId** (INTEGER) _NOT NULL_
- **RequiredStartTime** (TEXT)
- **RequiredWaitUntilDate** (TEXT)
- **RequiredEndTime** (TEXT)
- **ScheduledStartTime** (TEXT)
- **ScheduledEndTime** (TEXT)
- **ActualStartTime** (TEXT)
- **ActualEndTime** (TEXT)
- **Rowversion** (BLOB) _NOT NULL_

