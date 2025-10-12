/**
 * Mandate Factory Test Suite (TDD)
 *
 * Tests written FIRST for mandate creation functions.
 * These tests define the expected behavior before implementation.
 */

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import type { IntentMandate, CartContents, CartMandate } from "../src/mod.ts";
import {
  MandateValidationError,
  DateParseError,
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/utils/mod.ts";

// Import functions that don't exist yet - will be implemented to pass these tests
import {
  createIntentMandate,
  createCartContents,
  createCartMandate,
} from "../src/core/mandate-factory.ts";

Deno.test("createIntentMandate - Valid minimal mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY); // 24 hours from now
  const mandate = await createIntentMandate({
    natural_language_description: "High top, old school, red basketball shoes",
    intent_expiry: futureDate,
  });

  assertEquals(mandate.natural_language_description, "High top, old school, red basketball shoes");
  assertEquals(mandate.intent_expiry, futureDate);
  assertEquals(mandate.user_cart_confirmation_required, true); // Default value
  assertEquals(mandate.requires_refundability, false); // Default value
  assertEquals(mandate.merchants, undefined);
  assertEquals(mandate.skus, undefined);
});

Deno.test("createIntentMandate - Full mandate with all options", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.WEEK); // 1 week from now
  const mandate = await createIntentMandate({
    user_cart_confirmation_required: false,
    natural_language_description: "Wireless noise-canceling headphones under $200",
    merchants: ["sony.com", "bose.com"],
    skus: ["SONY-WH-1000XM4", "BOSE-QC45"],
    requires_refundability: true,
    intent_expiry: futureDate,
  });

  assertEquals(mandate.user_cart_confirmation_required, false);
  assertEquals(mandate.merchants?.length, 2);
  assertEquals(mandate.skus?.length, 2);
  assertEquals(mandate.requires_refundability, true);
  assertEquals(mandate.intent_expiry, futureDate);
});

Deno.test("createIntentMandate - Should reject invalid expiry date", async () => {
  await assertRejects(
    () => createIntentMandate({
      natural_language_description: "Test product",
      intent_expiry: "invalid-date",
    }),
    DateParseError,
    "Invalid ISO 8601 date format"
  );
});

Deno.test("createIntentMandate - Should reject empty description", async () => {
  await assertRejects(
    () => createIntentMandate({
      natural_language_description: "",
      intent_expiry: "2024-12-31T23:59:59Z",
    }),
    MandateValidationError,
    "Description cannot be empty"
  );
});

Deno.test("createIntentMandate - Should reject past expiry date", async () => {
  await assertRejects(
    () => createIntentMandate({
      natural_language_description: "Test product",
      intent_expiry: "2020-01-01T00:00:00Z", // Past date
    }),
    MandateValidationError,
    "Expiry date cannot be in the past"
  );
});

Deno.test("createCartContents - Valid cart contents", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.HOUR * 2); // 2 hours from now
  const cartContents = await createCartContents({
    id: "cart_123456",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-req-123",
      methodData: [{
        supportedMethods: "basic-card",
      }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "129.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: futureDate,
    merchant_name: "Nike Store",
  });

  assertEquals(cartContents.id, "cart_123456");
  assertEquals(cartContents.user_cart_confirmation_required, true);
  assertEquals(cartContents.merchant_name, "Nike Store");
  assertEquals(cartContents.payment_request.id, "payment-req-123");
  assertEquals(cartContents.cart_expiry, futureDate);
});

Deno.test("createCartContents - Should reject invalid cart expiry", async () => {
  await assertRejects(
    () => createCartContents({
      id: "cart_123",
      user_cart_confirmation_required: false,
      payment_request: {
        id: "payment-req-123",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "100.00" },
            refund_period: 30,
          },
        },
      },
      cart_expiry: "invalid-date",
      merchant_name: "Test Store",
    }),
    DateParseError
  );
});

Deno.test("createCartContents - Should reject empty merchant name", async () => {
  await assertRejects(
    () => createCartContents({
      id: "cart_123",
      user_cart_confirmation_required: false,
      payment_request: {
        id: "payment-req-123",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "100.00" },
            refund_period: 30,
          },
        },
      },
      cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
      merchant_name: "",
    }),
    MandateValidationError,
    "Merchant name cannot be empty"
  );
});

Deno.test("createCartMandate - Unsigned cart mandate", async () => {
  const cartContents: CartContents = {
    id: "cart_abc123",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY * 2),
    merchant_name: "Test Merchant",
  };

  const cartMandate = await createCartMandate({
    contents: cartContents,
  });

  assertEquals(cartMandate.contents, cartContents);
  assertEquals(cartMandate.merchant_authorization, undefined);
});

Deno.test("createCartMandate - Signed cart mandate", async () => {
  const cartContents: CartContents = {
    id: "cart_def456",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-456",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "199.99" },
          refund_period: 14,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY * 3),
    merchant_name: "Premium Store",
  };

  const signature = "3045022100abcdef123456789";

  const cartMandate = await createCartMandate({
    contents: cartContents,
    merchant_authorization: signature,
  });

  assertEquals(cartMandate.contents, cartContents);
  assertEquals(cartMandate.merchant_authorization, signature);
});

Deno.test("createCartMandate - Should validate cart contents", async () => {
  // This should fail because cart contents will be validated
  await assertRejects(
    () => createCartMandate({
      contents: {
        id: "",  // Invalid empty ID
        user_cart_confirmation_required: false,
        payment_request: {
          id: "payment-123",
          methodData: [{ supportedMethods: "basic-card" }],
          details: {
            total: {
              label: "Total",
              amount: { currency: "USD", value: "100.00" },
              refund_period: 30,
            },
          },
        },
        cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
        merchant_name: "Test Store",
      },
    }),
    MandateValidationError,
    "Cart ID cannot be empty"
  );
});