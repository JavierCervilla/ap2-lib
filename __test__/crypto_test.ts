/**
 * Cryptographic Functions Test Suite (TDD)
 *
 * Tests written FIRST for ECDSA cryptographic functions.
 * These tests define the expected behavior before implementation.
 */

import { assert, assertEquals, assertRejects, assertNotEquals } from "@std/assert";
import type { IntentMandate, CartMandate } from "../src/mod.ts";
import {
  CryptographicError,
  SignatureVerificationError,
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/utils/mod.ts";

// Import functions that don't exist yet - will be implemented to pass these tests
import {
  generateKeyPair,
  signMandate,
  verifyMandateSignature,
  signData,
  verifySignature,
} from "../src/core/crypto.ts";

Deno.test("generateKeyPair - Creates valid ECDSA key pair", async () => {
  const keyPair = await generateKeyPair();

  assert(keyPair.privateKey, "Private key should be present");
  assert(keyPair.publicKey, "Public key should be present");

  // Keys should be different strings
  assertNotEquals(keyPair.privateKey, keyPair.publicKey);

  // Should be hex strings (basic format check)
  assert(/^[0-9a-fA-F]+$/.test(keyPair.privateKey), "Private key should be hex");
  assert(/^[0-9a-fA-F]+$/.test(keyPair.publicKey), "Public key should be hex");

  // Keys should have reasonable lengths (ECDSA secp256k1)
  assert(keyPair.privateKey.length >= 60, "Private key should be at least 60 chars");
  assert(keyPair.publicKey.length >= 120, "Public key should be at least 120 chars");
});

Deno.test("generateKeyPair - Each call produces unique keys", async () => {
  const keyPair1 = await generateKeyPair();
  const keyPair2 = await generateKeyPair();

  assertNotEquals(keyPair1.privateKey, keyPair2.privateKey);
  assertNotEquals(keyPair1.publicKey, keyPair2.publicKey);
});

Deno.test("signData - Signs data with private key", async () => {
  const keyPair = await generateKeyPair();
  const testData = "Hello, AP2 Protocol!";

  const signature = await signData(testData, keyPair.privateKey);

  assert(signature.r, "Signature r component should be present");
  assert(signature.s, "Signature s component should be present");
  assert(typeof signature.v === "number", "Signature v should be a number");

  // Signature components should be hex strings
  assert(/^[0-9a-fA-F]+$/.test(signature.r), "r should be hex");
  assert(/^[0-9a-fA-F]+$/.test(signature.s), "s should be hex");

  // v should be valid recovery id (0, 1, 2, or 3)
  assert(signature.v >= 0 && signature.v <= 3, "v should be 0-3");
});

Deno.test("signData - Same data produces different signatures (nonce)", async () => {
  const keyPair = await generateKeyPair();
  const testData = "Same data";

  const signature1 = await signData(testData, keyPair.privateKey);
  const signature2 = await signData(testData, keyPair.privateKey);

  // Due to random nonce, signatures should be different
  assert(signature1.r !== signature2.r || signature1.s !== signature2.s);
});

Deno.test("signData - Should reject invalid private key", async () => {
  await assertRejects(
    () => signData("test data", "invalid-key"),
    CryptographicError,
    "Invalid private key format"
  );
});

Deno.test("verifySignature - Verifies valid signature", async () => {
  const keyPair = await generateKeyPair();
  const testData = "Test message for verification";
  const signature = await signData(testData, keyPair.privateKey);

  const result = await verifySignature(testData, signature, keyPair.publicKey);

  assert(result.isValid, "Valid signature should verify successfully");
  assertEquals(result.publicKey, keyPair.publicKey);
  assertEquals(result.error, undefined);
});

Deno.test("verifySignature - Rejects invalid signature", async () => {
  const keyPair = await generateKeyPair();
  const testData = "Original message";
  const signature = await signData(testData, keyPair.privateKey);

  // Try to verify with different data
  const result = await verifySignature("Different message", signature, keyPair.publicKey);

  assert(!result.isValid, "Invalid signature should fail verification");
  assert(result.error, "Should provide error message");
  assertEquals(result.publicKey, undefined);
});

Deno.test("verifySignature - Rejects wrong public key", async () => {
  const keyPair1 = await generateKeyPair();
  const keyPair2 = await generateKeyPair();
  const testData = "Test message";
  const signature = await signData(testData, keyPair1.privateKey);

  // Try to verify with wrong public key
  const result = await verifySignature(testData, signature, keyPair2.publicKey);

  assert(!result.isValid, "Signature with wrong key should fail");
  assert(result.error, "Should provide error message");
});

Deno.test("verifySignature - Should reject malformed signature", async () => {
  const keyPair = await generateKeyPair();
  const malformedSignature = {
    r: "invalid-hex-string",
    s: "also-invalid",
    v: 99, // Invalid recovery id
  };

  await assertRejects(
    () => verifySignature("test", malformedSignature, keyPair.publicKey),
    CryptographicError,
    "Invalid signature format"
  );
});

Deno.test("signMandate - Signs IntentMandate", async () => {
  const keyPair = await generateKeyPair();
  const intentMandate: IntentMandate = {
    user_cart_confirmation_required: true,
    natural_language_description: "Test product for signing",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const signedMandate = await signMandate(intentMandate, keyPair.privateKey);

  assertEquals(signedMandate.natural_language_description, intentMandate.natural_language_description);
  assertEquals(signedMandate.intent_expiry, intentMandate.intent_expiry);
  assert(signedMandate.signature, "Signed mandate should have signature");

  // Signature should be hex string
  assert(/^[0-9a-fA-F]+$/.test(signedMandate.signature), "Signature should be hex");
});

Deno.test("signMandate - Signs CartMandate", async () => {
  const keyPair = await generateKeyPair();
  const cartMandate: CartMandate = {
    contents: {
      id: "cart_test_123",
      user_cart_confirmation_required: false,
      payment_request: {
        id: "payment-456",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "99.99" },
            refund_period: 30,
          },
        },
      },
      cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR * 2),
      merchant_name: "Test Merchant",
    },
  };

  const signedMandate = await signMandate(cartMandate, keyPair.privateKey);

  assertEquals(signedMandate.contents.id, cartMandate.contents.id);
  assert(signedMandate.merchant_authorization, "Cart mandate should have merchant authorization");

  // Authorization should be hex string
  assert(/^[0-9a-fA-F]+$/.test(signedMandate.merchant_authorization),
         "Authorization should be hex");
});

