/**
 * TASK-037 — Quotation State Machine
 *
 * Enforces valid state transitions, roles, and business invariants:
 * - draft -> sent (staff/admin)
 * - draft -> cancelled (staff/admin)
 * - sent -> approved (customer, or staff/admin on customer's behalf)
 * - sent -> rejected (customer, or staff/admin)
 * - sent -> expired (system/scheduler/staff if valid_until < now)
 * - sent -> cancelled (staff/admin)
 * - approved -> converted (handled by conversion service TASK-038)
 *
 * Terminal states: converted, rejected, expired, cancelled.
 */

export type QuotationStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "converted"
  | "expired"
  | "cancelled";

export type QuotationAction =
  | "send"
  | "approve"
  | "reject"
  | "expire"
  | "cancel"
  | "convert";

export interface TransitionRule {
  from: QuotationStatus[];
  to: QuotationStatus;
  allowedRoles: ("admin" | "staff" | "customer")[];
  requireValidUntilFuture?: boolean;
}

export const QUOTATION_TRANSITIONS: Record<QuotationAction, TransitionRule> = {
  send: {
    from: ["draft"],
    to: "sent",
    allowedRoles: ["admin", "staff"],
    requireValidUntilFuture: true,
  },
  approve: {
    from: ["sent"],
    to: "approved",
    allowedRoles: ["customer", "admin", "staff"],
    requireValidUntilFuture: true,
  },
  reject: {
    from: ["sent"],
    to: "rejected",
    allowedRoles: ["customer", "admin", "staff"],
  },
  expire: {
    from: ["sent", "draft"],
    to: "expired",
    allowedRoles: ["admin", "staff"],
  },
  cancel: {
    from: ["draft", "sent"],
    to: "cancelled",
    allowedRoles: ["admin", "staff"],
  },
  convert: {
    from: ["approved"],
    to: "converted",
    allowedRoles: ["admin", "staff"],
  },
};

export class QuotationStateError extends Error {
  constructor(
    public readonly code:
      | "INVALID_TRANSITION"
      | "UNAUTHORIZED_ROLE"
      | "EXPIRED"
      | "NOT_EXPIRED"
      | "QUOTATION_NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "QuotationStateError";
  }
}

/**
 * Validates whether an action can be performed on the given quote state.
 */
export function validateQuotationTransition(params: {
  currentStatus: QuotationStatus;
  action: QuotationAction;
  userRole: "admin" | "staff" | "customer";
  validUntil: string; // ISO string
  now?: Date;
}): { nextStatus: QuotationStatus } {
  const rule = QUOTATION_TRANSITIONS[params.action];
  if (!rule) {
    throw new QuotationStateError(
      "INVALID_TRANSITION",
      `Unknown quotation action: ${params.action}`
    );
  }

  // 1. Role validation
  if (!rule.allowedRoles.includes(params.userRole)) {
    throw new QuotationStateError(
      "UNAUTHORIZED_ROLE",
      `Role '${params.userRole}' is not authorized to '${params.action}' quotation in '${params.currentStatus}' state.`
    );
  }

  // 2. Status transition validation
  if (!rule.from.includes(params.currentStatus)) {
    throw new QuotationStateError(
      "INVALID_TRANSITION",
      `Cannot transition quotation from '${params.currentStatus}' via action '${params.action}'. Expected one of: ${rule.from.join(", ")}`
    );
  }

  const currentDate = params.now ?? new Date();
  const validUntilDate = new Date(params.validUntil);

  // 3. Expiration checks
  if (rule.requireValidUntilFuture && validUntilDate < currentDate) {
    throw new QuotationStateError(
      "EXPIRED",
      `Quotation expired at ${validUntilDate.toISOString()} and can no longer be ${params.action}ed.`
    );
  }

  if (params.action === "expire" && validUntilDate >= currentDate) {
    throw new QuotationStateError(
      "NOT_EXPIRED",
      `Quotation valid_until is still in the future (${validUntilDate.toISOString()}); cannot expire yet.`
    );
  }

  return { nextStatus: rule.to };
}
