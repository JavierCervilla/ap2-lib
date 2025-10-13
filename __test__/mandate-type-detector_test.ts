/**
 * Tests for MandateTypeDetectorRegistry
 *
 * Full coverage including PaymentMandate detection
 */

import { assertEquals, assert, assertFalse } from "./test_helper.ts";
import {
  MandateType,
  MandateTypeDetectorRegistry,
  BaseMandateTypeDetector
} from "../src/core/mandates/shared/mod.ts";
import { IntentMandateDetector } from "../src/core/mandates/intent/mod.ts";
import { CartMandateDetector } from "../src/core/mandates/cart/mod.ts";
import type { IntentMandate, CartMandate, Mandate } from "../src/types/mod.ts";


/* -------------------------------------------------------------------------- */
/*                               Test Fixtures                                */
/* -------------------------------------------------------------------------- */

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

const validPaymentMandate = {
  payment_mandate_contents: {
    payment_mandate_id: "pay-001",
    payment_details_id: "details-001",
    payment_details_total: {
      label: "Total",
      amount: { currency: "USD", value: "100.00" },
    },
    payment_response: { status: "pending" },
    methodData: [{ supportedMethods: "basic-card" }],
    merchant_agent: "Example Merchant",
    timestamp: "2024-01-01T12:00:00Z",
  },
} as unknown as Mandate;

const minimalIntentMandate = {
  natural_language_description: "Buy something",
  intent_expiry: "2024-12-31T23:59:59Z"
} as IntentMandate;

const unknownMandate = {
  unknown_field: "some value",
  other_field: 42
} as unknown as Mandate;

/* -------------------------------------------------------------------------- */
/*                           Step 1: Base detection                           */
/* -------------------------------------------------------------------------- */

Deno.test("MandateTypeDetectorRegistry - detectType basic cases", () => {
  const registry = new MandateTypeDetectorRegistry();
  assertEquals(registry.detectType(validIntentMandate), MandateType.INTENT);
  assertEquals(registry.detectType(validCartMandate), MandateType.CART);
  assertEquals(registry.detectType(validPaymentMandate), MandateType.PAYMENT);
  assertEquals(registry.detectType(unknownMandate), MandateType.UNKNOWN);
});

/* -------------------------------------------------------------------------- */
/*                       Step 2: IntentMandateDetector                        */
/* -------------------------------------------------------------------------- */

Deno.test("IntentMandateDetector - detectType and details", () => {
  const detector = new IntentMandateDetector();

  // Basic detection
  assertEquals(detector.detectType(validIntentMandate), MandateType.INTENT);
  assertEquals(detector.detectType(validCartMandate), MandateType.UNKNOWN);

  // canHandle
  assert(detector.canHandle(MandateType.INTENT));
  assertFalse(detector.canHandle(MandateType.CART));

  // detectWithDetails - valid
  const details = detector.detectWithDetails(validIntentMandate);
  assertEquals(details.type, MandateType.INTENT);
  assert(details.confidence > 0.8);
  assert(details.reasons.some(r => r.includes("required IntentMandate fields")));

  // detectWithDetails - invalid
  const invalid = detector.detectWithDetails(validCartMandate);
  assertEquals(invalid.type, MandateType.UNKNOWN);
  assertEquals(invalid.confidence, 0);
  assert(
    invalid.reasons.some(r =>
      r.includes("Missing required IntentMandate fields") ||
      r.includes("CartMandate-specific fields")
    )
  );
});

/* -------------------------------------------------------------------------- */
/*                        Step 3: CartMandateDetector                         */
/* -------------------------------------------------------------------------- */

Deno.test("CartMandateDetector - detectType and details", () => {
  const detector = new CartMandateDetector();

  // Basic detection
  assertEquals(detector.detectType(validCartMandate), MandateType.CART);
  assertEquals(detector.detectType(validIntentMandate), MandateType.UNKNOWN);

  // canHandle
  assert(detector.canHandle(MandateType.CART));
  assertFalse(detector.canHandle(MandateType.INTENT));

  // detectWithDetails - valid
  const details = detector.detectWithDetails(validCartMandate);
  assertEquals(details.type, MandateType.CART);
  assert(details.confidence > 0.8);
  assert(details.reasons.some(r => r.includes("required CartMandate")));

  // detectWithDetails - invalid
  const invalid = detector.detectWithDetails(validIntentMandate);
  assertEquals(invalid.type, MandateType.UNKNOWN);
  assertEquals(invalid.confidence, 0);
  assert(
    invalid.reasons.some(r =>
      r.includes("Missing required CartMandate") ||
      r.includes("IntentMandate-specific fields")
    )
  );
});

/* -------------------------------------------------------------------------- */
/*                       Step 4: Advanced registry logic                      */
/* -------------------------------------------------------------------------- */

