import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-md border border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-4 gap-4 pb-4 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`head-${i}`} className="h-4 w-24" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={`row-${r}`} className="grid grid-cols-4 gap-4 py-4 items-center">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton
                  key={`cell-${r}-${c}`}
                  className={cn("h-4", c === 0 ? "w-36" : "w-20")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skel-${i}`}
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 max-w-lg">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-6" />
    </div>
  );
}

