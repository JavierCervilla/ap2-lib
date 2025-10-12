/**
 * Mandate Classes Test Suite
 *
 * Tests for the new class-based mandate implementation.
 * Verifies OOP functionality, signing, verification, and toString methods.
 */

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import type { IntentMandate, CartContents, CartMandate } from "../src/mod.ts";
import {
  IntentMandateClass,
  CartMandateClass,
  createMandateClass,
  createIntentMandate,
  createCartMandate,
  createMandateFromData,
  type MandateStatus,
} from "../src/mod.ts";
import {
  generateKeyPair,
  MandateValidationError,
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/mod.ts";

Deno.test("IntentMandateClass - Create new mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "High top, old school, red basketball shoes",
    intent_expiry: futureDate,
    user_cart_confirmation_required: true,
    requires_refundability: false,
  };

  const mandate = await IntentMandateClass.createNew(intentData);

  assertEquals(mandate.getStatus(), 'pending');
  assertEquals(mandate.getData().natural_language_description, intentData.natural_language_description);
  assertEquals(mandate.getData().intent_expiry, intentData.intent_expiry);
  assertEquals(mandate.isSigned(), false);
  assertExists(mandate.getId());
  assertExists(mandate.getCreatedAt());
});

Deno.test("IntentMandateClass - Sign mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const keyPair = await generateKeyPair();
  const intentData: IntentMandate = {
    natural_language_description: "Wireless noise-canceling headphones",
    intent_expiry: futureDate,
  };

  const mandate = await IntentMandateClass.createNew(intentData);
  await mandate.sign(keyPair.privateKey);

  assertEquals(mandate.getStatus(), 'authorized');
  assertEquals(mandate.isSigned(), true);
  assertExists(mandate.getSignature());
});

Deno.test("IntentMandateClass - Verify signature", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const keyPair = await generateKeyPair();
  const intentData: IntentMandate = {
    natural_language_description: "Organic coffee beans, medium roast",
    intent_expiry: futureDate,
  };

  const mandate = await IntentMandateClass.createNew(intentData);
  await mandate.sign(keyPair.privateKey);

  const isValid = await mandate.verify(keyPair.publicKey);
  assertEquals(isValid, true);
});

Deno.test("IntentMandateClass - toString method", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "Gaming laptop with dedicated graphics",
    intent_expiry: futureDate,
    merchants: ["dell.com", "hp.com"],
    skus: ["DELL-G15", "HP-OMEN"],
    requires_refundability: true,
  };

  const mandate = await IntentMandateClass.createNew(intentData);
  const stringRep = mandate.toString();

  assert(stringRep.includes("Intent Mandate"));
  assert(stringRep.includes("Gaming laptop with dedicated graphics"));
  assert(stringRep.includes("dell.com, hp.com"));
  assert(stringRep.includes("DELL-G15, HP-OMEN"));
  assert(stringRep.includes("Requires Refundability: true"));
  assert(stringRep.includes("Signed: No"));
});

Deno.test("IntentMandateClass - toJSON method", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "Smart watch with fitness tracking",
    intent_expiry: futureDate,
  };

  const mandate = await IntentMandateClass.createNew(intentData);
  const jsonData = mandate.toJSON();

  assertExists(jsonData.id);
  assertExists(jsonData.createdAt);
  assertEquals(jsonData.status, 'pending');
  assertEquals(jsonData.data, intentData);
});

Deno.test("CartMandateClass - Create new mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const cartContents: CartContents = {
    id: "cart_test_123",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-test-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30
        },
        displayItems: [
          {
            label: "Test Product",
            amount: { currency: "USD", value: "99.99" },
            refund_period: 30
          }
        ]
      },
      options: {}
    },
    cart_expiry: futureDate,
    merchant_name: "Test Merchant",
  };

  const cartData: CartMandate = {
    contents: cartContents,
  };

  const mandate = await await CartMandateClass.createNew(cartData);

  assertEquals(mandate.getStatus(), 'pending');
  assertEquals(mandate.getData().contents.id, "cart_test_123");
  assertEquals(mandate.getData().contents.merchant_name, "Test Merchant");
  assertEquals(mandate.isSigned(), false);
  assertExists(mandate.getId());
});

Deno.test("CartMandateClass - Sign mandate", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const keyPair = await generateKeyPair();
  const cartContents: CartContents = {
    id: "cart_sign_test",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-sign-test",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "49.99" },
          refund_period: 30
        }
      },
      options: {}
    },
    cart_expiry: futureDate,
    merchant_name: "Sign Test Merchant",
  };

  const cartData: CartMandate = {
    contents: cartContents,
  };

  const mandate = await await CartMandateClass.createNew(cartData);
  await mandate.sign(keyPair.privateKey);

  assertEquals(mandate.getStatus(), 'authorized');
  assertEquals(mandate.isSigned(), true);
  assertExists(mandate.getSignature());
});

