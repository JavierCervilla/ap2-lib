 
/**
 * Tests for MandateTypeDetectorRegistry
 *
 * Improving test coverage for mandate type detection system
 */

import { assertEquals, assert, assertFalse } from "@std/assert";
import {
  MandateType,
  MandateTypeDetectorRegistry,
  defaultMandateTypeDetector
} from "../src/core/mandates/shared/mod.ts";
import { IntentMandateDetector } from "../src/core/mandates/intent/mod.ts";
import { CartMandateDetector } from "../src/core/mandates/cart/mod.ts";
import type { IntentMandate, CartMandate, Mandate } from "../src/types/mod.ts";

// Test fixtures
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2024-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
  merchants: ["coffee-store.com"],
  requires_refundability: true
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

const minimalIntentMandate = {
  natural_language_description: "Buy something",
  intent_expiry: "2024-12-31T23:59:59Z"
} as IntentMandate;

const unknownMandate = {
  unknown_field: "some value",
  other_field: 42
} as unknown as Mandate;

// MandateTypeDetectorRegistry Tests
Deno.test("MandateTypeDetectorRegistry - detectType with IntentMandate", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(validIntentMandate), MandateType.INTENT);
});

Deno.test("MandateTypeDetectorRegistry - detectType with CartMandate", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(validCartMandate), MandateType.CART);
});

Deno.test("MandateTypeDetectorRegistry - detectType with unknown mandate", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(unknownMandate), MandateType.UNKNOWN);
});

Deno.test("MandateTypeDetectorRegistry - detectType with minimal IntentMandate", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(minimalIntentMandate), MandateType.INTENT);
});

// Default singleton tests
Deno.test("defaultMandateTypeDetector - should work correctly", () => {
  assertEquals(defaultMandateTypeDetector.detectType(validIntentMandate), MandateType.INTENT);
  assertEquals(defaultMandateTypeDetector.detectType(validCartMandate), MandateType.CART);
  assertEquals(defaultMandateTypeDetector.detectType(unknownMandate), MandateType.UNKNOWN);
});

// IntentMandateDetector specific tests
Deno.test("IntentMandateDetector - detectType with valid intent", () => {
  const detector = new IntentMandateDetector();
  assertEquals(detector.detectType(validIntentMandate), MandateType.INTENT);
});

Deno.test("IntentMandateDetector - detectType with cart mandate should return UNKNOWN", () => {
  const detector = new IntentMandateDetector();
  assertEquals(detector.detectType(validCartMandate), MandateType.UNKNOWN);
});

Deno.test("IntentMandateDetector - canHandle", () => {
  const detector = new IntentMandateDetector();
  assert(detector.canHandle(MandateType.INTENT));
  assertFalse(detector.canHandle(MandateType.CART));
  assertFalse(detector.canHandle(MandateType.UNKNOWN));
});

Deno.test("IntentMandateDetector - detectWithDetails valid intent", () => {
  const detector = new IntentMandateDetector();
  const result = detector.detectWithDetails(validIntentMandate);

  assertEquals(result.type, MandateType.INTENT);
  assert(result.confidence > 0.8);
  assert(result.reasons.length > 0);
  assert(result.reasons.some(reason => reason.includes("required IntentMandate fields")));
});

