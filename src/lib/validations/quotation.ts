/**
 * Zod validation schemas for quotation and pricing operations.
 * All monetary inputs are validated as strings then converted to avoid JS float issues.
 * Server actions and API routes must validate through these schemas before passing to services.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Accepts a string or number and coerces to a 2-decimal string. Used for Decimal-safe money. */
const monetaryString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .pipe(
    z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/, "Must be a non-negative decimal number")
  );

const positiveInteger = z.number().int().min(1, "Quantity must be at least 1");

// ---------------------------------------------------------------------------
// Line item input — one catalogue item being quoted
// ---------------------------------------------------------------------------

export const QuotationLineItemInputSchema = z.object({
  /** plan_id references plans.id in the catalogue */
  plan_id: z.string().uuid("plan_id must be a valid UUID"),
  /** Optional override description; defaults to plan name if omitted */
  description: z.string().max(500).optional(),
  quantity: positiveInteger,
  /**
   * Optional discount code to apply to this line.
   * The engine will validate against the discounts table; unknown codes are rejected.
   */
  discount_code: z
    .string()
    .trim()
    .toUpperCase()
    .max(50)
    .optional()
    .nullable(),
});

export type QuotationLineItemInput = z.infer<typeof QuotationLineItemInputSchema>;

// ---------------------------------------------------------------------------
// Full quotation request input — what a staff/admin submits
// ---------------------------------------------------------------------------

export const CreateQuotationInputSchema = z.object({
  customer_id: z.string().uuid("customer_id must be a valid UUID"),
  /**
   * ISO 8601 string; must be a future datetime.
   * The engine will validate this is in the future (UTC).
   */
  valid_until: z
    .string()
    .datetime({ message: "valid_until must be a valid ISO 8601 datetime" }),
  currency: z
    .string()
    .length(3, "Currency must be a 3-character ISO 4217 code")
    .toUpperCase()
    .default("USD"),
  notes: z.string().max(2000).optional().nullable(),
  items: z
    .array(QuotationLineItemInputSchema)
    .min(1, "At least one line item is required")
    .max(50, "Maximum 50 line items per quotation"),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationInputSchema>;

// ---------------------------------------------------------------------------
// Update quotation input (draft only)
// ---------------------------------------------------------------------------

export const UpdateQuotationInputSchema = CreateQuotationInputSchema.partial()
  .omit({ customer_id: true }) // customer cannot be changed after creation
  .extend({
    quotation_id: z.string().uuid(),
  });

export type UpdateQuotationInput = z.infer<typeof UpdateQuotationInputSchema>;

// ---------------------------------------------------------------------------
// Pricing engine output types (read contracts for UI / Amaya)
// ---------------------------------------------------------------------------

export const PricedLineItemSchema = z.object({
  plan_id: z.string().uuid(),
  plan_name: z.string(),
  description: z.string(),
  sku: z.string().nullable(),
  quantity: z.number().int().min(1),
  unit_price: z.string(), // numeric string, e.g. "49.99"
  discount_code: z.string().nullable(),
  discount_type: z.enum(["percentage", "fixed_amount"]).nullable(),
  discount_value: z.string().nullable(), // numeric string
  discount_amount: z.string(), // computed; always "0.00" when no discount
  tax_rate: z.string(), // numeric string, e.g. "0.0800" for 8%
  tax_amount: z.string(), // computed tax on (subtotal - discount)
  line_subtotal: z.string(), // quantity * unit_price
  line_total: z.string(), // line_subtotal - discount_amount + tax_amount
});

export type PricedLineItem = z.infer<typeof PricedLineItemSchema>;

export const QuotationPriceSummarySchema = z.object({
  currency: z.string().length(3),
  items: z.array(PricedLineItemSchema),
  subtotal: z.string(), // sum of line_subtotals
  discount_total: z.string(), // sum of discount_amounts
  tax_total: z.string(), // sum of tax_amounts
  total: z.string(), // subtotal - discount_total + tax_total
});

export type QuotationPriceSummary = z.infer<typeof QuotationPriceSummarySchema>;
