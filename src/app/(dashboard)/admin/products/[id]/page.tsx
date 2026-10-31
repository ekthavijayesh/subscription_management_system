import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getProductById } from "@/lib/services/catalogue";
import { ProductDetailView } from "@/components/features/products/product-detail-view";

export default async function AdminProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole(["admin"]);
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}

