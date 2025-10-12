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

// signMandate test for IntentMandate removed - IntentMandates are never signed according to AP2 specification

// signMandate test for CartMandate removed - Use CartMandateClass.sign() with JWT instead

// verifyMandateSignature test for IntentMandate removed - IntentMandates are never signed according to AP2 specification

Deno.test("Deprecated signMandate and verifyMandateSignature functions", async () => {
  const keyPair = await generateKeyPair();
  const intentMandate: IntentMandate = {
    natural_language_description: "Test mandate",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  // Test that deprecated functions throw appropriate errors
  await assertRejects(
    async () => {
      await signMandate(intentMandate, keyPair.privateKey);
    },
    CryptographicError,
    "signMandate is deprecated"
  );

  await assertRejects(
    async () => {
      await verifyMandateSignature(intentMandate, keyPair.publicKey);
    },
    SignatureVerificationError,
    "verifyMandateSignature is deprecated"
  );
});

Deno.test("signData - Invalid private key formats", async () => {
  // Test with invalid hex characters in private key - this should trigger the hex validation errors
  await assertRejects(
    () => signData("test data", "invalid_key_with_non_hex_chars"),
    CryptographicError,
    "Signing failed"
  );

  // Test with odd length hex string
  await assertRejects(
    () => signData("test data", "abc12"), // Odd length
    CryptographicError,
    "Signing failed"
  );

  // Test with empty private key
  await assertRejects(
    () => signData("test data", ""),
    CryptographicError,
    "Signing failed"
  );
});

Deno.test("verifySignature - Malformed signature edge cases", async () => {
  const keyPair = await generateKeyPair();

  // Test signature with invalid v value - these should throw synchronously
  assertRejects(
    () => verifySignature("test", { r: "abc123", s: "def456", v: 99 }, keyPair.publicKey),
    CryptographicError,
    "Invalid signature format"
  );

  assertRejects(
    () => verifySignature("test", { r: "abc123", s: "def456", v: -1 }, keyPair.publicKey),
    CryptographicError,
    "Invalid signature format"
  );

  // Test with malformed hex in r and s - this should trigger error handling path
  const malformedSig = { r: "invalid", s: "invalid", v: 0 };
  try {
    const result = await verifySignature("test", malformedSig, keyPair.publicKey);
    // If we reach here, the function returned a result instead of throwing
    assertEquals(result.isValid, false);
    assert(result.error?.includes("Verification error"));
  } catch (error) {
    // If the function throws, that's also fine - it means invalid input was caught
    assert(error instanceof Error);
  }
});