import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EntityStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "converted"
  | "expired"
  | "cancelled"
  | "active"
  | "paused"
  | "past_due"
  | "issued"
  | "paid"
  | "overdue"
  | "void"
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "inactive"
  | "archived";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string | boolean;
  className?: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  let normalized = "";
  if (typeof status === "boolean") {
    normalized = status ? "active" : "inactive";
  } else {
    normalized = status.toLowerCase();
  }

  let variant: NonNullable<BadgeProps["variant"]> = "secondary";
  let label = normalized.replace(/_/g, " ");

  switch (normalized) {
    case "active":
    case "approved":
    case "paid":
    case "completed":
      variant = "success";
      break;
    case "sent":
    case "pending":
    case "issued":
    case "paused":
    case "warning":
      variant = "warning";
      break;
    case "rejected":
    case "overdue":
    case "failed":
    case "past_due":
      variant = "destructive";
      break;
    case "draft":
    case "expired":
    case "cancelled":
    case "void":
    case "inactive":
    case "archived":
    case "refunded":
    default:
      variant = "secondary";
      break;
  }

  return (
    <Badge
      variant={variant}
      className={cn("capitalize font-medium tracking-wide", className)}
      {...props}
    >
      {label}
    </Badge>
  );
}

