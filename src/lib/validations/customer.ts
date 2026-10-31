import { z } from "zod";

export const customerCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
  billingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional()
    .default({}),
});

export const customerUpdateSchema = z.object({
  id: z.string().uuid("Invalid customer ID"),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
  billingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional()
    .default({}),
  isActive: z.boolean().optional(),
});

export const customerSelfUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
  billingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional()
    .default({}),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerSelfUpdateInput = z.infer<typeof customerSelfUpdateSchema>;

