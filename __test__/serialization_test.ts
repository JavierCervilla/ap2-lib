/**
 * Serialization Functions Test Suite (TDD)
 *
 * Tests written FIRST for serialization functions.
 * These tests define the expected behavior before implementation.
 */

import { assert, assertEquals, assertRejects } from "@std/assert";
import type { IntentMandate, CartContents, CartMandate, PaymentRequest } from "../src/mod.ts";
import {
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/utils/mod.ts";

// Import functions that don't exist yet - will be implemented to pass these tests
import {
  serializeIntentMandate,
  deserializeIntentMandate,
  serializeCartContents,
  deserializeCartContents,
  serializeCartMandate,
  deserializeCartMandate,
  serializePaymentRequest,
  deserializePaymentRequest,
  serializeMandate,
  deserializeMandate,
} from "../src/core/serialization.ts";

// Test data fixtures
const validIntentMandate: IntentMandate = {
  user_cart_confirmation_required: true,
  natural_language_description: "High quality wireless headphones under $200",
  merchants: ["bestbuy.com", "amazon.com"],
  skus: ["SKU123", "SKU456"],
  requires_refundability: true,
  intent_expiry: createFutureISO8601(TIME_CONSTANTS.WEEK),
};

const validPaymentRequest: PaymentRequest = {
  id: "payment-req-789",
  methodData: [
    { supportedMethods: "basic-card" },
    { supportedMethods: "https://pay.google.com" },
  ],
  details: {
    total: {
      label: "Order Total",
      amount: { currency: "USD", value: "199.99" },
      refund_period: 14,
    },
    displayItems: [
      {
        label: "Wireless Headphones",
        amount: { currency: "USD", value: "179.99" },
        refund_period: 14,
      },
      {
        label: "Shipping",
        amount: { currency: "USD", value: "20.00" },
        refund_period: 0,
      },
    ],
  },
  options: {
    requestPayerName: true,
    requestShipping: true,
  },
};

const validCartContents: CartContents = {
  id: "cart_12345",
  user_cart_confirmation_required: false,
  payment_request: validPaymentRequest,
  cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR * 2),
  merchant_name: "Best Buy",
};

const validCartMandate: CartMandate = {
  contents: validCartContents,
  merchant_authorization: "304502210089abcdef123456789...",
};

Deno.test("serializeIntentMandate - Serializes valid IntentMandate to JSON string", async () => {
  const serialized = await serializeIntentMandate(validIntentMandate);

  assert(typeof serialized === "string", "Should return a string");

  // Should be valid JSON
  const parsed = JSON.parse(serialized);
  assert(typeof parsed === "object", "Should parse to an object");

  // Should contain all required fields
  assertEquals(parsed.natural_language_description, validIntentMandate.natural_language_description);
  assertEquals(parsed.intent_expiry, validIntentMandate.intent_expiry);
  assertEquals(parsed.user_cart_confirmation_required, validIntentMandate.user_cart_confirmation_required);
});

Deno.test("deserializeIntentMandate - Deserializes valid JSON to IntentMandate", async () => {
  const serialized = await serializeIntentMandate(validIntentMandate);
  const deserialized = await deserializeIntentMandate(serialized);

  assertEquals(deserialized.natural_language_description, validIntentMandate.natural_language_description);
  assertEquals(deserialized.intent_expiry, validIntentMandate.intent_expiry);
  assertEquals(deserialized.merchants, validIntentMandate.merchants);
  assertEquals(deserialized.skus, validIntentMandate.skus);
  assertEquals(deserialized.requires_refundability, validIntentMandate.requires_refundability);
});

