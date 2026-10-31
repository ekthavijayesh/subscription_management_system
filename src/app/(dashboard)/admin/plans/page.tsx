import { requireRole } from "@/lib/auth/authorization";
import { getAllPlans, getAllProducts } from "@/lib/services/catalogue";
import { PlanManagement } from "@/components/features/plans/plan-management";

export default async function AdminPlansPage() {
  await requireRole(["admin"]);
  const [plans, products] = await Promise.all([
    getAllPlans(true),
    getAllProducts(false),
  ]);

  return <PlanManagement initialPlans={plans} products={products} />;
}

