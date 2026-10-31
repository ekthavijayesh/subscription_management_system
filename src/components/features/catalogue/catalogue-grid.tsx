"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Search, Package, Layers } from "lucide-react";
import type { ProductWithDetails } from "@/lib/services/catalogue";

interface CatalogueGridProps {
  products: ProductWithDetails[];
  role: "staff" | "customer";
}

export function CatalogueGrid({ products }: CatalogueGridProps) {
  const [search, setSearch] = React.useState("");

  const filteredProducts = React.useMemo(() => {
    if (!search.trim()) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search catalogue"
          placeholder="Search products or plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products available"
          description={
            search
              ? "No active catalogue products match your search query."
              : "There are currently no active products in the catalogue."
          }
          icon={Package}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </CardTitle>
                  <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400">
                    {product.sku}
                  </code>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {product.description || "Active subscription service"}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Variants if any */}
                {product.variants.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Variants
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {product.variants.map((v) => (
                        <Badge key={v.id} variant="secondary" className="text-xs">
                          {v.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Plans */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    <span>Available Plans</span>
                  </span>

                  {product.plans.length === 0 ? (
                    <p className="text-xs text-slate-400 italic mt-1">
                      No active plans attached
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {product.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {plan.name}
                            </p>
                            <p className="text-slate-500 capitalize">
                              Every {plan.interval_count > 1 ? `${plan.interval_count} ` : ""}
                              {plan.billing_interval}
                              {plan.interval_count > 1 ? "s" : ""}
                            </p>
                          </div>
                          <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                            {formatCurrency(Number(plan.price))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 justify-between">
                <span>Direct server pricing</span>
                <span>Active</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

