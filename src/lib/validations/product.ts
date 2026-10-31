import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  sku: z.string().min(1, "SKU is required").max(50),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  sku: z.string().min(1, "SKU is required").max(50),
  isActive: z.boolean(),
});

export const variantCreateSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  name: z.string().min(1, "Variant name is required").max(100),
  sku: z.string().min(1, "Variant SKU is required").max(50),
  attributes: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});

export const variantUpdateSchema = z.object({
  id: z.string().uuid("Invalid variant ID"),
  name: z.string().min(1, "Variant name is required").max(100),
  sku: z.string().min(1, "Variant SKU is required").max(50),
  attributes: z.record(z.any()).default({}),
  isActive: z.boolean(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type VariantCreateInput = z.infer<typeof variantCreateSchema>;
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;

