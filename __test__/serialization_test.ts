 
/**
 * Serialization Functions Test Suite (TDD)
 *
 * Tests written FIRST for serialization functions.
 * These tests define the expected behavior before implementation.
 */

import { assert, assertEquals, assertRejects } from "@std/assert";
import type { IntentMandate, CartContents, CartMandate } from "../src/mod.ts";
import {
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/utils/mod.ts";

// Import serialization classes - using clean class-based API
import {
  IntentMandateSerializer,
  CartContentsSerializer,
  CartMandateSerializer,
  PaymentRequestSerializer,
  MandateSerializationStrategyRegistry,
} from "../src/mod.ts";
import { AP2PaymentRequest } from "../src/types/mod.ts";

// Test data fixtures
const validIntentMandate: IntentMandate = {
  user_cart_confirmation_required: true,
  natural_language_description: "High quality wireless headphones under $200",
  merchants: ["bestbuy.com", "amazon.com"],
  skus: ["SKU123", "SKU456"],
  requires_refundability: true,
  intent_expiry: createFutureISO8601(TIME_CONSTANTS.WEEK),
};

const validPaymentRequest: AP2PaymentRequest = {
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

Deno.test("IntentMandateSerializer.serialize - Serializes valid IntentMandate to JSON string", async () => {
  const serialized = await IntentMandateSerializer.serialize(validIntentMandate);

  assert(typeof serialized === "string", "Should return a string");

  // Should be valid JSON
  const parsed = JSON.parse(serialized);
  assert(typeof parsed === "object", "Should parse to an object");

  // Should contain all required fields
  assertEquals(parsed.natural_language_description, validIntentMandate.natural_language_description);
  assertEquals(parsed.intent_expiry, validIntentMandate.intent_expiry);
  assertEquals(parsed.user_cart_confirmation_required, validIntentMandate.user_cart_confirmation_required);
});

Deno.test("IntentMandateSerializer.deserialize - Deserializes valid JSON to IntentMandate", async () => {
  const serialized = await IntentMandateSerializer.serialize(validIntentMandate);
  const deserialized = await IntentMandateSerializer.deserialize(serialized);

  assertEquals(deserialized.natural_language_description, validIntentMandate.natural_language_description);
  assertEquals(deserialized.intent_expiry, validIntentMandate.intent_expiry);
  assertEquals(deserialized.merchants, validIntentMandate.merchants);
  assertEquals(deserialized.skus, validIntentMandate.skus);
  assertEquals(deserialized.requires_refundability, validIntentMandate.requires_refundability);
});

Deno.test("IntentMandateSerializer.deserialize - Throws on invalid JSON", async () => {
  await assertRejects(
    () => IntentMandateSerializer.deserialize("not valid json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("IntentMandateSerializer.deserialize - Throws on missing required fields", async () => {
  const invalidJson = JSON.stringify({
    // Missing natural_language_description
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  });

  await assertRejects(
    () => IntentMandateSerializer.deserialize(invalidJson),
    Error,
    "required"
  );
});

Deno.test("CartContentsSerializer.serialize - Serializes valid CartContents to JSON string", async () => {
  const serialized = await CartContentsSerializer.serialize(validCartContents);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.id, validCartContents.id);
  assertEquals(parsed.merchant_name, validCartContents.merchant_name);
  assertEquals(parsed.cart_expiry, validCartContents.cart_expiry);
});

Deno.test("CartContentsSerializer.deserialize - Deserializes valid JSON to CartContents", async () => {
  const serialized = await CartContentsSerializer.serialize(validCartContents);
  const deserialized = await CartContentsSerializer.deserialize(serialized);

  assertEquals(deserialized.id, validCartContents.id);
  assertEquals(deserialized.merchant_name, validCartContents.merchant_name);
  assertEquals(deserialized.cart_expiry, validCartContents.cart_expiry);
  assertEquals(deserialized.user_cart_confirmation_required, validCartContents.user_cart_confirmation_required);
});

Deno.test("CartMandateSerializer.serialize - Serializes valid CartMandate to JSON string", async () => {
  const serialized = await CartMandateSerializer.serialize(validCartMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assert(parsed.contents, "Should have contents field");
  assertEquals(parsed.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("deserializeCartMandate - Deserializes valid JSON to CartMandate", async () => {
  const serialized = await CartMandateSerializer.serialize(validCartMandate);
  const deserialized = await CartMandateSerializer.deserialize(serialized);

  assertEquals(deserialized.contents.id, validCartMandate.contents.id);
  assertEquals(deserialized.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("PaymentRequestSerializer.serialize - Serializes valid PaymentRequest to JSON string", async () => {
  const serialized = await PaymentRequestSerializer.serialize(validPaymentRequest);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.id, validPaymentRequest.id);
  assert(Array.isArray(parsed.methodData), "Should preserve methodData array");
  assertEquals(parsed.methodData.length, validPaymentRequest.methodData.length);
});

Deno.test("PaymentRequestSerializer.deserialize - Deserializes valid JSON to PaymentRequest", async () => {
  const serialized = await PaymentRequestSerializer.serialize(validPaymentRequest);
  const deserialized = await PaymentRequestSerializer.deserialize(serialized);

  assertEquals(deserialized.id, validPaymentRequest.id);
  assertEquals(deserialized.methodData.length, validPaymentRequest.methodData.length);
  assertEquals(deserialized.details.total.amount.currency, validPaymentRequest.details.total.amount.currency);
});

Deno.test("MandateSerializationStrategyRegistry.serialize - Handles IntentMandate", async () => {
  const serialized = await MandateSerializationStrategyRegistry.serialize(validIntentMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assertEquals(parsed.natural_language_description, validIntentMandate.natural_language_description);
});

Deno.test("MandateSerializationStrategyRegistry.serialize - Handles CartMandate", async () => {
  const serialized = await MandateSerializationStrategyRegistry.serialize(validCartMandate);

  assert(typeof serialized === "string", "Should return a string");

  const parsed = JSON.parse(serialized);
  assert(parsed.contents, "Should have contents field for CartMandate");
});

Deno.test("MandateSerializationStrategyRegistry.deserialize - Detects and deserializes IntentMandate", async () => {
  const serialized = await MandateSerializationStrategyRegistry.serialize(validIntentMandate);
  const deserialized = await MandateSerializationStrategyRegistry.deserialize(serialized);

  // Should be detected as IntentMandate
  assert('natural_language_description' in deserialized, "Should be IntentMandate");
  assertEquals((deserialized as IntentMandate).natural_language_description, validIntentMandate.natural_language_description);
});

Deno.test("MandateSerializationStrategyRegistry.deserialize - Detects and deserializes CartMandate", async () => {
  const serialized = await MandateSerializationStrategyRegistry.serialize(validCartMandate);
  const deserialized = await MandateSerializationStrategyRegistry.deserialize(serialized);

  // Should be detected as CartMandate
  assert('contents' in deserialized, "Should be CartMandate");
  assertEquals((deserialized as CartMandate).contents.id, validCartMandate.contents.id);
});

Deno.test("Serialization round-trip maintains data integrity", async () => {
  // Test IntentMandate round-trip
  const intentSerialized = await IntentMandateSerializer.serialize(validIntentMandate);
  const intentDeserialized = await IntentMandateSerializer.deserialize(intentSerialized);
  assertEquals(intentDeserialized, validIntentMandate);

  // Test CartMandate round-trip
  const cartSerialized = await CartMandateSerializer.serialize(validCartMandate);
  const cartDeserialized = await CartMandateSerializer.deserialize(cartSerialized);
  assertEquals(cartDeserialized.contents.id, validCartMandate.contents.id);
  assertEquals(cartDeserialized.merchant_authorization, validCartMandate.merchant_authorization);
});

Deno.test("Serialization handles optional fields correctly", async () => {
  const minimalIntent: IntentMandate = {
    natural_language_description: "Basic product",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const serialized = await IntentMandateSerializer.serialize(minimalIntent);
  const deserialized = await IntentMandateSerializer.deserialize(serialized);

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

  const serialized = await IntentMandateSerializer.serialize(intentWithArrays);
  const deserialized = await IntentMandateSerializer.deserialize(serialized);

  assert(Array.isArray(deserialized.merchants), "Merchants should be array");
  assert(Array.isArray(deserialized.skus), "SKUs should be array");
  assertEquals(deserialized.merchants?.length, 2);
  assertEquals(deserialized.skus?.length, 3);
});

Deno.test("MandateSerializationStrategyRegistry.deserialize - Throws on unknown mandate type", async () => {
  const unknownMandateJson = JSON.stringify({
    unknown_field: "value",
    other_field: "another value",
  });

  await assertRejects(
    () => MandateSerializationStrategyRegistry.deserialize(unknownMandateJson),
    Error,
    "Unknown mandate type"
  );
});

// Additional tests to improve coverage

Deno.test("IntentMandateSerializer - Missing intent_expiry error", async () => {
  const serializer = IntentMandateSerializer.create();

  const invalidJson = JSON.stringify({
    user_cart_confirmation_required: true,
    natural_language_description: "Test description"
    // Missing intent_expiry
  });

  await assertRejects(
    () => serializer.deserialize(invalidJson),
    Error,
    "Missing required field 'intent_expiry'"
  );
});

Deno.test("IntentMandateSerializer - checkBooleanFields method", async () => {
  const serializer = IntentMandateSerializer.create();

  // Test with undefined boolean field
  const jsonWithUndefinedField = JSON.stringify({
    user_cart_confirmation_required: true,
    natural_language_description: "Test description",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    requires_refundability: undefined
  });

  // This should not throw but should handle undefined properly
  const result = await serializer.deserialize(jsonWithUndefinedField);
  assertEquals(result.requires_refundability, undefined);
});

Deno.test("MandateSerializationStrategyRegistry.serialize/MandateSerializationStrategyRegistry.deserialize - Unknown mandate type errors", async () => {
  await assertRejects(
    () => MandateSerializationStrategyRegistry.serialize({unknown_type: "test"} as any),
    Error,
    "Unknown mandate type"
  );

  await assertRejects(
    () => MandateSerializationStrategyRegistry.deserialize(JSON.stringify({unknown_type: "test"})),
    Error,
    "Unknown mandate type"
  );
});

Deno.test("CartContentsSerializer.deserialize - Throws on missing id field", async () => {
  const invalidJson = JSON.stringify({
    // Missing id
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => CartContentsSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'id'"
  );
});

Deno.test("CartContentsSerializer.deserialize - Throws on missing merchant_name field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    // Missing merchant_name
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => CartContentsSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'merchant_name'"
  );
});

Deno.test("CartContentsSerializer.deserialize - Throws on missing cart_expiry field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    // Missing cart_expiry
    payment_request: validPaymentRequest,
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => CartContentsSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'cart_expiry'"
  );
});

Deno.test("CartContentsSerializer.deserialize - Throws on missing payment_request field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    // Missing payment_request
    user_cart_confirmation_required: true,
  });

  await assertRejects(
    () => CartContentsSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'payment_request'"
  );
});

Deno.test("CartContentsSerializer.deserialize - Throws on missing user_cart_confirmation_required field", async () => {
  const invalidJson = JSON.stringify({
    id: "cart_123",
    merchant_name: "Test Store",
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    payment_request: validPaymentRequest,
    // Missing user_cart_confirmation_required
  });

  await assertRejects(
    () => CartContentsSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'user_cart_confirmation_required'"
  );
});

Deno.test("deserializeCartMandate - Throws on invalid JSON", async () => {
  await assertRejects(
    () => CartMandateSerializer.deserialize("invalid json"),
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
    () => CartMandateSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'contents'"
  );
});

Deno.test("PaymentRequestSerializer.deserialize - Throws on invalid JSON", async () => {
  await assertRejects(
    () => PaymentRequestSerializer.deserialize("not json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("PaymentRequestSerializer.deserialize - Throws on missing methodData field", async () => {
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
    () => PaymentRequestSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'methodData'"
  );
});

Deno.test("PaymentRequestSerializer.deserialize - Throws on missing details field", async () => {
  const invalidJson = JSON.stringify({
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    // Missing details
  });

  await assertRejects(
    () => PaymentRequestSerializer.deserialize(invalidJson),
    Error,
    "Missing required field 'details'"
  );
});

Deno.test("MandateSerializationStrategyRegistry.serialize - Throws on unknown mandate type", async () => {
  const unknownMandate = {
    unknown_field: "value",
  } as any;

  await assertRejects(
    () => MandateSerializationStrategyRegistry.serialize(unknownMandate),
    Error,
    "Unknown mandate type"
  );
});

Deno.test("MandateSerializationStrategyRegistry.deserialize - Throws on invalid JSON", async () => {
  await assertRejects(
    () => MandateSerializationStrategyRegistry.deserialize("not valid json"),
    Error,
    "Invalid JSON"
  );
});

Deno.test("Serialization handles CartMandate without merchant_authorization", async () => {
  const cartMandateWithoutAuth: CartMandate = {
    contents: validCartContents,
    // merchant_authorization is optional
  };

  const serialized = await CartMandateSerializer.serialize(cartMandateWithoutAuth);
  const deserialized = await CartMandateSerializer.deserialize(serialized);

  assertEquals(deserialized.contents.id, cartMandateWithoutAuth.contents.id);
  assertEquals(deserialized.merchant_authorization, undefined);
});

Deno.test("Serialization preserves PaymentRequest with all optional fields", async () => {
  const minimalPaymentRequest: AP2PaymentRequest = {
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

  const serialized = await PaymentRequestSerializer.serialize(minimalPaymentRequest);
  const deserialized = await PaymentRequestSerializer.deserialize(serialized);

  assertEquals(deserialized.id, minimalPaymentRequest.id);
  assertEquals(deserialized.details.total.amount.currency, "EUR");
  assertEquals(deserialized.details.total.amount.value, "25.50");
  assertEquals(deserialized.options, undefined);
});

Deno.test("Serialization handles PaymentRequest with displayItems and total", async () => {
  const paymentRequestWithItems: AP2PaymentRequest = {
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

  const serialized = await PaymentRequestSerializer.serialize(paymentRequestWithItems);
  const deserialized = await PaymentRequestSerializer.deserialize(serialized);

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

  const serialized = await CartMandateSerializer.serialize(complexCartMandate);
  const deserialized = await CartMandateSerializer.deserialize(serialized);

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
  const intentSerialized = await MandateSerializationStrategyRegistry.serialize(validIntentMandate);
  const cartSerialized = await MandateSerializationStrategyRegistry.serialize(validCartMandate);

  const intentDeserialized = await MandateSerializationStrategyRegistry.deserialize(intentSerialized);
  const cartDeserialized = await MandateSerializationStrategyRegistry.deserialize(cartSerialized);

  // Verify types are correctly identified
  assert('natural_language_description' in intentDeserialized, "Should be IntentMandate");
  assert(!('contents' in intentDeserialized), "Should not have contents");

  assert('contents' in cartDeserialized, "Should be CartMandate");
  assert(!('natural_language_description' in cartDeserialized), "Should not have natural_language_description");
});