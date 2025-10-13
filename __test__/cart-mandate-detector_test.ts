 
/**
 * CartMandate Detector Test Suite
 *
 * Comprehensive tests for CartMandateDetector to achieve 100% coverage.
 * Tests type detection, detailed detection, and edge cases.
 */

import { assert, assertEquals } from "@std/assert";
import { CartMandateDetector } from "../src/core/mandates/cart/mod.ts";
import { MandateType } from "../src/core/mandates/shared/mod.ts";
import type { CartMandate, CartContents } from "../src/types/mod.ts";

// Valid test data
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

Deno.test("CartMandateDetector - detectType with valid CartMandate", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectType(validCartMandate);

  assertEquals(result, MandateType.CART);
});

Deno.test("CartMandateDetector - detectType with CartMandate with merchant_authorization", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectType(validCartMandateWithAuth);

  assertEquals(result, MandateType.CART);
});

Deno.test("CartMandateDetector - detectType missing contents field", () => {
  const detector = new CartMandateDetector();
  const invalidMandate = {
    some_other_field: "value"
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("CartMandateDetector - detectType with null contents", () => {
  const detector = new CartMandateDetector();
  const invalidMandate = {
    contents: null
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("CartMandateDetector - detectType missing required cart contents fields", () => {
  const detector = new CartMandateDetector();
  const invalidContents = {
    id: "cart-123"
    // Missing other required fields: merchant_name, cart_expiry, payment_request
  };

  const invalidMandate = {
    contents: invalidContents
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

// CRITICAL TEST: This covers lines 29-31 (intent-specific fields in detectType)
Deno.test("CartMandateDetector - detectType with intent-specific fields (mixed mandate)", () => {
  const detector = new CartMandateDetector();
  const mixedMandate = {
    contents: validCartContents,
    natural_language_description: "Buy something", // Intent-specific field
    intent_expiry: "2024-12-31T23:59:59Z"
  };

  const result = detector.detectType(mixedMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

// CRITICAL TEST: This covers lines 29-31 (only natural_language_description)
Deno.test("CartMandateDetector - detectType with only natural_language_description", () => {
  const detector = new CartMandateDetector();
  const mixedMandate = {
    contents: validCartContents,
    natural_language_description: "Buy something" // Intent-specific field
  };

  const result = detector.detectType(mixedMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

// CRITICAL TEST: This covers lines 29-31 (only intent_expiry)
Deno.test("CartMandateDetector - detectType with only intent_expiry", () => {
  const detector = new CartMandateDetector();
  const mixedMandate = {
    contents: validCartContents,
    intent_expiry: "2024-12-31T23:59:59Z" // Intent-specific field
  };

  const result = detector.detectType(mixedMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("CartMandateDetector - canHandle CART type", () => {
  const detector = new CartMandateDetector();
  const result = detector.canHandle(MandateType.CART);

  assertEquals(result, true);
});

Deno.test("CartMandateDetector - canHandle other types", () => {
  const detector = new CartMandateDetector();

  assertEquals(detector.canHandle(MandateType.INTENT), false);
  assertEquals(detector.canHandle(MandateType.PAYMENT), false);
  assertEquals(detector.canHandle(MandateType.UNKNOWN), false);
});

Deno.test("CartMandateDetector - detectWithDetails valid CartMandate", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectWithDetails(validCartMandate);

  assertEquals(result.type, MandateType.CART);
  assert(result.confidence > 0.8);
  assert(result.reasons.length > 0);
  assert(result.reasons.some(reason => reason.includes("required CartMandate contents field")));
  assert(result.reasons.some(reason => reason.includes("Contents has required cart fields")));
  assert(result.reasons.some(reason => reason.includes("Does not have IntentMandate-specific fields")));
});

Deno.test("CartMandateDetector - detectWithDetails with merchant_authorization", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectWithDetails(validCartMandateWithAuth);

  assertEquals(result.type, MandateType.CART);
  assert(result.confidence > 0.8);
  assert(result.reasons.length > 0);
});

Deno.test("CartMandateDetector - detectWithDetails missing contents", () => {
  const detector = new CartMandateDetector();
  const invalidMandate = {
    some_other_field: "value"
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Missing required CartMandate contents field"]);
});

// CRITICAL TEST: This covers lines 56-62 (contents missing required fields in detectWithDetails)
Deno.test("CartMandateDetector - detectWithDetails contents missing required fields", () => {
  const detector = new CartMandateDetector();
  const invalidContents = {
    id: "cart-123"
    // Missing other required fields: merchant_name, cart_expiry, payment_request
  };

  const invalidMandate = {
    contents: invalidContents
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Contents missing required cart fields"]);
});

// CRITICAL TEST: This covers lines 75-81 (intent-specific fields in detectWithDetails)
Deno.test("CartMandateDetector - detectWithDetails with intent-specific fields", () => {
  const detector = new CartMandateDetector();
  const mixedMandate = {
    contents: validCartContents,
    natural_language_description: "Buy something" // Intent-specific field
  };

  const result = detector.detectWithDetails(mixedMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Has IntentMandate-specific fields"]);
});

// CRITICAL TEST: This also covers lines 75-81 (with intent_expiry field)
Deno.test("CartMandateDetector - detectWithDetails with intent_expiry field", () => {
  const detector = new CartMandateDetector();
  const mixedMandate = {
    contents: validCartContents,
    intent_expiry: "2024-12-31T23:59:59Z" // Intent-specific field
  };

  const result = detector.detectWithDetails(mixedMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Has IntentMandate-specific fields"]);
});

// CRITICAL TEST: This covers lines 75-81 (with both intent fields)
Deno.test("CartMandateDetector - detectWithDetails with both intent fields", () => {
  const detector = new CartMandateDetector();
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

Deno.test("CartMandateDetector - detectWithDetails confidence calculation", () => {
  const detector = new CartMandateDetector();

  // Test valid mandate confidence
  const result = detector.detectWithDetails(validCartMandate);

  // Should be exactly 1.0 (0.4 + 0.5 + 0.1 = 1.0)
  assertEquals(result.type, MandateType.CART);
  assertEquals(result.confidence, 1.0);
  assertEquals(result.reasons.length, 3);
  assert(result.reasons.includes("Has required CartMandate contents field"));
  assert(result.reasons.includes("Contents has required cart fields"));
  assert(result.reasons.includes("Does not have IntentMandate-specific fields"));
});

Deno.test("CartMandateDetector - detectWithDetails empty contents object", () => {
  const detector = new CartMandateDetector();
  const invalidMandate = {
    contents: {} // Empty contents
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Contents missing required cart fields"]);
});

Deno.test("CartMandateDetector - detectWithDetails with null contents", () => {
  const detector = new CartMandateDetector();
  const invalidMandate = {
    contents: null
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Contents missing required cart fields"]);
});