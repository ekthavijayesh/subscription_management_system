"use server";

/**
 * TASK-036 — Quotation Server Actions
 *
 * Server actions for quotation draft create/edit.
 * All actions:
 * - Validate input with Zod before touching any service.
 * - Require authenticated session (requireAuth).
 * - Require staff or admin role.
 * - Call service layer — never write to DB directly.
 * - Return ActionResult with typed errors; never throw to client.
 */

import { requireRole, requireAuth } from "@/lib/auth/authorization";
import {
  CreateQuotationInputSchema,
  UpdateQuotationInputSchema,
} from "@/lib/validations/quotation";
import {
  createQuotationDraft,
  updateQuotationDraft,
  getQuotationById,
  listQuotations,
  PricingError,
  type QuotationRecord,
  type QuotationDetail,
  type ListQuotationsFilter,
} from "@/lib/services/quotation.service";

export interface QuotationActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ---------------------------------------------------------------------------
// Create quotation draft
// ---------------------------------------------------------------------------

export async function createQuotationAction(
  rawInput: unknown
): Promise<QuotationActionResult<{ quotationId: string; quotationNumber: string }>> {
  try {
    // 1. Auth: staff or admin only
    const session = await requireRole(["staff", "admin"]);

    // 2. Validate input
    const parsed = CreateQuotationInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
        errorCode: "VALIDATION_ERROR",
      };
    }

    // 3. Delegate to service
    const { quotation } = await createQuotationDraft(
      parsed.data,
      session.user.id
    );

    return {
      success: true,
      data: {
        quotationId: quotation.id,
        quotationNumber: quotation.quotation_number,
      },
    };
  } catch (err) {
    if (err instanceof PricingError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Unexpected error creating quotation";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// Update quotation draft
// ---------------------------------------------------------------------------

export async function updateQuotationAction(
  rawInput: unknown
): Promise<QuotationActionResult<{ quotationId: string }>> {
  try {
    // 1. Auth
    const session = await requireRole(["staff", "admin"]);

    // 2. Validate
    const parsed = UpdateQuotationInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
        errorCode: "VALIDATION_ERROR",
      };
    }

    // 3. Service
    const { quotation } = await updateQuotationDraft(
      parsed.data,
      session.user.id
    );

    return {
      success: true,
      data: { quotationId: quotation.id },
    };
  } catch (err) {
    if (err instanceof PricingError) {
      return { success: false, error: err.message, errorCode: err.code };
    }
    if (err instanceof Error && err.message.includes("cannot be edited")) {
      return { success: false, error: err.message, errorCode: "NOT_A_DRAFT" };
    }
    const message = err instanceof Error ? err.message : "Unexpected error updating quotation";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// Get quotation detail (for form pre-population and detail view)
// ---------------------------------------------------------------------------

export async function getQuotationAction(
  quotationId: string
): Promise<QuotationActionResult<QuotationDetail>> {
  try {
    await requireRole(["staff", "admin", "customer"]);

    const quotation = await getQuotationById(quotationId);
    if (!quotation) {
      return { success: false, error: "Quotation not found", errorCode: "NOT_FOUND" };
    }

    return { success: true, data: quotation };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// List quotations (role-scoped via RLS)
// ---------------------------------------------------------------------------

export async function listQuotationsAction(
  filter: ListQuotationsFilter = {}
): Promise<QuotationActionResult<{ quotations: QuotationRecord[]; total: number }>> {
  try {
    await requireRole(["staff", "admin", "customer"]);

    const result = await listQuotations(filter);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}


// ---------------------------------------------------------------------------
// Transition quotation status action (TASK-037)
// ---------------------------------------------------------------------------

import {
  transitionQuotationStatus,
} from "@/lib/services/quotation.service";
import {
  QuotationStateError,
  type QuotationAction,
} from "@/lib/services/quotation-state.service";

export async function transitionQuotationAction(params: {
  quotationId: string;
  action: QuotationAction;
}): Promise<QuotationActionResult<{ quotationId: string; newStatus: string }>> {
  try {
    const session = await requireAuth();

    const updated = await transitionQuotationStatus({
      quotationId: params.quotationId,
      action: params.action,
      actorId: session.user.id,
      actorRole: session.profile.role as "admin" | "staff" | "customer",
    });

    return {
      success: true,
      data: {
        quotationId: updated.id,
        newStatus: updated.status,
      },
    };
  } catch (err) {
    if (err instanceof QuotationStateError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Unexpected error transitioning quotation";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}


// ---------------------------------------------------------------------------
// Convert approved quotation action (TASK-038)
// ---------------------------------------------------------------------------

import {
  convertApprovedQuotation,
  ConversionError,
  type ConvertQuotationResult,
} from "@/lib/services/quotation-conversion.service";

export async function convertQuotationAction(params: {
  quotationId: string;
}): Promise<QuotationActionResult<ConvertQuotationResult>> {
  try {
    const session = await requireRole(["staff", "admin"]);

    const result = await convertApprovedQuotation({
      quotationId: params.quotationId,
      actorId: session.user.id,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof ConversionError) {
      return {
        success: false,
        error: err.message,
        errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : "Unexpected error converting quotation";
    return { success: false, error: message, errorCode: "SERVER_ERROR" };
  }
}
