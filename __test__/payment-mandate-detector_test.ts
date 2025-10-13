/// <reference types="../src/types/deno.d.ts" />
/**
 * PaymentMandate Detector Test Suite
 *
 * Comprehensive tests for PaymentMandateDetector to achieve 100% coverage.
 * Tests type detection, detailed detection, and edge cases.
 */

import { assert, assertEquals } from "@std/assert";
import { PaymentMandateDetector } from "../src/core/mandates/payment/mod.ts";
import { MandateType } from "../src/core/mandates/shared/mod.ts";
import type { PaymentMandate, PaymentMandateContents } from "../src/types/mod.ts";

// Valid test data
const validPaymentMandateContents: PaymentMandateContents = {
  payment_mandate_id: "pm_test_123",
  payment_details_id: "pd_test_456",
  merchant_agent: "test-merchant-agent",
  payment_details_total: {
    label: "Test Payment Total",
    amount: { currency: "USD", value: "99.99" },
    refund_period: 30
  },
  payment_response: {
    requestId: "req_test_789",
    methodName: "basic-card",
    details: { cardNumber: "****1234" }
  },
  timestamp: "2024-01-15T10:00:00.000Z"
};

const validPaymentMandate: PaymentMandate = {
  payment_mandate_contents: validPaymentMandateContents
};

const validPaymentMandateWithAuth: PaymentMandate = {
  payment_mandate_contents: validPaymentMandateContents,
  user_authorization: "mock.jwt.token"
};

Deno.test("PaymentMandateDetector - detectType with valid PaymentMandate", () => {
  const detector = new PaymentMandateDetector();
  const result = detector.detectType(validPaymentMandate);

  assertEquals(result, MandateType.PAYMENT);
});

Deno.test("PaymentMandateDetector - detectType with PaymentMandate with user_authorization", () => {
  const detector = new PaymentMandateDetector();
  const result = detector.detectType(validPaymentMandateWithAuth);

  assertEquals(result, MandateType.PAYMENT);
});