Deno.test("deserializeIntentMandate - Throws on invalid JSON", async () => {
  await assertRejects(
    () => deserializeIntentMandate("not valid json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("deserializeIntentMandate - Throws on missing required fields", async () => {
  const invalidJson = JSON.stringify({
    // Missing natural_language_description
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  });

  await assertRejects(
    () => deserializeIntentMandate(invalidJson),
    Error,
    "required"
  );
});

Deno.test("serializeCartContents - Serializes valid CartContents to JSON string", async () => {
  const serialized = await serializeCartContents(validCartContents);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.id, validCartContents.id);
  assertEquals(parsed.merchant_name, validCartContents.merchant_name);
  assertEquals(parsed.cart_expiry, validCartContents.cart_expiry);
});

Deno.test("deserializeCartContents - Deserializes valid JSON to CartContents", async () => {
  const serialized = await serializeCartContents(validCartContents);
  const deserialized = await deserializeCartContents(serialized);

  assertEquals(deserialized.id, validCartContents.id);
  assertEquals(deserialized.merchant_name, validCartContents.merchant_name);
  assertEquals(deserialized.cart_expiry, validCartContents.cart_expiry);
  assertEquals(deserialized.user_cart_confirmation_required, validCartContents.user_cart_confirmation_required);
});

Deno.test("serializeCartMandate - Serializes valid CartMandate to JSON string", async () => {
  const serialized = await serializeCartMandate(validCartMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assert(parsed.contents, "Should have contents field");
  assertEquals(parsed.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("deserializeCartMandate - Deserializes valid JSON to CartMandate", async () => {
  const serialized = await serializeCartMandate(validCartMandate);
  const deserialized = await deserializeCartMandate(serialized);

  assertEquals(deserialized.contents.id, validCartMandate.contents.id);
  assertEquals(deserialized.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("serializePaymentRequest - Serializes valid PaymentRequest to JSON string", async () => {
  const serialized = await serializePaymentRequest(validPaymentRequest);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.id, validPaymentRequest.id);
  assert(Array.isArray(parsed.methodData), "Should preserve methodData array");
  assertEquals(parsed.methodData.length, validPaymentRequest.methodData.length);
});

Deno.test("deserializePaymentRequest - Deserializes valid JSON to PaymentRequest", async () => {
  const serialized = await serializePaymentRequest(validPaymentRequest);
  const deserialized = await deserializePaymentRequest(serialized);

  assertEquals(deserialized.id, validPaymentRequest.id);
  assertEquals(deserialized.methodData.length, validPaymentRequest.methodData.length);
  assertEquals(deserialized.details.total.amount.currency, validPaymentRequest.details.total.amount.currency);
});

Deno.test("serializeMandate - Handles IntentMandate", async () => {
  const serialized = await serializeMandate(validIntentMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.natural_language_description, validIntentMandate.natural_language_description);
});

Deno.test("serializeMandate - Handles CartMandate", async () => {
  const serialized = await serializeMandate(validCartMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assert(parsed.contents, "Should have contents field for CartMandate");
});

Deno.test("deserializeMandate - Detects and deserializes IntentMandate", async () => {
  const serialized = await serializeMandate(validIntentMandate);
  const deserialized = await deserializeMandate(serialized);

  // Should be detected as IntentMandate
  assert('natural_language_description' in deserialized, "Should be IntentMandate");
  assertEquals((deserialized as IntentMandate).natural_language_description, validIntentMandate.natural_language_description);
});

Deno.test("deserializeMandate - Detects and deserializes CartMandate", async () => {
  const serialized = await serializeMandate(validCartMandate);
  const deserialized = await deserializeMandate(serialized);

  // Should be detected as CartMandate
  assert('contents' in deserialized, "Should be CartMandate");
  assertEquals((deserialized as CartMandate).contents.id, validCartMandate.contents.id);
});

Deno.test("Serialization round-trip maintains data integrity", async () => {
  // Test IntentMandate round-trip
  const intentSerialized = await serializeIntentMandate(validIntentMandate);
  const intentDeserialized = await deserializeIntentMandate(intentSerialized);
  assertEquals(intentDeserialized, validIntentMandate);

  // Test CartMandate round-trip
  const cartSerialized = await serializeCartMandate(validCartMandate);
  const cartDeserialized = await deserializeCartMandate(cartSerialized);
  assertEquals(cartDeserialized.contents.id, validCartMandate.contents.id);
  assertEquals(cartDeserialized.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("Serialization handles optional fields correctly", async () => {
  const minimalIntent: IntentMandate = {
    natural_language_description: "Basic product",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const serialized = await serializeIntentMandate(minimalIntent);
  const deserialized = await deserializeIntentMandate(serialized);

  assertEquals(deserialized.natural_language_description, minimalIntent.natural_language_description);
  assertEquals(deserialized.intent_expiry, minimalIntent.intent_expiry);
  // Optional fields should be undefined
  assertEquals(deserialized.merchants, undefined);
  assertEquals(deserialized.skus, undefined);
});

Deno.test("Serialization preserves array types correctly", async () => {
  const intentWithArrays: IntentMandate = {
    natural_language_description: "Product with constraints",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    merchants: ["store1.com", "store2.com"],
    skus: ["SKU1", "SKU2", "SKU3"],
  };

  const serialized = await serializeIntentMandate(intentWithArrays);
  const deserialized = await deserializeIntentMandate(serialized);

  assert(Array.isArray(deserialized.merchants), "Merchants should be array");
  assert(Array.isArray(deserialized.skus), "SKUs should be array");
  assertEquals(deserialized.merchants?.length, 2);
  assertEquals(deserialized.skus?.length, 3);
});

Deno.test("deserializeMandate - Throws on unknown mandate type", async () => {
  const unknownMandateJson = JSON.stringify({
    unknown_field: "value",
    other_field: "another value",
  });

  await assertRejects(
    () => deserializeMandate(unknownMandateJson),
    Error,
    "Unknown mandate type"
  );
});

// Additional tests to improve coverage

Deno.test("deserializeCartContents - Throws on missing id field", async () => {
  const invalidJson = JSON.stringify({
    // Missing id
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => deserializeCartContents(invalidJson),
    Error,
    "Missing required field 'id'"
  );
});

Deno.test("deserializeCartContents - Throws on missing merchant_name field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    // Missing merchant_name
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => deserializeCartContents(invalidJson),
    Error,
    "Missing required field 'merchant_name'"
  );
});

Deno.test("deserializeCartContents - Throws on missing cart_expiry field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    // Missing cart_expiry
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => deserializeCartContents(invalidJson),
    Error,
    "Missing required field 'cart_expiry'"
  );
});

Deno.test("deserializeCartContents - Throws on missing payment_request field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    // Missing payment_request
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => deserializeCartContents(invalidJson),
    Error,
    "Missing required field 'payment_request'"
  );
});

Deno.test("deserializeCartContents - Throws on missing user_cart_confirmation_required field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    // Missing user_cart_confirmation_required
  });

  await assertRejects(
    () => deserializeCartContents(invalidJson),
    Error,
    "Missing required field 'user_cart_confirmation_required'"
  );
});

Deno.test("deserializeCartMandate - Throws on invalid JSON", async () => {
  await assertRejects(
    () => deserializeCartMandate("invalid json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("deserializeCartMandate - Throws on missing contents field", async () => {
  const invalidJson = JSON.stringify({
    // Missing contents
    merchant_authorization: "signature123",
  });

  await assertRejects(
    () => deserializeCartMandate(invalidJson),
    Error,
    "Missing required field 'contents'"
  );
});

Deno.test("deserializePaymentRequest - Throws on invalid JSON", async () => {
  await assertRejects(
    () => deserializePaymentRequest("not json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("deserializePaymentRequest - Throws on missing methodData field", async () => {
  const invalidJson = JSON.stringify({
    id: "payment-123",
    // Missing methodData
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30,
      },
    },
  });

  await assertRejects(
    () => deserializePaymentRequest(invalidJson),
    Error,
    "Missing required field 'methodData'"
  );
});

Deno.test("deserializePaymentRequest - Throws on missing details field", async () => {
  const invalidJson = JSON.stringify({
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    // Missing details
  });

  await assertRejects(
    () => deserializePaymentRequest(invalidJson),
    Error,
    "Missing required field 'details'"
  );
});

Deno.test("serializeMandate - Throws on unknown mandate type", async () => {
  const unknownMandate = {
    unknown_field: "value",
  } as any;

  await assertRejects(
    () => serializeMandate(unknownMandate),
    Error,
    "Unknown mandate type"
  );
});

Deno.test("deserializeMandate - Throws on invalid JSON", async () => {
  await assertRejects(
    () => deserializeMandate("not valid json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("Serialization handles CartMandate without merchant_authorization", async () => {
  const cartMandateWithoutAuth: CartMandate = {
    contents: validCartContents,
    // merchant_authorization is optional
  };

  const serialized = await serializeCartMandate(cartMandateWithoutAuth);
  const deserialized = await deserializeCartMandate(serialized);

  assertEquals(deserialized.contents.id, cartMandateWithoutAuth.contents.id);
  assertEquals(deserialized.merchant_authorization, undefined);
});

Deno.test("Serialization preserves PaymentRequest with all optional fields", async () => {
  const minimalPaymentRequest: PaymentRequest = {
    id: "minimal-payment",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Minimal Total",
        amount: { currency: "EUR", value: "25.50" },
        refund_period: 7,
      },
    },
    // options is optional
  };

  const serialized = await serializePaymentRequest(minimalPaymentRequest);
  const deserialized = await deserializePaymentRequest(serialized);

  assertEquals(deserialized.id, minimalPaymentRequest.id);
  assertEquals(deserialized.details.total.amount.currency, "EUR");
  assertEquals(deserialized.details.total.amount.value, "25.50");
  assertEquals(deserialized.options, undefined);
});

Deno.test("Serialization handles PaymentRequest with displayItems and total", async () => {
  const paymentRequestWithItems: PaymentRequest = {
    id: "items-with-total",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Grand Total",
        amount: { currency: "USD", value: "25.00" },
        refund_period: 14,
      },
      displayItems: [
        {
          label: "Item 1",
          amount: { currency: "USD", value: "15.00" },
          refund_period: 14,
        },
        {
          label: "Item 2",
          amount: { currency: "USD", value: "10.00" },
          refund_period: 14,
        },
      ],
    },
  };

  const serialized = await serializePaymentRequest(paymentRequestWithItems);
  const deserialized = await deserializePaymentRequest(serialized);

  assertEquals(deserialized.details.displayItems?.length, 2);
  assertEquals(deserialized.details.displayItems?.[0].label, "Item 1");
  assertEquals(deserialized.details.total.amount.value, "25.00");
});

Deno.test("Serialization handles complex nested structures", async () => {
  const complexCartMandate: CartMandate = {
    contents: {
      id: "complex_cart_789",
      user_cart_confirmation_required: true,
      payment_request: {
        id: "complex-payment-456",
        methodData: [
          { supportedMethods: "basic-card" },
          { supportedMethods: "https://pay.google.com" },
          { supportedMethods: "https://apple.com/apple-pay" },
        ],
        details: {
          total: {
            label: "Grand Total",
            amount: { currency: "GBP", value: "299.99" },
            refund_period: 30,
          },
          displayItems: [
            {
              label: "Premium Wireless Headphones",
              amount: { currency: "GBP", value: "249.99" },
              refund_period: 30,
            },
            {
              label: "Extended Warranty",
              amount: { currency: "GBP", value: "29.99" },
              refund_period: 0,
            },
            {
              label: "Express Shipping",
              amount: { currency: "GBP", value: "20.01" },
              refund_period: 0,
            },
          ],
        },
        options: {
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: true,
          requestShipping: true,
        },
      },
      cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY * 3),
      merchant_name: "Premium Electronics Ltd",
    },
    merchant_authorization: "304502210089abcdef123456789premium_electronics_signature",
  };

  const serialized = await serializeCartMandate(complexCartMandate);
  const deserialized = await deserializeCartMandate(serialized);

  // Verify deep structure preservation
  assertEquals(deserialized.contents.id, "complex_cart_789");
  assertEquals(deserialized.contents.payment_request.methodData.length, 3);
  assertEquals(deserialized.contents.payment_request.details.displayItems?.length, 3);
  assertEquals(deserialized.contents.payment_request.details.total?.amount.currency, "GBP");
  assertEquals(deserialized.contents.payment_request.options?.requestPayerEmail, true);
  assertEquals(deserialized.merchant_authorization, "304502210089abcdef123456789premium_electronics_signature");
});

Deno.test("Generic mandate serialization correctly identifies IntentMandate vs CartMandate", async () => {
  // Test both types through the generic interface
  const intentSerialized = await serializeMandate(validIntentMandate);
  const cartSerialized = await serializeMandate(validCartMandate);

  const intentDeserialized = await deserializeMandate(intentSerialized);
  const cartDeserialized = await deserializeMandate(cartSerialized);

  // Verify types are correctly identified
  assert('natural_language_description' in intentDeserialized, "Should be IntentMandate");
  assert(!('contents' in intentDeserialized), "Should not have contents");

  assert('contents' in cartDeserialized, "Should be CartMandate");
  assert(!('natural_language_description' in cartDeserialized), "Should not have natural_language_description");
});