import { z } from "zod";

export const planCreateSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID").optional().nullable(),
  name: z.string().min(1, "Plan name is required").max(100),
  billingInterval: z.enum(["month", "year", "week", "quarter"]),
  intervalCount: z.coerce.number().int().positive("Interval count must be greater than 0").default(1),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().length(3).default("USD"),
  isActive: z.boolean().default(true),
});

export const planUpdateSchema = z.object({
  id: z.string().uuid("Invalid plan ID"),
  name: z.string().min(1, "Plan name is required").max(100),
  billingInterval: z.enum(["month", "year", "week", "quarter"]),
  intervalCount: z.coerce.number().int().positive("Interval count must be greater than 0"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().length(3).default("USD"),
  isActive: z.boolean(),
});

export type PlanCreateInput = z.infer<typeof planCreateSchema>;
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;