Deno.test("IntentMandateDetector - detectWithDetails with cart mandate", () => {
  const detector = new IntentMandateDetector();
  const result = detector.detectWithDetails(validCartMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  // The message should mention missing required fields or having cart-specific fields
  assert(
    result.reasons.some(reason =>
      reason.includes("Missing required IntentMandate fields") ||
      reason.includes("CartMandate-specific fields")
    ),
    `Expected reason about missing fields or cart-specific fields, got: ${result.reasons.join(', ')}`
  );
});

Deno.test("IntentMandateDetector - detectWithDetails missing required fields", () => {
  const detector = new IntentMandateDetector();
  const incomplete = { natural_language_description: "test" } as Mandate;
  const result = detector.detectWithDetails(incomplete);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assert(result.reasons.some(reason => reason.includes("Missing required IntentMandate fields")));
});

// CartMandateDetector specific tests
Deno.test("CartMandateDetector - detectType with valid cart", () => {
  const detector = new CartMandateDetector();
  assertEquals(detector.detectType(validCartMandate), MandateType.CART);
});

Deno.test("CartMandateDetector - detectType with intent mandate should return UNKNOWN", () => {
  const detector = new CartMandateDetector();
  assertEquals(detector.detectType(validIntentMandate), MandateType.UNKNOWN);
});

Deno.test("CartMandateDetector - canHandle", () => {
  const detector = new CartMandateDetector();
  assert(detector.canHandle(MandateType.CART));
  assertFalse(detector.canHandle(MandateType.INTENT));
  assertFalse(detector.canHandle(MandateType.UNKNOWN));
});

Deno.test("CartMandateDetector - detectWithDetails valid cart", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectWithDetails(validCartMandate);

  assertEquals(result.type, MandateType.CART);
  assert(result.confidence > 0.8);
  assert(result.reasons.length > 0);
  assert(result.reasons.some(reason => reason.includes("required CartMandate contents field") || reason.includes("required cart fields")));
});

Deno.test("CartMandateDetector - detectWithDetails with intent mandate", () => {
  const detector = new CartMandateDetector();
  const result = detector.detectWithDetails(validIntentMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  // The message should mention missing required fields or having intent-specific fields
  assert(
    result.reasons.some(reason =>
      reason.includes("Missing required CartMandate contents field") ||
      reason.includes("IntentMandate-specific fields")
    ),
    `Expected reason about missing fields or intent-specific fields, got: ${result.reasons.join(', ')}`
  );
});

Deno.test("CartMandateDetector - detectWithDetails missing contents", () => {
  const detector = new CartMandateDetector();
  const incomplete = { other_field: "test" } as unknown as Mandate;
  const result = detector.detectWithDetails(incomplete);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assert(result.reasons.some(reason => reason.includes("Missing required CartMandate contents field")));
});

// Registry advanced features tests
Deno.test("MandateTypeDetectorRegistry - detectWithDetails", async () => {
  const registry = new MandateTypeDetectorRegistry();
  const results = await registry.detectWithDetails(validIntentMandate);

  assert(results.length >= 2); // Should have results from both detectors
  assert(results.some(result => result.type === MandateType.INTENT && result.confidence > 0));
  assert(results.some(result => result.type === MandateType.UNKNOWN && result.confidence === 0));
});

Deno.test("MandateTypeDetectorRegistry - getBestDetection", async () => {
  const registry = new MandateTypeDetectorRegistry();
  const result = await registry.getBestDetection(validIntentMandate);

  assertEquals(result.type, MandateType.INTENT);
  assert(result.confidence > 0);
});

Deno.test("MandateTypeDetectorRegistry - getBestDetection with unknown mandate", async () => {
  const registry = new MandateTypeDetectorRegistry();
  const result = await registry.getBestDetection(unknownMandate);

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
});

Deno.test("MandateTypeDetectorRegistry - getBestDetection with valid intent", async () => {
  const registry = new MandateTypeDetectorRegistry();
  const result = await registry.getBestDetection(validIntentMandate);

  assertEquals(result.type, MandateType.INTENT);
  assert(result.confidence > 0);
  assert(result.reasons.length > 0);
});

// Edge cases and error conditions
Deno.test("MandateTypeDetectorRegistry - mixed mandate fields", () => {
  const mixedMandate = {
    natural_language_description: "Buy something",
    intent_expiry: "2024-12-31T23:59:59Z",
    contents: {
      id: "cart-123"
    }
  } as Mandate;

  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(mixedMandate), MandateType.UNKNOWN);
});

Deno.test("MandateTypeDetectorRegistry - null/undefined input", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(null as any), MandateType.UNKNOWN);
  assertEquals(registry.detectType(undefined as any), MandateType.UNKNOWN);
});

Deno.test("MandateTypeDetectorRegistry - empty object", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType({} as Mandate), MandateType.UNKNOWN);
});

// Test with partial objects that might match partially
Deno.test("CartMandateDetector - mandate with incomplete contents field", () => {
  const onlyContents = {
    contents: {
      id: "test"
    }
  } as Mandate;

  const detector = new CartMandateDetector();
  assertEquals(detector.detectType(onlyContents), MandateType.UNKNOWN);
});