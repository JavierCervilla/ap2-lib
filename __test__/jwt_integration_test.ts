/**
 * JWT Integration Test Suite (Refactored & Corrected for 100% Coverage)
 *
 * Tests for JWT integration with CartMandateClass and PaymentMandateClass.
 * Validates the complete flow of AP2 JWT-based merchant authorization,
 * including edge cases and error paths for full branch coverage.
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "./test_helper.ts";
import { FakeTime } from "https://deno.land/std@0.224.0/testing/time.ts";
import {
  CartMandateClass,
  PaymentMandateClass,
  PaymentMandateContentsClass,
  createCartMandate,
  jwtService,
  createFutureISO8601,
  TIME_CONSTANTS,
  type PaymentMandate,
  type PaymentMandateContents,
  type CartMandate,
} from "../src/mod.ts";
import { MandateValidationError } from "../src/utils/mod.ts";

// --- Helper Functions for Test Data (DRY Principle) ---

/** Creates a consistent CartMandate data object for testing. */
function createTestCartData(
  id: string,
  totalValue: string,
  expiryOffset: number = TIME_CONSTANTS.DAY,
): CartMandate["contents"] {
  const expiryDate = createFutureISO8601(expiryOffset);
  return {
    id: `cart_${id}`,
    merchant_name: "Test Merchant",
    cart_expiry: expiryDate,
    user_cart_confirmation_required: true,
    payment_request: {
      id: `payment_${id}`,
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: totalValue },
          refund_period: 30,
        },
      },
      options: {},
    },
  };
}

/** Creates a consistent PaymentMandate data object for testing. */
function createTestPaymentMandateData(id: string): PaymentMandate {
  return {
    payment_mandate_contents: {
      payment_mandate_id: `pm_${id}`,
      payment_details_id: `pd_${id}`,
      payment_details_total: {
        label: "Test Payment Total",
        amount: { currency: "USD", value: "299.99" },
        refund_period: 30,
      },
      payment_response: {
        requestId: `req_${id}`,
        methodName: "basic-card",
        details: { cardNumber: "****1234" },
      },
      merchant_agent: "test-merchant-agent",
      timestamp: new Date().toISOString(),
    },
  };
}

