/**
 * TASK-040 — Subscription Lifecycle State Machine
 *
 * Enforces valid subscription state transitions:
 * - active -> paused (staff/admin)
 * - paused -> active (staff/admin - resume)
 * - active -> past_due (system / billing failed)
 * - past_due -> active (payment received / cured)
 * - active / paused / past_due -> cancelled (staff/admin, or upon accepted cancellation request)
 * - active / past_due -> expired (system when valid period elapsed and auto_renew=false)
 *
 * Terminal states: cancelled, expired.
 * Note: Customer cancellation is NOT a direct status change (handled by TASK-041 cancellation requests).
 */

export type SubscriptionStatus =
  | "active"
  | "paused"
  | "past_due"
  | "cancelled"
  | "expired";

export type SubscriptionAction =
  | "pause"
  | "resume"
  | "mark_past_due"
  | "cure_past_due"
  | "cancel"
  | "expire";

export interface SubscriptionTransitionRule {
  from: SubscriptionStatus[];
  to: SubscriptionStatus;
  allowedRoles: ("admin" | "staff")[];
}

export const SUBSCRIPTION_TRANSITIONS: Record<
  SubscriptionAction,
  SubscriptionTransitionRule
> = {
  pause: {
    from: ["active"],
    to: "paused",
    allowedRoles: ["admin", "staff"],
  },
  resume: {
    from: ["paused"],
    to: "active",
    allowedRoles: ["admin", "staff"],
  },
  mark_past_due: {
    from: ["active"],
    to: "past_due",
    allowedRoles: ["admin", "staff"],
  },
  cure_past_due: {
    from: ["past_due"],
    to: "active",
    allowedRoles: ["admin", "staff"],
  },
  cancel: {
    from: ["active", "paused", "past_due"],
    to: "cancelled",
    allowedRoles: ["admin", "staff"],
  },
  expire: {
    from: ["active", "past_due"],
    to: "expired",
    allowedRoles: ["admin", "staff"],
  },
};

export class SubscriptionStateError extends Error {
  constructor(
    public readonly code:
      | "INVALID_TRANSITION"
      | "UNAUTHORIZED_ROLE"
      | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "SubscriptionStateError";
  }
}

export function validateSubscriptionTransition(params: {
  currentStatus: SubscriptionStatus;
  action: SubscriptionAction;
  userRole: "admin" | "staff" | "customer";
}): { nextStatus: SubscriptionStatus } {
  const rule = SUBSCRIPTION_TRANSITIONS[params.action];
  if (!rule) {
    throw new SubscriptionStateError(
      "INVALID_TRANSITION",
      `Unknown subscription action: ${params.action}`
    );
  }

  // Customers cannot directly transition subscription lifecycle
  if (params.userRole === "customer" || !rule.allowedRoles.includes(params.userRole)) {
    throw new SubscriptionStateError(
      "UNAUTHORIZED_ROLE",
      `Role '${params.userRole}' cannot perform '${params.action}' on subscriptions.`
    );
  }

  if (!rule.from.includes(params.currentStatus)) {
    throw new SubscriptionStateError(
      "INVALID_TRANSITION",
      `Cannot transition subscription from '${params.currentStatus}' via action '${params.action}'. Expected one of: ${rule.from.join(", ")}`
    );
  }

  return { nextStatus: rule.to };
}
