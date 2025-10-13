/// <reference types="../src/types/deno.d.ts" />
/**
 * Mandate Factory Test Suite
 *
 * Tests for the clean class-based mandate creation API.
 * Validates OOP functionality, validation, and error handling.
 */

import { assert, assertEquals, assertRejects, assertExists } from "@std/assert";
import type { IntentMandate, CartMandate } from "../src/mod.ts";
import {
  IntentMandateClass,
  CartMandateClass,
  createIntentMandate,
  createCartMandate,
  createMandateFromData,
  MandateValidationError,
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/mod.ts";

Deno.test("createIntentMandate - Valid minimal mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const mandate = await createIntentMandate({
    natural_language_description: "High top, old school, red basketball shoes",
    intent_expiry: futureDate,
  });

  // Verify it returns a class instance
  assert(mandate instanceof IntentMandateClass);

  // Verify mandate data
  const data = mandate.getData();
  assertEquals(data.natural_language_description, "High top, old school, red basketball shoes");
  assertEquals(data.intent_expiry, futureDate);
  assertEquals(data.user_cart_confirmation_required, true); // Default value
  assertEquals(data.requires_refundability, false); // Default value
  assertEquals(data.merchants, undefined);
  assertEquals(data.skus, undefined);

  // Verify it has required class properties
  assertEquals(mandate.getStatus(), 'pending');
  assertEquals(mandate.isSigned(), false);
  assertExists(mandate.getId());
  assertExists(mandate.getCreatedAt());
});

Deno.test("createIntentMandate - Full mandate with all options", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.WEEK);
  const mandate = await createIntentMandate({
    user_cart_confirmation_required: false,
    natural_language_description: "Wireless noise-canceling headphones under $200",
    merchants: ["sony.com", "bose.com"],
    skus: ["SONY-WH-1000XM4", "BOSE-QC45"],
    requires_refundability: true,
    intent_expiry: futureDate,
  });

  // Verify data
  const data = mandate.getData();
  assertEquals(data.user_cart_confirmation_required, false);
  assertEquals(data.natural_language_description, "Wireless noise-canceling headphones under $200");
  assertEquals(data.merchants, ["sony.com", "bose.com"]);
  assertEquals(data.skus, ["SONY-WH-1000XM4", "BOSE-QC45"]);
  assertEquals(data.requires_refundability, true);
  assertEquals(data.intent_expiry, futureDate);
});

Deno.test("createIntentMandate - Should reject invalid expiry date", async () => {
  await assertRejects(
    async () => {
      await createIntentMandate({
        natural_language_description: "Test item",
        intent_expiry: "not-a-valid-date",
      });
    },
    MandateValidationError
  );
});

Deno.test("createIntentMandate - Should reject empty description", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  await assertRejects(
    async () => {
      await createIntentMandate({
        natural_language_description: "",
        intent_expiry: futureDate,
      });
    },
    MandateValidationError
  );
});

Deno.test("createIntentMandate - Should reject past expiry date", async () => {
  await assertRejects(
    async () => {
      await createIntentMandate({
        natural_language_description: "Test item",
        intent_expiry: "2020-01-01T00:00:00Z", // Past date
      });
    },
    MandateValidationError
  );
});

Deno.test("createCartMandate - Valid cart mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const mandate = await createCartMandate({
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
          amount: { currency: "USD", value: "49.99" },
          refund_period: 30,
        },
        displayItems: [{
          label: "Basketball Shoes",
          amount: { currency: "USD", value: "49.99" },
          refund_period: 30,
        }],
      },
      options: {},
    },
    cart_expiry: futureDate,
    merchant_name: "Nike Store",
  });

  // Verify it returns a class instance
  assert(mandate instanceof CartMandateClass);

  // Verify mandate data
  const data = mandate.getData();
  assertEquals(data.contents.id, "cart_123456");
  assertEquals(data.contents.user_cart_confirmation_required, true);
  assertEquals(data.contents.merchant_name, "Nike Store");
  assertEquals(data.contents.cart_expiry, futureDate);

  // Verify class properties
  assertEquals(mandate.getStatus(), 'pending');
  assertEquals(mandate.isSigned(), false);
  assertExists(mandate.getId());
});

Deno.test("createCartMandate - Should reject invalid cart expiry", async () => {
  await assertRejects(
    async () => {
      await createCartMandate({
        id: "cart_invalid",
        user_cart_confirmation_required: false,
        payment_request: {
          id: "payment-req-123",
          methodData: [{ supportedMethods: "basic-card" }],
          details: {
            total: {
              label: "Total",
              amount: { currency: "USD", value: "19.99" },
              refund_period: 30,
            },
          },
          options: {},
        },
        cart_expiry: "invalid-date",
        merchant_name: "Test Store",
      });
    },
    MandateValidationError
  );
});

Deno.test("createCartMandate - Should reject empty merchant name", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  await assertRejects(
    async () => {
      await createCartMandate({
        id: "cart_no_merchant",
        user_cart_confirmation_required: false,
        payment_request: {
          id: "payment-req-123",
          methodData: [{ supportedMethods: "basic-card" }],
          details: {
            total: {
              label: "Total",
              amount: { currency: "USD", value: "19.99" },
              refund_period: 30,
            },
          },
          options: {},
        },
        cart_expiry: futureDate,
        merchant_name: "", // Empty merchant name
      });
    },
    MandateValidationError
  );
});

Deno.test("createMandateFromData - IntentMandate data", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "Test intent from data",
    intent_expiry: futureDate,
    user_cart_confirmation_required: true,
    requires_refundability: false,
  };

  const mandate = await createMandateFromData(intentData);

  assert(mandate instanceof IntentMandateClass);
  assertEquals(mandate.getData().natural_language_description, "Test intent from data");
});

Deno.test("createMandateFromData - CartMandate data", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const cartData: CartMandate = {
    contents: {
      id: "cart_from_data",
      user_cart_confirmation_required: false,
      payment_request: {
        id: "payment-123",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "29.99" },
            refund_period: 30,
          },
        },
        options: {},
      },
      cart_expiry: futureDate,
      merchant_name: "Data Store",
    }
  };

  const mandate = await createMandateFromData(cartData);

  assert(mandate instanceof CartMandateClass);
  assertEquals(mandate.getData().contents.id, "cart_from_data");
});