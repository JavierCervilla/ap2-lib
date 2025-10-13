/**
 * Mandate Classes Test Suite (Refactored for 100% Coverage)
 *
 * Verifies OOP functionality, validation, signing, and serialization
 * for all Mandate classes, including all edge cases and error paths.
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
} from "./test_helper.ts";
import {
  IntentMandateClass,
  CartMandateClass,
  PaymentMandateClass,
  MandateValidationError,
  createFutureISO8601,
  TIME_CONSTANTS,
  jwtService,
} from "../src/mod.ts";
import type { IntentMandate, CartContents, PaymentMandate, CartMandate } from "../src/mod.ts";

// --- Helper Functions for Test Data (DRY Principle) ---

function createTestIntentData(overrides: Partial<IntentMandate> = {}): IntentMandate {
  return {
    natural_language_description: "Test Intent",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    user_cart_confirmation_required: true,
    requires_refundability: false,
    ...overrides,
  };
}

function createTestCartContents(overrides: Partial<CartContents> = {}): CartContents {
  return {
    id: "cart_test_123",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-test-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    merchant_name: "Test Merchant",
    ...overrides,
  };
}

function createTestPaymentData(overrides: Partial<PaymentMandate> = {}): PaymentMandate {
  return {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test Total",
        amount: { currency: "USD", value: "123.45" },
        refund_period: 30,
      },
      payment_response: { requestId: "req_123", methodName: "basic-card", details: {} },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString(),
    },
    ...overrides,
  };
}

Deno.test("Mandate Classes Suite", async (t) => {
  await t.step("IntentMandateClass", async (t) => {
    await t.step("should create with default and custom options", async () => {
      const defaultMandate = await IntentMandateClass.createNew(createTestIntentData());
      assertEquals(defaultMandate.getStatus(), "pending");
      assertExists(defaultMandate.getId());

      const customDate = new Date(2023, 0, 1);
      const customMandate = await IntentMandateClass.createNew(createTestIntentData(), {
        id: "custom-id",
        status: "authorized",
        createdAt: customDate,
      });
      assertEquals(customMandate.getId(), "custom-id");
      assertEquals(customMandate.getStatus(), "authorized");
      assertEquals(customMandate.getCreatedAt(), customDate);
    });

    await t.step("should reject creation with invalid data", async () => {
      await assertRejects(
        () =>
          IntentMandateClass.createNew(
            createTestIntentData({ natural_language_description: "" }),
          ),
        MandateValidationError,
      );
      await assertRejects(
        () =>
          IntentMandateClass.createNew(
            createTestIntentData({ intent_expiry: new Date(0).toISOString() }),
          ),
        MandateValidationError,
      );
    });

    await t.step("should create from existing data using fromData", async () => {
      const data = createTestIntentData();
      const mandate = await IntentMandateClass.fromData(data);
      assert(mandate instanceof IntentMandateClass);
      assertEquals(mandate.getData(), data);
    });

    await t.step("should serialize correctly with toJSON", async () => {
      const mandate = await IntentMandateClass.createNew(createTestIntentData());
      const jsonData = mandate.toJSON();
      assertEquals(jsonData.status, "pending");
      assertEquals(jsonData.id, mandate.getId());
    });

    await t.step("should generate a descriptive string with toString", async () => {
      const mandateData = createTestIntentData({
        merchants: ["store-a.com", "store-b.com"],
        skus: ["SKU123", "SKU456"],
        requires_refundability: true,
        user_cart_confirmation_required: false,
      });
      const mandate = await IntentMandateClass.createNew(mandateData);
      const str = mandate.toString();

      assertStringIncludes(str, "Intent Mandate");
      assertStringIncludes(str, `ID: ${mandate.getId()}`);
      assertStringIncludes(str, "Status: pending");
      assertStringIncludes(str, "Description: Test Intent");
      assertStringIncludes(str, "User Confirmation Required: false");
      assertStringIncludes(str, "Requires Refundability: true");
      assertStringIncludes(str, "Allowed Merchants: store-a.com, store-b.com");
      assertStringIncludes(str, "Allowed SKUs: SKU123, SKU456");
      assertStringIncludes(str, "Signed: No");
    });

    await t.step("should handle missing merchants and skus gracefully in toString", async () => {
      const mandateData = createTestIntentData({
        merchants: [],
        skus: [],
      });
      const mandate = await IntentMandateClass.createNew(mandateData);
      const str = mandate.toString();

      assert(!str.includes("Allowed Merchants:"), "Should not include merchants line when empty");
      assert(!str.includes("Allowed SKUs:"), "Should not include SKUs line when empty");
    });

    await t.step("should handle missing merchants and skus in toString", async () => {
      const mandateData = createTestIntentData({
        merchants: undefined,
        skus: undefined,
        requires_refundability: false,
        user_cart_confirmation_required: true,
      });

      const mandate = await IntentMandateClass.createNew(mandateData);
      const result = mandate.toString();

      assert(result.includes("Intent Mandate (ID:"), "Missing main header");
      assert(!result.includes("Allowed Merchants:"), "Should not show merchants when empty");
      assert(!result.includes("Allowed SKUs:"), "Should not show skus when empty");
    });

    await t.step("should handle merchants present but skus empty in toString", async () => {
      const mandateData = createTestIntentData({
        merchants: ["shop.example.com"],
        skus: [], // fuerza la rama falsa restante
        requires_refundability: true,
        user_cart_confirmation_required: false,
      });

      const mandate = await IntentMandateClass.createNew(mandateData);
      const text = mandate.toString();

      assert(text.includes("Allowed Merchants: shop.example.com"), "Merchants branch not covered");
      assert(!text.includes("Allowed SKUs:"), "SKUs branch (false) not covered");
    });

    await t.step("should handle defined but empty merchants and skus arrays", async () => {
      const mandateData = createTestIntentData({
        merchants: [], // definido pero vacío
        skus: [],      // definido pero vacío
        requires_refundability: undefined,
        user_cart_confirmation_required: undefined,
      });

      const mandate = await IntentMandateClass.createNew(mandateData);
      const output = mandate.toString();

      // Debe generar sin errores
      assert(output.includes("Intent Mandate (ID:"), "Main header missing");

      // Debe NO incluir merchants ni SKUs porque están vacíos
      assert(!output.includes("Allowed Merchants:"), "Should not show merchants line when empty array");
      assert(!output.includes("Allowed SKUs:"), "Should not show SKUs line when empty array");
    });
  });

  await t.step("CartMandateClass", async (t) => {
    const keyPair = await jwtService.generateKeyPair("RS256");

    await t.step("should create, sign, and verify a mandate", async () => {
      const mandate = await CartMandateClass.createNew({ contents: createTestCartContents() });
      assertEquals(mandate.isSigned(), false);

      await mandate.sign(keyPair.privateKey, {}, { merchantId: "test-merchant" });
      assertEquals(mandate.isSigned(), true);
      assertEquals(mandate.getStatus(), "authorized");
      assertExists(mandate.getMerchantAuthorization());
      assertExists(mandate.getSignature());

      const isValid = await mandate.verify(keyPair.publicKey, {}, "test-merchant");
      assertEquals(isValid, true);
    });

    await t.step("should fail verification with wrong key or data", async () => {
      const mandate = await CartMandateClass.createNew({ contents: createTestCartContents() });
      await mandate.sign(keyPair.privateKey, {}, { merchantId: "merchant-A" });

      const wrongKeyPair = await jwtService.generateKeyPair("RS256");
      assertEquals(await mandate.verify(wrongKeyPair.publicKey, {}, "merchant-A"), false);
      assertEquals(await mandate.verify(keyPair.publicKey, {}, "merchant-B"), false);
    });

    await t.step("should throw MandateValidationError if sign() fails", async () => {
const mandate = await CartMandateClass.createNew({ contents: createTestCartContents() });

      // Forzamos error en jwtService.signMerchantAuthorization
      const originalSign = jwtService.signMerchantAuthorization;
      //@ts-ignore ignore this error for testing
      jwtService.signMerchantAuthorization = async () => {
        try {
          await Promise.reject(new Error("Simulated signing failure"));
        } catch (e) {
          throw e;
        }
      };

      await assertRejects(
        () => mandate.sign("fakeKey", {}, { merchantId: "123" }),
        MandateValidationError,
        "Failed to sign CartMandate"
      );

      jwtService.signMerchantAuthorization = originalSign;
    });

    await t.step("should reject signing if already signed", async () => {
      const mandate = await CartMandateClass.createNew({ contents: createTestCartContents() });
      await mandate.sign(keyPair.privateKey, {}, { merchantId: "test-merchant" });
      await assertRejects(
        () => mandate.sign(keyPair.privateKey, {}, { merchantId: "test-merchant" }),
        MandateValidationError,
        "Mandate is already signed.",
      );
    });

    await t.step("should create from a signed mandate using fromSigned", async () => {
      const originalMandate = await CartMandateClass.createNew(
        { contents: createTestCartContents() },
        {},
        {
          privateKey: keyPair.privateKey,
          algorithm: "RS256",
          merchantId: "test-merchant",
        },
      );

      const signedData: CartMandate & { merchant_authorization?: string } = {
        ...originalMandate.getData(),
        merchant_authorization: originalMandate.getMerchantAuthorization(),
      };

      const mandate = await CartMandateClass.fromSigned(
        signedData,
        keyPair.publicKey,
        true,
        {},
        "test-merchant",
      );
      assert(mandate instanceof CartMandateClass);
      assertEquals(mandate.isSigned(), true);

      const mandateNoValidation = await CartMandateClass.fromSigned(
        signedData,
        undefined,
        false,
      );
      assertEquals(mandateNoValidation.isSigned(), true);

      const wrongKeyPair = await jwtService.generateKeyPair("RS256");
      await assertRejects(
        () =>
          CartMandateClass.fromSigned(
            signedData,
            wrongKeyPair.publicKey,
            true,
            {},
            "test-merchant",
          ),
        MandateValidationError,
        "Invalid JWT signature",
      );
    });

    await t.step("should serialize correctly with toJSON", async () => {
      const mandate = await CartMandateClass.createNew({ contents: createTestCartContents() });
      await mandate.sign(keyPair.privateKey, {}, { merchantId: "test-merchant" });
      const json = mandate.toJSON();
      assertEquals(json.status, "authorized");
      assertExists(json.signature);
      assertEquals(json.signature, mandate.getSignature());
    });

    await t.step("should correctly return string representation of cart mandate", async () => {
      const cartData = createTestCartContents(); // usa tu helper o crea un objeto literal válido
      const mandate = await CartMandateClass.createNew({ contents: cartData });

      const str = mandate.toString();

      // Validamos que incluya fragmentos importantes
      assertStringIncludes(str, "Cart Mandate (ID:");
      assertStringIncludes(str, `Merchant: ${cartData.merchant_name}`);
      assertStringIncludes(str, `Signed: No`);
    });
  });

  await t.step("PaymentMandateClass", async (t) => {
    await t.step("should create a new mandate with valid data", async () => {
      const mandate = await PaymentMandateClass.createNew(createTestPaymentData());
      assertEquals(mandate.getStatus(), "pending");
      assertEquals(mandate.hasUserAuthorization(), false);
    });

    await t.step("should generate a descriptive string with toString", async () => {
      const mandate = await PaymentMandateClass.createNew(createTestPaymentData());
      const str = mandate.toString();
      assertStringIncludes(str, "Payment Mandate");
      assertStringIncludes(str, "Has User Authorization: No");

      mandate.setUserAuthorization("user.jwt.signature");
      assertStringIncludes(mandate.toString(), "Has User Authorization: Yes");
    });

    await t.step("should create from existing data using fromExisting", async (t) => {
      const userAuthJwt = `h.${btoa(JSON.stringify({ aud: "test-aud", transaction_data: ["hash1", "hash2"] }))}.s`;
      const existingData = createTestPaymentData({ user_authorization: userAuthJwt });

      await t.step("should create without validation", async () => {
        const mandate = await PaymentMandateClass.fromExisting(existingData);
        assert(mandate instanceof PaymentMandateClass);
        assertEquals(mandate.getStatus(), "authorized");
      });

      await t.step("should create with successful validation", async () => {
        const mandate = await PaymentMandateClass.fromExisting(existingData, {
          validateUserAuth: true,
          expectedCartMandateHash: "hash1",
          expectedPaymentMandateHash: "hash2",
        });
        assert(mandate instanceof PaymentMandateClass);
      });

      await t.step("should reject if validation fails", async () => {
        await assertRejects(
          () =>
            PaymentMandateClass.fromExisting(existingData, {
              validateUserAuth: true,
              expectedCartMandateHash: "wrong_hash",
              expectedPaymentMandateHash: "hash2",
            }),
          MandateValidationError,
          "Invalid user authorization",
        );
      });
    });

    await t.step("should reject creation with invalid data", async () => {
      const invalidData = createTestPaymentData();
      delete (invalidData.payment_mandate_contents as any).merchant_agent;
      await assertRejects(() => PaymentMandateClass.createNew(invalidData), MandateValidationError);
    });

    await t.step("should set user authorization and update status", async () => {
      const mandate = await PaymentMandateClass.createNew(createTestPaymentData());
      mandate.setUserAuthorization("user.jwt.signature");
      assertEquals(mandate.hasUserAuthorization(), true);
      assertEquals(mandate.getStatus(), "authorized");
    });

    await t.step("should correctly verify user authorization hashes", async () => {
      const mandate = await PaymentMandateClass.createNew(createTestPaymentData());
      const userAuthJwt = `h.${btoa(JSON.stringify({ transaction_data: ["hash1", "hash2"] }))}.s`;
      mandate.setUserAuthorization(userAuthJwt);
      assertEquals(await mandate.verifyUserAuthorization("hash1", "hash2"), true);
      assertEquals(await mandate.verifyUserAuthorization("wrong_hash", "hash2"), false);
    });

    await t.step("should fail verification if user auth JWT is malformed or missing claims", async () => {
      const mandate = await PaymentMandateClass.createNew(createTestPaymentData());
      mandate.setUserAuthorization("not-a-jwt");
      assertEquals(await mandate.verifyUserAuthorization("h1", "h2"), false);
    });
  });
});
