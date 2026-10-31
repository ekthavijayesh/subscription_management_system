import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  plans: Plan[];
}

/**
 * Returns all products for admin management.
 */
export async function getAllProducts(includeArchived = false): Promise<Product[]> {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Product[]) || [];
}

/**
 * Returns only active, sellable products with their active variants and active plans.
 * Used for customer and staff catalogue browsing (TASK-031).
 */
export async function getActiveSellableCatalogue(): Promise<ProductWithDetails[]> {
  const supabase = createClient();

  const [productsRes, variantsRes, plansRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("product_variants")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true }),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (variantsRes.error) throw new Error(variantsRes.error.message);
  if (plansRes.error) throw new Error(plansRes.error.message);

  const products = (productsRes.data as Product[]) || [];
  const variants = (variantsRes.data as ProductVariant[]) || [];
  const plans = (plansRes.data as Plan[]) || [];

  return products.map((product) => ({
    ...product,
    variants: variants.filter((v) => v.product_id === product.id),
    plans: plans.filter((p) => p.product_id === product.id),
  }));
}

/**
 * Returns a single product with all variants and plans (for detail/editing).
 */
export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const supabase = createClient();

  const { data: product, error: prodError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (prodError) throw new Error(prodError.message);
  if (!product) return null;

  const [variantsRes, plansRes] = await Promise.all([
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("plans")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ...(product as Product),
    variants: (variantsRes.data as ProductVariant[]) || [],
    plans: (plansRes.data as Plan[]) || [],
  };
}

/**
 * Returns all plans with product reference for plan administration (TASK-033).
 */
export async function getAllPlans(includeArchived = false): Promise<
  (Plan & { product_name?: string })[]
> {
  const supabase = createClient();
  let query = supabase
    .from("plans")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((p: any) => ({
    ...p,
    product_name: p.products?.name ?? "Unknown",
  }));
}

