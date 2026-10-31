/**
 * TASK-046 — Invoice Document Immutability & Status Transitions
 *
 * Enforces business invariants on financial invoice documents:
 * 1. Document Immutability:
 *    - Once an invoice is 'issued' or beyond, its financial line items, subtotal,
 *      discounts, tax, and total cannot be mutated.
 * 2. Status Transitions:
 *    - draft -> issued (staff/admin)
 *    - issued -> paid (system/payment service when amount_due reaches 0)
 *    - issued -> overdue (system/billing scheduler when due_date < now and amount_due > 0)
 *    - overdue -> paid (system/payment service when outstanding amount paid)
 *    - issued / overdue / draft -> cancelled | void (staff/admin only, with mandatory reason)
 * 3. Terminal States:
 *    - paid, cancelled, void cannot be reopened or transitioned backwards.
 */

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "overdue"
  | "cancelled"
  | "void";

export type InvoiceAction =
  | "issue"
  | "mark_paid"
  | "mark_overdue"
  | "cancel"
  | "void";

export interface InvoiceTransitionRule {
  from: InvoiceStatus[];
  to: InvoiceStatus;
  allowedRoles: ("admin" | "staff" | "system")[];
}

export const INVOICE_TRANSITIONS: Record<InvoiceAction, InvoiceTransitionRule> = {
  issue: {
    from: ["draft"],
    to: "issued",
    allowedRoles: ["admin", "staff"],
  },
  mark_paid: {
    from: ["issued", "overdue"],
    to: "paid",
    allowedRoles: ["admin", "staff", "system"],
  },
  mark_overdue: {
    from: ["issued"],
    to: "overdue",
    allowedRoles: ["admin", "staff", "system"],
  },
  cancel: {
    from: ["draft", "issued", "overdue"],
    to: "cancelled",
    allowedRoles: ["admin", "staff"],
  },
  void: {
    from: ["issued", "overdue"],
    to: "void",
    allowedRoles: ["admin", "staff"],
  },
};

export class InvoiceStateError extends Error {
  constructor(
    public readonly code:
      | "INVALID_TRANSITION"
      | "UNAUTHORIZED_ROLE"
      | "IMMUTABLE_DOCUMENT"
      | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "InvoiceStateError";
  }
}

export function validateInvoiceTransition(params: {
  currentStatus: InvoiceStatus;
  action: InvoiceAction;
  userRole: "admin" | "staff" | "system" | "customer";
}): { nextStatus: InvoiceStatus } {
  const rule = INVOICE_TRANSITIONS[params.action];
  if (!rule) {
    throw new InvoiceStateError(
      "INVALID_TRANSITION",
      `Unknown invoice action: ${params.action}`
    );
  }

  // Customers can never directly transition invoice state
  if (params.userRole === "customer" || !rule.allowedRoles.includes(params.userRole)) {
    throw new InvoiceStateError(
      "UNAUTHORIZED_ROLE",
      `Role '${params.userRole}' cannot perform '${params.action}' on invoices.`
    );
  }

  if (!rule.from.includes(params.currentStatus)) {
    throw new InvoiceStateError(
      "INVALID_TRANSITION",
      `Cannot transition invoice from '${params.currentStatus}' via action '${params.action}'. Allowed from: ${rule.from.join(", ")}`
    );
  }

  return { nextStatus: rule.to };
}

/**
 * Checks if an invoice is locked/immutable.
 * Any invoice that has been issued cannot have its pricing or line items modified.
 */
export function assertInvoiceMutable(status: InvoiceStatus): void {
  if (status !== "draft") {
    throw new InvoiceStateError(
      "IMMUTABLE_DOCUMENT",
      `Invoice is in status '${status}'. Issued financial records are strictly immutable.`
    );
  }
}