Deno.test("PaymentMandateDetector - detectType missing payment_mandate_contents field", () => {
  const detector = new PaymentMandateDetector();
  const invalidMandate = {
    some_other_field: "value"
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("PaymentMandateDetector - detectType with null payment_mandate_contents", () => {
  const detector = new PaymentMandateDetector();
  const invalidMandate = {
    payment_mandate_contents: null
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("PaymentMandateDetector - detectType missing required payment contents fields", () => {
  const detector = new PaymentMandateDetector();
  const invalidContents = {
    payment_mandate_id: "pm_test_123"
    // Missing other required fields
  };

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const result = detector.detectType(invalidMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("PaymentMandateDetector - detectType with cart-specific fields (mixed mandate)", () => {
  const detector = new PaymentMandateDetector();
  const mixedMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    contents: {  // This makes it mixed with CartMandate
      id: "cart_123"
    }
  };

  const result = detector.detectType(mixedMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("PaymentMandateDetector - detectType with intent-specific fields (mixed mandate)", () => {
  const detector = new PaymentMandateDetector();
  const mixedMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    natural_language_description: "Buy something", // Intent field
    intent_expiry: "2024-12-31T23:59:59Z"
  };

  const result = detector.detectType(mixedMandate);

  assertEquals(result, MandateType.UNKNOWN);
});

Deno.test("PaymentMandateDetector - canHandle PAYMENT type", () => {
  const detector = new PaymentMandateDetector();
  const result = detector.canHandle(MandateType.PAYMENT);

  assertEquals(result, true);
});

Deno.test("PaymentMandateDetector - canHandle other types", () => {
  const detector = new PaymentMandateDetector();

  assertEquals(detector.canHandle(MandateType.INTENT), false);
  assertEquals(detector.canHandle(MandateType.CART), false);
  assertEquals(detector.canHandle(MandateType.UNKNOWN), false);
});

Deno.test("PaymentMandateDetector - detectWithDetails valid PaymentMandate", () => {
  const detector = new PaymentMandateDetector();
  const result = detector.detectWithDetails(validPaymentMandate);

  assertEquals(result.type, MandateType.PAYMENT);
  assert(result.confidence > 0.8);
  assert(result.reasons.length > 0);
  assert(result.reasons.some(reason => reason.includes("required PaymentMandate payment_mandate_contents field")));
  assert(result.reasons.some(reason => reason.includes("Contents has required payment fields")));
  assert(result.reasons.some(reason => reason.includes("Does not have Cart or Intent mandate-specific fields")));
});

Deno.test("PaymentMandateDetector - detectWithDetails with user_authorization", () => {
  const detector = new PaymentMandateDetector();
  const result = detector.detectWithDetails(validPaymentMandateWithAuth);

  assertEquals(result.type, MandateType.PAYMENT);
  assert(result.confidence > 0.9); // Should be higher with user_authorization
  assert(result.reasons.some(reason => reason.includes("Has optional user_authorization field")));
});

Deno.test("PaymentMandateDetector - detectWithDetails missing payment_mandate_contents", () => {
  const detector = new PaymentMandateDetector();
  const invalidMandate = {
    some_other_field: "value"
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Missing required PaymentMandate payment_mandate_contents field"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails contents missing required fields", () => {
  const detector = new PaymentMandateDetector();
  const invalidContents = {
    payment_mandate_id: "pm_test_123"
    // Missing other required fields: payment_details_id, merchant_agent, etc.
  };

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Contents missing required payment fields"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails with cart-specific fields", () => {
  const detector = new PaymentMandateDetector();
  const mixedMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    contents: {  // Cart-specific field
      id: "cart_123"
    }
  };

  const result = detector.detectWithDetails(mixedMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Has Cart or Intent mandate-specific fields"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails with intent-specific fields", () => {
  const detector = new PaymentMandateDetector();
  const mixedMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    natural_language_description: "Buy something" // Intent-specific field
  };

  const result = detector.detectWithDetails(mixedMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Has Cart or Intent mandate-specific fields"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails with intent_expiry field", () => {
  const detector = new PaymentMandateDetector();
  const mixedMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    intent_expiry: "2024-12-31T23:59:59Z" // Intent-specific field
  };

  const result = detector.detectWithDetails(mixedMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Has Cart or Intent mandate-specific fields"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails confidence calculation", () => {
  const detector = new PaymentMandateDetector();

  // Test mandate without user_authorization (should be lower confidence)
  const resultWithoutAuth = detector.detectWithDetails(validPaymentMandate);

  // Test mandate with user_authorization (should be higher confidence)
  const resultWithAuth = detector.detectWithDetails(validPaymentMandateWithAuth);

  // With auth should have higher confidence
  assert(resultWithAuth.confidence > resultWithoutAuth.confidence);

  // Both should be valid payment mandates
  assertEquals(resultWithoutAuth.type, MandateType.PAYMENT);
  assertEquals(resultWithAuth.type, MandateType.PAYMENT);
});

Deno.test("PaymentMandateDetector - detectWithDetails empty contents object", () => {
  const detector = new PaymentMandateDetector();
  const invalidMandate = {
    payment_mandate_contents: {} // Empty contents
  };

  const result = detector.detectWithDetails(invalidMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assertEquals(result.reasons, ["Contents missing required payment fields"]);
});

Deno.test("PaymentMandateDetector - detectWithDetails minimum valid PaymentMandate", () => {
  const detector = new PaymentMandateDetector();
  const minimalMandate = {
    payment_mandate_contents: validPaymentMandateContents
    // No user_authorization, no other fields
  };

  const result = detector.detectWithDetails(minimalMandate);

  assertEquals(result.type, MandateType.PAYMENT);
  // Should be exactly 1.0 (0.3 + 0.6 + 0.1 = 1.0)
  assert(Math.abs(result.confidence - 1.0) < 0.0001);
  assertEquals(result.reasons.length, 3);
  assert(result.reasons.includes("Has required PaymentMandate payment_mandate_contents field"));
  assert(result.reasons.includes("Contents has required payment fields"));
  assert(result.reasons.includes("Does not have Cart or Intent mandate-specific fields"));
});

Deno.test("PaymentMandateDetector - detectWithDetails maximum confidence PaymentMandate", () => {
  const detector = new PaymentMandateDetector();
  const maximalMandate = {
    payment_mandate_contents: validPaymentMandateContents,
    user_authorization: "mock.jwt.token"
    // Has all possible positive indicators
  };

  const result = detector.detectWithDetails(maximalMandate);

  assertEquals(result.type, MandateType.PAYMENT);
  // Should be exactly 1.0 (0.3 + 0.6 + 0.1 + 0.05 = 1.05, capped at 1.0)
  assertEquals(result.confidence, 1.0);
  assertEquals(result.reasons.length, 4);
  assert(result.reasons.includes("Has required PaymentMandate payment_mandate_contents field"));
  assert(result.reasons.includes("Contents has required payment fields"));
  assert(result.reasons.includes("Does not have Cart or Intent mandate-specific fields"));
  assert(result.reasons.includes("Has optional user_authorization field"));
});