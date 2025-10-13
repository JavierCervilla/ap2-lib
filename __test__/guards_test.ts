/**
 * Tests for Type Guards (Refactored)
 */

import { assertEquals, assert, assertFalse } from "./test_helper.ts";
import { isIntentMandate, isCartMandate, getMandateType } from "../src/types/guards.ts";
import { MandateType } from "../src/core/mandates/shared/mod.ts";
import type { IntentMandate, CartMandate, Mandate } from "../src/types/mod.ts";

// --- Test Data Setup ---
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
  unknown_field: "some value"
} as unknown as Mandate;


// --- Test Suites ---

Deno.test("isIntentMandate()", async (t) => {
  await t.step("should return true for a valid IntentMandate", () => {
    assert(isIntentMandate(validIntentMandate));
  });

  await t.step("should return false for a CartMandate", () => {
    assertFalse(isIntentMandate(validCartMandate));
  });

  await t.step("should return false for an unknown object", () => {
    assertFalse(isIntentMandate(unknownMandate));
  });
});

Deno.test("isCartMandate()", async (t) => {
  await t.step("should return true for a valid CartMandate", () => {
    assert(isCartMandate(validCartMandate));
  });

  await t.step("should return false for an IntentMandate", () => {
    assertFalse(isCartMandate(validIntentMandate));
  });

  await t.step("should return false for an unknown object", () => {
    assertFalse(isCartMandate(unknownMandate));
  });
});

Deno.test("getMandateType()", async (t) => {
  await t.step("should return INTENT for an IntentMandate", () => {
    assertEquals(getMandateType(validIntentMandate), MandateType.INTENT);
  });

  await t.step("should return CART for a CartMandate", () => {
    assertEquals(getMandateType(validCartMandate), MandateType.CART);
  });

  await t.step("should return UNKNOWN for an unknown object", () => {
    assertEquals(getMandateType(unknownMandate), MandateType.UNKNOWN);
  });
});

Deno.test("Type Guard Edge Cases", async (t) => {
  await t.step("should handle partial IntentMandates correctly", () => {
    const partialIntent = { natural_language_description: "Buy something" } as Mandate;
    assertFalse(isIntentMandate(partialIntent), "A partial IntentMandate should not be identified as valid");
    assertEquals(getMandateType(partialIntent), MandateType.UNKNOWN);
  });

  await t.step("should handle partial CartMandates correctly", () => {
    const partialCart = { contents: { id: "cart-123" } } as Mandate;
    // The current guard only checks for the presence of 'contents', so this is expected behavior.
    assert(isCartMandate(partialCart), "A mandate with a 'contents' object should be identified as a CartMandate");
    assertEquals(getMandateType(partialCart), MandateType.CART);
  });

  await t.step("should handle mixed-field mandates as UNKNOWN", () => {
    const mixedMandate = {
      natural_language_description: "Buy something",
      contents: { id: "cart-123" }
    } as unknown as Mandate;
    assertFalse(isIntentMandate(mixedMandate));
    assertFalse(isCartMandate(mixedMandate));
    assertEquals(getMandateType(mixedMandate), MandateType.UNKNOWN);
  });
});

Deno.test("TypeScript Type Narrowing", async (t) => {
  await t.step("should correctly narrow type to IntentMandate", () => {
    const mandate: Mandate = validIntentMandate;
    if (isIntentMandate(mandate)) {
      // This block proves TypeScript understands the type.
      assertEquals(typeof mandate.natural_language_description, "string");
    } else {
      assert(false, "isIntentMandate() failed to identify a valid IntentMandate");
    }
  });

  await t.step("should correctly narrow type to CartMandate", () => {
    const mandate: Mandate = validCartMandate;
    if (isCartMandate(mandate)) {
      // This block proves TypeScript understands the type.
      assertEquals(typeof mandate.contents, "object");
      assert(mandate.contents !== null);
    } else {
      assert(false, "isCartMandate() failed to identify a valid CartMandate");
    }
  });
});