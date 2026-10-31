import { z } from "zod";

export const CreateDiscountSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(50)
    .toUpperCase(),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().positive("Discount value must be greater than 0"),
  currency: z.string().length(3).toUpperCase().default("USD"),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  max_redemptions: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type CreateDiscountInput = z.infer<typeof CreateDiscountSchema>;

export const CreateTaxRuleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  jurisdiction: z.string().trim().min(2, "Jurisdiction is required"),
  rate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(1, "Rate must be represented as a decimal between 0 and 1 (e.g. 0.08 for 8%)"),
  is_inclusive: z.boolean().default(false),
  priority: z.number().int().default(0),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type CreateTaxRuleInput = z.infer<typeof CreateTaxRuleSchema>;
