/**
 * Tests for Type Guards
 */

import { assertEquals, assert, assertFalse } from "@std/assert";
import { isIntentMandate, isCartMandate, getMandateType } from "../src/types/guards.ts";
import { MandateType } from "../src/core/strategies/mandate-type-detector.ts";
import type { IntentMandate, CartMandate, Mandate } from "../src/types/mod.ts";

// Test fixtures
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2024-12-31T23:59:59Z",
  user_cart_confirmation_required: false
};

const validCartMandate: CartMandate = {
  contents: {
    id: "cart-123",
    merchant_name: "Coffee Store",
    cart_expiry: "2024-12-31T23:59:59Z",
    payment_request: {
      id: "payment-req-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: { label: "Total", amount: { currency: "USD", value: "29.99" }, refund_period: 30 }
      }
    },
    user_cart_confirmation_required: true
  }
};

const unknownMandate = {
  unknown_field: "some value",
  other_field: 42
} as unknown as Mandate;

// Type Guard Tests
Deno.test("isIntentMandate - Valid IntentMandate", () => {
  assert(isIntentMandate(validIntentMandate), "Should identify valid IntentMandate");
});

Deno.test("isIntentMandate - CartMandate should return false", () => {
  assertFalse(isIntentMandate(validCartMandate), "Should not identify CartMandate as IntentMandate");
});

Deno.test("isIntentMandate - Unknown mandate should return false", () => {
  assertFalse(isIntentMandate(unknownMandate), "Should not identify unknown mandate as IntentMandate");
});

Deno.test("isCartMandate - Valid CartMandate", () => {
  assert(isCartMandate(validCartMandate), "Should identify valid CartMandate");
});

Deno.test("isCartMandate - IntentMandate should return false", () => {
  assertFalse(isCartMandate(validIntentMandate), "Should not identify IntentMandate as CartMandate");
});

Deno.test("isCartMandate - Unknown mandate should return false", () => {
  assertFalse(isCartMandate(unknownMandate), "Should not identify unknown mandate as CartMandate");
});

// getMandateType Tests
Deno.test("getMandateType - IntentMandate", () => {
  assertEquals(getMandateType(validIntentMandate), MandateType.INTENT);
});

Deno.test("getMandateType - CartMandate", () => {
  assertEquals(getMandateType(validCartMandate), MandateType.CART);
});

Deno.test("getMandateType - Unknown mandate", () => {
  assertEquals(getMandateType(unknownMandate), MandateType.UNKNOWN);
});

// Edge Cases
Deno.test("Type guards with partial IntentMandate", () => {
  const partialIntent = {
    natural_language_description: "Buy something"
    // Missing intent_expiry
  } as Mandate;

  assertFalse(isIntentMandate(partialIntent), "Should not identify partial IntentMandate");
  assertEquals(getMandateType(partialIntent), MandateType.UNKNOWN);
});

Deno.test("Type guards with partial CartMandate", () => {
  const partialCart = {
    contents: {
      id: "cart-123"
      // Missing other required fields
    }
  } as Mandate;

  // Since we only check for presence of 'contents' field, this should still be identified as CART
  assert(isCartMandate(partialCart), "Should identify mandate with contents as CartMandate");
  assertEquals(getMandateType(partialCart), MandateType.CART);
});

// Mixed fields (should be detected as UNKNOWN due to conflicting fields)
Deno.test("Type guards with mixed mandate fields", () => {
  const mixedMandate = {
    natural_language_description: "Buy something",
    intent_expiry: "2024-12-31T23:59:59Z",
    contents: {
      id: "cart-123",
      merchant_name: "Test Store"
    }
  } as Mandate;

  // Should be detected as unknown because it has both intent and cart fields
  assertFalse(isIntentMandate(mixedMandate), "Should not identify mixed mandate as IntentMandate");
  assertFalse(isCartMandate(mixedMandate), "Should not identify mixed mandate as CartMandate");
  assertEquals(getMandateType(mixedMandate), MandateType.UNKNOWN);
});

// TypeScript compilation tests (these test that the type guards work at compile time)
Deno.test("Type guards provide proper TypeScript narrowing", () => {
  const mandate: Mandate = validIntentMandate;

  if (isIntentMandate(mandate)) {
    // TypeScript should know mandate is IntentMandate here
    assertEquals(typeof mandate.natural_language_description, "string");
    assertEquals(typeof mandate.intent_expiry, "string");
  }

  if (isCartMandate(mandate)) {
    // This won't execute for validIntentMandate, but TypeScript should know mandate is CartMandate here
    assert(false, "This should not execute for IntentMandate");
  }
});

Deno.test("Type guards work with CartMandate TypeScript narrowing", () => {
  const mandate: Mandate = validCartMandate;

  if (isCartMandate(mandate)) {
    // TypeScript should know mandate is CartMandate here
    assertEquals(typeof mandate.contents, "object");
    assert(mandate.contents !== null);
  }

  if (isIntentMandate(mandate)) {
    // This won't execute for validCartMandate
    assert(false, "This should not execute for CartMandate");
  }
});