Deno.test("CartMandateClass - toString method", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const cartContents: CartContents = {
    id: "cart_tostring_test",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-tostring-test",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "EUR", value: "199.99" },
          refund_period: 30
        },
        displayItems: [
          {
            label: "Premium Headphones",
            amount: { currency: "EUR", value: "199.99" },
            refund_period: 30
          }
        ]
      },
      options: {}
    },
    cart_expiry: futureDate,
    merchant_name: "Audio Store",
  };

  const cartData: CartMandate = {
    contents: cartContents,
  };

  const mandate = await CartMandateClass.createNew(cartData);
  const stringRep = mandate.toString();

  assert(stringRep.includes("Cart Mandate"));
  assert(stringRep.includes("cart_tostring_test"));
  assert(stringRep.includes("Audio Store"));
  assert(stringRep.includes("199.99 EUR"));
  assert(stringRep.includes("Premium Headphones"));
  assert(stringRep.includes("Signed: No"));
});

Deno.test("createIntentMandate factory function with signing", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.WEEK);
  const keyPair = await generateKeyPair();

  const mandate = await createIntentMandate({
    natural_language_description: "Factory created intent mandate",
    intent_expiry: futureDate,
    requires_refundability: true,
  }, keyPair.privateKey);

  assertEquals(mandate.getStatus(), 'authorized');
  assertEquals(mandate.isSigned(), true);
  assertEquals(mandate.getData().natural_language_description, "Factory created intent mandate");
  assertEquals(mandate.getData().requires_refundability, true);
});

Deno.test("createCartMandate factory function with signing", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const keyPair = await generateKeyPair();

  const mandate = await createCartMandate({
    id: "factory_cart_123",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-factory-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "299.99" },
          refund_period: 30
        }
      },
      options: {}
    },
    cart_expiry: futureDate,
    merchant_name: "Factory Merchant",
  }, {}, keyPair.privateKey);

  assertEquals(mandate.getStatus(), 'authorized');
  assertEquals(mandate.isSigned(), true);
  assertEquals(mandate.getData().contents.id, "factory_cart_123");
  assertEquals(mandate.getData().contents.merchant_name, "Factory Merchant");
});

Deno.test("createMandateClass generic factory", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const keyPair = await generateKeyPair();

  // Test with IntentMandate
  const intentData: IntentMandate = {
    natural_language_description: "Generic factory intent test",
    intent_expiry: futureDate,
  };

  const intentMandate = await createMandateClass(intentData, { privateKey: keyPair.privateKey });
  assert(intentMandate instanceof IntentMandateClass);
  assertEquals(intentMandate.getData().natural_language_description, "Generic factory intent test");

  // Test with CartMandate
  const cartData: CartMandate = {
    contents: {
      id: "generic_cart_456",
      user_cart_confirmation_required: true,
      payment_request: {
        id: "payment-generic-456",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "123.45" },
            refund_period: 30
          }
        },
        options: {}
      },
      cart_expiry: futureDate,
      merchant_name: "Generic Merchant",
    }
  };

  const cartMandate = await createMandateClass(cartData, { privateKey: keyPair.privateKey });
  assert(cartMandate instanceof CartMandateClass);
  assertEquals(cartMandate.getData().contents.id, "generic_cart_456");
});

Deno.test("Mandate status management", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "Status test mandate",
    intent_expiry: futureDate,
  };

  const mandate = await IntentMandateClass.createNew(intentData);

  assertEquals(mandate.getStatus(), 'pending');

  mandate.setStatus('authorized');
  assertEquals(mandate.getStatus(), 'authorized');

  mandate.setStatus('captured');
  assertEquals(mandate.getStatus(), 'captured');

  mandate.setStatus('failed');
  assertEquals(mandate.getStatus(), 'failed');
});

Deno.test("Unique ID generation", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);
  const intentData: IntentMandate = {
    natural_language_description: "ID test mandate",
    intent_expiry: futureDate,
  };

  const mandate1 = await IntentMandateClass.createNew(intentData);

  // Small delay to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 1));

  const mandate2 = await IntentMandateClass.createNew(intentData);

  // IDs should be different even for identical data due to timestamps
  assert(mandate1.getId() !== mandate2.getId());
  assert(mandate1.getId().length > 0);
  assert(mandate2.getId().length > 0);
});

Deno.test("Error handling - Invalid mandate data", async () => {
  await assertRejects(
    async () => {
      const invalidData = {
        natural_language_description: "", // Empty description should fail
        intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
      } as IntentMandate;

      await IntentMandateClass.createNew(invalidData);
    },
    MandateValidationError
  );
});