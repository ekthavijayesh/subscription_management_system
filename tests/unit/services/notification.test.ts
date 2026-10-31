import { describe, it, expect } from "vitest";
import {
  sanitizePayload,
  renderNotificationTemplate,
} from "@/lib/services/notification.service";

describe("Notification Service & Sanitization (TASK-054)", () => {
  it("sanitizes sensitive fields (password, tokens, cards, secrets)", () => {
    const raw = {
      user_id: "usr_123",
      password: "SuperSecretPassword123!",
      api_token: "tok_abc999",
      nested: {
        card_number: "4111111111111234",
        safe_info: "Monthly Plan",
      },
    };

    const clean = sanitizePayload(raw);

    expect(clean.user_id).toBe("usr_123");
    expect(clean.password).toBe("[REDACTED]");
    expect(clean.api_token).toBe("[REDACTED]");
    expect((clean.nested as any).card_number).toBe("[REDACTED]");
    expect((clean.nested as any).safe_info).toBe("Monthly Plan");
  });

  it("renders notification templates with provided data", () => {
    const quotationNotice = renderNotificationTemplate("quotation_sent", {
      quotation_number: "QUO-20261031-A1B2C",
      total: "149.99",
      currency: "USD",
    });

    expect(quotationNotice.title).toContain("QUO-20261031-A1B2C");
    expect(quotationNotice.message).toContain("149.99");

    const renewalNotice = renderNotificationTemplate("subscription_renewed", {
      next_period_end: "2026-12-31",
    });

    expect(renewalNotice.title).toBe("Subscription Renewed");
    expect(renewalNotice.message).toContain("2026-12-31");
  });
});