Deno.test("verifyMandateSignature - Verifies signed IntentMandate", async () => {
  const keyPair = await generateKeyPair();
  const intentMandate: IntentMandate = {
    user_cart_confirmation_required: false,
    natural_language_description: "Product for verification test",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.WEEK),
  };

  const signedMandate = await signMandate(intentMandate, keyPair.privateKey);
  const result = await verifyMandateSignature(signedMandate, keyPair.publicKey);

  assert(result.isValid, "Valid signed mandate should verify");
  assertEquals(result.error, undefined);
});

Deno.test("verifyMandateSignature - Verifies signed CartMandate", async () => {
  const keyPair = await generateKeyPair();
  const cartMandate: CartMandate = {
    contents: {
      id: "cart_verify_789",
      user_cart_confirmation_required: true,
      payment_request: {
        id: "payment-789",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "199.99" },
            refund_period: 14,
          },
        },
      },
      cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
      merchant_name: "Verification Store",
    },
  };

  const signedMandate = await signMandate(cartMandate, keyPair.privateKey);
  const result = await verifyMandateSignature(signedMandate, keyPair.publicKey);

  assert(result.isValid, "Valid signed cart mandate should verify");
  assertEquals(result.error, undefined);
});

Deno.test("verifyMandateSignature - Detects tampered mandate", async () => {
  const keyPair = await generateKeyPair();
  const intentMandate: IntentMandate = {
    natural_language_description: "Original description",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const signedMandate = await signMandate(intentMandate, keyPair.privateKey);

  // Tamper with the mandate after signing
  const tamperedMandate = {
    ...signedMandate,
    natural_language_description: "Tampered description", // Changed!
  };

  const result = await verifyMandateSignature(tamperedMandate, keyPair.publicKey);

  assert(!result.isValid, "Tampered mandate should fail verification");
  assert(result.error, "Should provide error describing tampering");
});

Deno.test("verifyMandateSignature - Rejects unsigned mandate", async () => {
  const keyPair = await generateKeyPair();
  const unsignedMandate: IntentMandate = {
    natural_language_description: "Unsigned mandate",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    // No signature field
  };

  await assertRejects(
    () => verifyMandateSignature(unsignedMandate, keyPair.publicKey),
    SignatureVerificationError,
    "Mandate is not signed"
  );
});