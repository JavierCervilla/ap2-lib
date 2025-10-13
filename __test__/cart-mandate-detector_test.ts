/**
 * CartMandate Detector Test Suite (Refactored)
 *
 * Comprehensive tests for CartMandateDetector, grouped by method for clarity.
 * Tests type detection, detailed detection, and edge cases.
 */

import { assert, assertEquals } from "./test_helper.ts";
import { CartMandateDetector } from "../src/core/mandates/cart/mod.ts";
import { MandateType } from "../src/core/mandates/shared/mod.ts";
import type { CartMandate, CartContents } from "../src/types/mod.ts";

// --- Test Data Setup ---
const validCartContents: CartContents = {
  id: "cart-test-123",
  merchant_name: "Test Coffee Store",
  cart_expiry: "2026-12-31T23:59:59Z",
  payment_request: {
    id: "payment-req-456",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Test Total",
        amount: { currency: "USD", value: "29.99" },
        refund_period: 30
      }
    }
  },
  user_cart_confirmation_required: true
};

const validCartMandate: CartMandate = {
  contents: validCartContents
};

const validCartMandateWithAuth: CartMandate = {
  contents: validCartContents,
  merchant_authorization: "mock.jwt.signature"
};


// --- Test Suites ---

Deno.test("CartMandateDetector.detectType()", async (t) => {
  const detector = new CartMandateDetector();

  await t.step("should detect a valid CartMandate", () => {
    const result = detector.detectType(validCartMandate);
    assertEquals(result, MandateType.CART);
  });

  await t.step("should detect a valid CartMandate with merchant_authorization", () => {
    const result = detector.detectType(validCartMandateWithAuth);
    assertEquals(result, MandateType.CART);
  });

  await t.step("should return UNKNOWN if 'contents' field is missing", () => {
    const invalidMandate = { some_other_field: "value" };
    const result = detector.detectType(invalidMandate);
    assertEquals(result, MandateType.UNKNOWN);
  });

  await t.step("should return UNKNOWN if 'contents' is null", () => {
    const invalidMandate = { contents: null };
    const result = detector.detectType(invalidMandate);
    assertEquals(result, MandateType.UNKNOWN);
  });

  await t.step("should return UNKNOWN if 'contents' is missing required fields", () => {
    const invalidMandate = { contents: { id: "cart-123" } };
    const result = detector.detectType(invalidMandate);
    assertEquals(result, MandateType.UNKNOWN);
  });

  await t.step("should return UNKNOWN for mandates with intent-specific fields", () => {
    const mixedMandate1 = {
      contents: validCartContents,
      natural_language_description: "Buy something",
    };
    assertEquals(detector.detectType(mixedMandate1), MandateType.UNKNOWN);

    const mixedMandate2 = {
      contents: validCartContents,
      intent_expiry: "2024-12-31T23:59:59Z",
    };
    assertEquals(detector.detectType(mixedMandate2), MandateType.UNKNOWN);
  });
});


Deno.test("CartMandateDetector.canHandle()", async (t) => {
  const detector = new CartMandateDetector();

  await t.step("should return true for CART type", () => {
    assertEquals(detector.canHandle(MandateType.CART), true);
  });

  await t.step("should return false for all non-CART types", () => {
    const otherTypes = [MandateType.INTENT, MandateType.PAYMENT, MandateType.UNKNOWN];
    for (const type of otherTypes) {
      assertEquals(detector.canHandle(type), false, `Should not handle ${type}`);
    }
  });
});


Deno.test("CartMandateDetector.detectWithDetails()", async (t) => {
  const detector = new CartMandateDetector();

  await t.step("should return correct details for a valid CartMandate", () => {
    const result = detector.detectWithDetails(validCartMandate);
    assertEquals(result.type, MandateType.CART);
    assert(result.confidence >= 1.0, "Confidence should be maximal for a perfect match");
    assertEquals(result.reasons.length, 3);
    assert(result.reasons.includes("Has required CartMandate contents field"));
    assert(result.reasons.includes("Contents has required cart fields"));
    assert(result.reasons.includes("Does not have IntentMandate-specific fields"));
  });

  await t.step("should handle a valid CartMandate with merchant_authorization", () => {
    const result = detector.detectWithDetails(validCartMandateWithAuth);
    assertEquals(result.type, MandateType.CART);
    assert(result.confidence >= 1.0);
  });

  await t.step("should return UNKNOWN if 'contents' field is missing", () => {
    const invalidMandate = { some_other_field: "value" };
    const result = detector.detectWithDetails(invalidMandate);
    assertEquals(result.type, MandateType.UNKNOWN);
    assertEquals(result.confidence, 0);
    assertEquals(result.reasons, ["Missing required CartMandate contents field"]);
  });

  await t.step("should return UNKNOWN if 'contents' is missing required fields", () => {
    const invalidMandate = { contents: { id: "cart-123" } };
    const result = detector.detectWithDetails(invalidMandate);
    assertEquals(result.type, MandateType.UNKNOWN);
    assertEquals(result.confidence, 0);
    assertEquals(result.reasons, ["Contents missing required cart fields"]);
  });

  await t.step("should return UNKNOWN for mandates with intent-specific fields", () => {
    const mixedMandate = {
      contents: validCartContents,
      natural_language_description: "Buy something",
      intent_expiry: "2024-12-31T23:59:59Z"
    };
    const result = detector.detectWithDetails(mixedMandate);
    assertEquals(result.type, MandateType.UNKNOWN);
    assertEquals(result.confidence, 0);
    assertEquals(result.reasons, ["Has IntentMandate-specific fields"]);
  });

  await t.step("should return correct confidence calculation for a valid mandate", () => {
    const result = detector.detectWithDetails(validCartMandate);
    assertEquals(result.type, MandateType.CART);
    assertEquals(result.confidence, 1.0);
  });

  await t.step("should return UNKNOWN if 'contents' is an empty object", () => {
    const invalidMandate = { contents: {} };
    const result = detector.detectWithDetails(invalidMandate);
    assertEquals(result.type, MandateType.UNKNOWN);
    assertEquals(result.confidence, 0);
    assertEquals(result.reasons, ["Contents missing required cart fields"]);
  });

  await t.step("should return UNKNOWN if 'contents' is null", () => {
    const invalidMandate = { contents: null };
    const result = detector.detectWithDetails(invalidMandate);
    assertEquals(result.type, MandateType.UNKNOWN);
    assertEquals(result.confidence, 0);
    assertEquals(result.reasons, ["Contents missing required cart fields"]);
  });
});