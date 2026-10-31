import { requireRole } from "@/lib/auth/authorization";
import { listDiscounts, listTaxRules } from "@/lib/services/discounts-taxes.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPricingRulesPage() {
  await requireRole(["admin"]);
  const [discounts, taxRules] = await Promise.all([
    listDiscounts(),
    listTaxRules(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Rules & Tax Management</h1>
        <p className="text-muted-foreground">
          Configure active discount codes, redemption limits, jurisdictions, and tax rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discounts */}
        <Card>
          <CardHeader>
            <CardTitle>Active & Configured Discounts ({discounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {discounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No discounts configured.</p>
            ) : (
              <div className="space-y-3">
                {discounts.map((d) => (
                  <div key={d.id} className="p-3 border rounded-md flex justify-between items-center text-sm">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>{d.code}</span>
                        <Badge variant={d.is_active ? "default" : "secondary"}>
                          {d.is_active ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {d.type === "percentage" ? `${d.value}% off` : `$${d.value} fixed`}
                        {d.max_redemptions && ` | Redemptions: ${d.times_redeemed}/${d.max_redemptions}`}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.ends_at ? `Expires ${new Date(d.ends_at).toLocaleDateString()}` : "No expiry"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Rules & Jurisdictions ({taxRules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {taxRules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tax rules configured.</p>
            ) : (
              <div className="space-y-3">
                {taxRules.map((t) => (
                  <div key={t.id} className="p-3 border rounded-md flex justify-between items-center text-sm">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>{t.name}</span>
                        <Badge variant={t.is_active ? "default" : "secondary"}>
                          {t.is_active ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Jurisdiction: {t.jurisdiction} | Rate: {(t.rate * 100).toFixed(2)}% | Priority: {t.priority}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.is_inclusive ? "Tax Inclusive" : "Tax Exclusive"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
