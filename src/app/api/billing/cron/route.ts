/**
 * TASK-052 — Billing Cron Endpoint (CRON_SECRET Protected)
 *
 * Rules:
 * - Browser requests without valid Authorization header are strictly rejected (401 Unauthorized).
 * - Must pass: Authorization: Bearer <CRON_SECRET>
 * - Supports query param ?dryRun=true for testing and observability.
 * - Executes automated billing runs and returns deterministic run telemetry.
 */

import { NextRequest, NextResponse } from "next/server";
import { executeAutomatedBillingRun } from "@/lib/services/billing-scheduler.service";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 1. Guard: Protect with CRON_SECRET (never unauthenticated or browser-triggered)
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET bearer token required." },
      { status: 401 }
    );
  }

  // 2. Query options
  const { searchParams } = new URL(req.url);
  const isDryRun = searchParams.get("dryRun") === "true";
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  try {
    const result = await executeAutomatedBillingRun({
      isDryRun,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing run failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