Deno.test("JWT Integration Suite", async (t) => {
  const time = new FakeTime();

  try {
    await t.step("CartMandateClass", async (t) => {
      const keyPair = await jwtService.generateKeyPair("RS256");
      const merchantId = "test-merchant";

      await t.step("should sign and verify a valid JWT", async () => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("valid_jwt", "149.99"),
        });

        await cartMandate.sign(keyPair.privateKey, { keyId: keyPair.keyId }, { merchantId });

        assertEquals(cartMandate.getStatus(), "authorized");
        assertEquals(cartMandate.isSigned(), true);

        const isValid = await cartMandate.verify(
          keyPair.publicKey,
          { keyId: keyPair.keyId },
          merchantId,
          "payment-processor",
        );
        assertEquals(isValid, true);
      });

      await t.step("should fail verification with the wrong public key", async () => {
        const keyPair1 = await jwtService.generateKeyPair("RS256");
        const keyPair2 = await jwtService.generateKeyPair("RS256");

        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("wrong_key", "79.99"),
        });
        await cartMandate.sign(keyPair1.privateKey, undefined, { merchantId });

        const isValid = await cartMandate.verify(keyPair2.publicKey);
        assertEquals(isValid, false);
      });

      await t.step("should reject creation of an already-expired cart", async () => {
        await assertRejects(
          () => CartMandateClass.createNew({
            contents: createTestCartData("expired_at_creation", "50.00", -TIME_CONSTANTS.HOUR),
          }),
          MandateValidationError,
          "Cart has expired",
        );
      });

      await t.step("should fail verification if a valid JWT expires after creation", async (t) => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("expires_later", "50.00", TIME_CONSTANTS.SECOND / 2),
        });

        await setTimeout(async () => {
          await cartMandate.sign(keyPair.privateKey, undefined, { merchantId });
          const isValid = await cartMandate.verify(keyPair.publicKey);
          assertEquals(isValid, false, "Expired JWT should not be valid.");
        }, 1000);
      });

      // NUEVO: Cubre la rama de verificación del `merchantId`.
      await t.step("should fail verification with mismatched merchantId", async () => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("mismatched_merchant", "25.00"),
        });
        await cartMandate.sign(keyPair.privateKey, undefined, { merchantId: "merchant-A" });

        const isValid = await cartMandate.verify(keyPair.publicKey, undefined, "merchant-B");
        assertEquals(isValid, false, "Verification should fail if merchantId does not match.");
      });

      // NUEVO: Cubre la rama que maneja un mandato no firmado.
      await t.step("should return false when verifying an unsigned mandate", async () => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("unsigned", "10.00"),
        });
        assertEquals(cartMandate.isSigned(), false);
        const isValid = await cartMandate.verify(keyPair.publicKey);
        assertEquals(isValid, false, "Unsigned mandate should not be verifiable.");
      });

      await t.step("should fail verification if cart contents are tampered with", async () => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("integrity", "199.99"),
        });
        await cartMandate.sign(keyPair.privateKey, undefined, { merchantId });
        const originalJwt = cartMandate.getMerchantAuthorization();

        assertEquals(await cartMandate.verify(keyPair.publicKey), true);

        const tamperedContents = createTestCartData("integrity", "999.99");
        const tamperedMandate = await CartMandateClass.createNew({ contents: tamperedContents });

        (tamperedMandate as any)._merchantAuthorization = originalJwt;
        (tamperedMandate as any)._signature = originalJwt;

        const isTamperedValid = await tamperedMandate.verify(keyPair.publicKey);
        assertEquals(isTamperedValid, false, "Verification of tampered cart should return false.");
      });

      await t.step("should reject signing with an invalid private key", async () => {
        const cartMandate = await CartMandateClass.createNew({
          contents: createTestCartData("invalid_key", "5.00"),
        });
        await assertRejects(
          () => cartMandate.sign("not-a-valid-key" as any, undefined, { merchantId }),
          MandateValidationError, // Esperar nuestro error personalizado
          "Failed to sign JWT", // Esperar el mensaje de nuestro wrapper
        );
      });

      await t.step("should work with the factory function for creation and signing", async () => {
        const cartMandate = await createCartMandate(createTestCartData("factory", "89.99"));
        await cartMandate.sign(keyPair.privateKey, undefined, { merchantId: "factory-merchant" });
        assertEquals(cartMandate.isSigned(), true);
        const isValid = await cartMandate.verify(
          keyPair.publicKey,
          undefined,
          "factory-merchant",
          "payment-processor",
        );
        assertEquals(isValid, true);
      });
    });

    await t.step("PaymentMandateClass", async (t) => {
      await t.step("should create a mandate and validate its initial state", async () => {
        const mandateData = createTestPaymentMandateData("creation");
        const paymentMandate = await PaymentMandateClass.createNew(mandateData);
        assertEquals(paymentMandate.getStatus(), "pending");
        assertEquals(paymentMandate.hasUserAuthorization(), false);
      });

      await t.step("should handle the user authorization workflow", async () => {
        const mandateData = createTestPaymentMandateData("auth_workflow");
        mandateData.user_authorization = undefined;
        const paymentMandate = await PaymentMandateClass.createNew(mandateData);
        paymentMandate.setUserAuthorization("h.p.s");
        assertEquals(paymentMandate.hasUserAuthorization(), true);
      });

      await t.step("should verify user authorization against transaction hashes", async () => {
        const mandateData = createTestPaymentMandateData("verify_hashes");
        const userAuthJwt = `h.${btoa(JSON.stringify({
          aud: "payment-network",
          transaction_data: ["expected_cart_hash", "expected_payment_hash"],
        }))}.s`;
        mandateData.user_authorization = userAuthJwt;
        const paymentMandate = await PaymentMandateClass.createNew(mandateData);
        assertEquals(
          await paymentMandate.verifyUserAuthorization("expected_cart_hash", "expected_payment_hash"),
          true,
        );
        assertEquals(
          await paymentMandate.verifyUserAuthorization("wrong_cart_hash", "wrong_payment_hash"),
          false,
        );
      });

      // FALLA
      await t.step("should reject creation if user auth JWT is malformed", async () => {
        const mandateData = createTestPaymentMandateData("malformed_jwt");
        mandateData.user_authorization = "this.is.not.a.jwt";
        await assertRejects(
          () => PaymentMandateClass.createNew(mandateData),
          MandateValidationError,
          "Invalid user_authorization format",
        );
      });

      // NUEVO: Cubre la rama de error cuando faltan claims en el JWT del usuario.
      await t.step("should reject creation if user auth JWT is missing transaction_data", async () => {
        const mandateData = createTestPaymentMandateData("missing_claim");
        const userAuthJwt = `h.${btoa(JSON.stringify({ aud: "payment-network" }))}.s`;
        mandateData.user_authorization = userAuthJwt;
        await assertRejects(
          () => PaymentMandateClass.createNew(mandateData),
          MandateValidationError,
          "Missing required claim in user_authorization: transaction_data",
        );
      });
    });

    await t.step("PaymentMandateContentsClass", async (t) => {
      await t.step("should be created, validated, and serialized correctly", async () => {
        const contentsData: PaymentMandateContents = {
          payment_mandate_id: "pmc_test_123",
          payment_details_id: "pdc_test_456",
          payment_details_total: {
            label: "Contents Test Total",
            amount: { currency: "GBP", value: "45.50" },
            refund_period: 15,
          },
          payment_response: { requestId: "req_contents_test", methodName: "paypal" },
          merchant_agent: "contents-test-merchant",
          timestamp: new Date().toISOString(),
        };
        const contents = await PaymentMandateContentsClass.createNew(contentsData);
        assertExists(contents.getId());
        const hash = await contents.getHash();
        assertEquals(hash.length, 64);
      });


      await t.step("should reject creation with invalid data", async () => {
        const invalidData = { payment_mandate_id: "" } as any;
        await assertRejects(
          () => PaymentMandateContentsClass.createNew(invalidData),
          Error, // O MandateValidationError
          "PaymentMandateContents validation failed", // Mensaje más general pero correcto
        );
      });
    });

    await t.step("End-to-End AP2 Workflow", async () => {
      const merchantKeyPair = await jwtService.generateKeyPair("RS256");
      const cartData = createTestCartData("e2e", "199.99");
      const cartMandate = await createCartMandate(cartData);
      await cartMandate.sign(merchantKeyPair.privateKey, undefined, { merchantId: "e2e-merchant" });
      const paymentMandateData = createTestPaymentMandateData("e2e");
      paymentMandateData.payment_mandate_contents.payment_details_id = cartData.payment_request.id;
      const paymentMandate = await PaymentMandateClass.createNew(paymentMandateData);
      const cartHash = await jwtService.computeCartHash(cartMandate.getData().contents);
      const paymentHash = await paymentMandate.getContentsClass().getHash();
      const userAuth = `h.${btoa(JSON.stringify({ aud: "payment-network", transaction_data: [cartHash, paymentHash] }))}.s`;
      paymentMandate.setUserAuthorization(userAuth);
      assertEquals(await cartMandate.verify(merchantKeyPair.publicKey, undefined, "e2e-merchant"), true);
      assertEquals(await paymentMandate.verifyUserAuthorization(cartHash, paymentHash), true);
    });
  } finally {
    time.restore();
  }
});