Deno.test("MandateTypeDetectorRegistry - detectWithDetails & getBestDetection", async () => {
  const registry = new MandateTypeDetectorRegistry();

  const results = await registry.detectWithDetails(validIntentMandate);
  assert(results.length >= 2);
  assert(results.some(r => r.type === MandateType.INTENT));
  assert(results.some(r => r.type === MandateType.UNKNOWN));

  const best = await registry.getBestDetection(validIntentMandate);
  assertEquals(best.type, MandateType.INTENT);
  assert(best.confidence > 0);
});

Deno.test("MandateTypeDetectorRegistry - getBestDetection edge cases", async () => {
  const registry = new MandateTypeDetectorRegistry();

  const unknown = await registry.getBestDetection(unknownMandate);
  assertEquals(unknown.type, MandateType.UNKNOWN);
  assertEquals(unknown.confidence, 0);

  const payment = await registry.getBestDetection(validPaymentMandate);
  assertEquals(payment.type, MandateType.PAYMENT);
  assert(payment.confidence >= 0);
});

/* -------------------------------------------------------------------------- */
/*                        Step 5: Edge and invalid cases                      */
/* -------------------------------------------------------------------------- */

Deno.test("MandateTypeDetectorRegistry - mixed and invalid inputs", () => {
  const registry = new MandateTypeDetectorRegistry();

  // Mixed mandate (intent + cart)
  const mixedMandate = {
    natural_language_description: "Buy something",
    intent_expiry: "2024-12-31T23:59:59Z",
    contents: { id: "cart-123" }
  } as Mandate;

  assertEquals(registry.detectType(mixedMandate), MandateType.UNKNOWN);

  // Null / undefined / empty
  assertEquals(registry.detectType(null as any), MandateType.UNKNOWN);
  assertEquals(registry.detectType(undefined as any), MandateType.UNKNOWN);
  assertEquals(registry.detectType({} as Mandate), MandateType.UNKNOWN);

  // Partial cart
  const incompleteCart = { contents: { id: "test" } } as Mandate;
  const cartDetector = new CartMandateDetector();
  assertEquals(cartDetector.detectType(incompleteCart), MandateType.UNKNOWN);
});

/* -------------------------------------------------------------------------- */
/*                    Step 6: Deep coverage for utility branches              */
/* -------------------------------------------------------------------------- */

/**
 * Test a minimal subclass to trigger protected methods in BaseMandateTypeDetector
 */
class DummyDetector extends BaseMandateTypeDetector {
  detectType(_mandate: any) {
    return MandateType.UNKNOWN;
  }
  canHandle(_type: MandateType): boolean {
    return false;
  }
}

Deno.test("BaseMandateTypeDetector - hasFields and hasAnyFields edge cases", () => {
  const detector = new DummyDetector();

  // Should return false for non-object types
  assertFalse(detector['hasFields'](null, ["x"]));
  assertFalse(detector['hasFields']("string", ["x"]));
  assertFalse(detector['hasAnyFields'](42, ["x", "y"]));

  // True when all fields present
  assert(detector['hasFields']({ a: 1, b: 2 }, ["a", "b"]));
  // True when at least one field present
  assert(detector['hasAnyFields']({ a: 1 }, ["a", "b"]));
});

/**
 * Ensure detectType() handles mixed field scenario correctly
 */
Deno.test("MandateTypeDetectorRegistry - detectType with multiple mandate types (mixed)", () => {
  const registry = new MandateTypeDetectorRegistry();
  const mixed = {
    natural_language_description: "Buy coffee",
    contents: { id: "cart-1" },
    payment_mandate_contents: { payment_mandate_id: "pay-001" }
  } as unknown as Mandate;

  assertEquals(registry.detectType(mixed), MandateType.UNKNOWN);
});

/**
 * Force fallback path in detectWithDetails() when detector lacks detectWithDetails
 */
Deno.test("MandateTypeDetectorRegistry - detectWithDetails fallback path", async () => {
  const registry = new MandateTypeDetectorRegistry();
  const fakeDetector = new DummyDetector();

  // registerDetector adds detector only if canHandle returns true
  // so we manually insert it for test
  (registry as any).detectors.set(MandateType.UNKNOWN, fakeDetector);

  const results = await registry.detectWithDetails({} as Mandate);
  assert(results.some(r => r.type === MandateType.UNKNOWN));
});

/**
 * Cover getBestDetection() when detectWithDetails() returns empty array
 */
Deno.test("MandateTypeDetectorRegistry - getBestDetection with no detectors", async () => {
  const registry = new MandateTypeDetectorRegistry();

  // Mock detectWithDetails to return an empty array
  (registry as any).detectWithDetails = async () => [];

  const result = await registry.getBestDetection({});

  assertEquals(result.type, MandateType.UNKNOWN);
  assertEquals(result.confidence, 0);
  assert(result.reasons.includes("No registered detectors"));
});


/**
 * Test registerDetector() skipping unsupported types
 */
Deno.test("MandateTypeDetectorRegistry - registerDetector only registers supported types", () => {
  const registry = new MandateTypeDetectorRegistry();
  const dummy = new DummyDetector();

  // This detector returns false for all canHandle(), so it should not be added
  registry.registerDetector(dummy);

  const detectors = (registry as any).detectors;
  assertEquals(detectors.size, 0);
});
