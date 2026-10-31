import { requireRole } from "@/lib/auth/authorization";
import { getAllProducts } from "@/lib/services/catalogue";
import { ProductManagement } from "@/components/features/products/product-management";

export default async function AdminProductsPage() {
  await requireRole(["admin"]);
  const products = await getAllProducts(true);

  return <ProductManagement initialProducts={products} />;
}

