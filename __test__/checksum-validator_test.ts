/**
 * Checksum Validator Test Suite
 *
 * Comprehensive tests for multi-level checksum validation.
 */

import { assert, assertEquals, assertExists, assertFalse, assertNotEquals, assertRejects, assertThrows } from "@std/assert";
import {
  ChecksumValidator,
  defaultChecksumValidator,
  jwtService,
  type MerchantAuthorizationPayload
} from "../src/mod.ts";

// Helper function to create test cart contents
function createTestCartContents() {
  return {
    id: "checksum_test_cart",
    merchant_name: "Checksum Test Store",
    cart_expiry: new Date(Date.now() + 900000).toISOString(),
    user_cart_confirmation_required: true,
    payment_request: {
      id: "checksum_test_payment",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Test Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30
        }
      },
      options: {}
    }
  };
}

// Helper function to create test JWT
async function createTestJWT() {
  const keyPair = await jwtService.generateKeyPair('RS256');
  const cartContents = createTestCartContents();
  // Asumimos que jwtService.computeCartHash y validator.computeRobustCartHash son ahora idénticos
  const cartHash = await jwtService.computeCartHash(cartContents);

  const payload = {
    iss: "test-merchant",
    sub: "test-merchant",
    aud: "payment-processor",
    cart_hash: cartHash
  };

  const jwt = await jwtService.signMerchantAuthorization(payload, {
    keyConfig: keyPair,
    expiresIn: 900
  });

  return { jwt, cartContents, keyPair };
}

Deno.test("ChecksumValidator - Robust cart hash computation", async () => {
  const validator = new ChecksumValidator();
  const cartContents = createTestCartContents();

  const hash1 = await validator.computeRobustCartHash(cartContents);
  const hash2 = await validator.computeRobustCartHash(cartContents);

  // Should be deterministic
  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64); // SHA-256 hex string
  assert(/^[0-9a-f]{64}$/i.test(hash1), "Should be valid hex string");
});

Deno.test("ChecksumValidator - Cart hash with different field order", async () => {
  const validator = new ChecksumValidator();

  const cart1 = { a: 1, b: 2, c: 3 };
  const cart2 = { c: 3, a: 1, b: 2 };

  const hash1 = await validator.computeRobustCartHash(cart1);
  const hash2 = await validator.computeRobustCartHash(cart2);

  // Should be identical regardless of field order (canonical ordering)
  assertEquals(hash1, hash2);
});

Deno.test("ChecksumValidator - Cart hash with undefined values", async () => {
  const validator = new ChecksumValidator();

  const cart1 = { a: 1, b: undefined, c: 3 };
  const cart2 = { a: 1, c: 3 };

  const hash1 = await validator.computeRobustCartHash(cart1);
  const hash2 = await validator.computeRobustCartHash(cart2);

  // Should be identical after removing undefined values
  assertEquals(hash1, hash2);
});

Deno.test("ChecksumValidator - Cart hash with whitespace normalization", async () => {
  const validator = new ChecksumValidator();

  const cart1 = { message: "Hello   World\n\t" };
  const cart2 = { message: "Hello World" };

  const hash1 = await validator.computeRobustCartHash(cart1);
  const hash2 = await validator.computeRobustCartHash(cart2);

  // Should be identical after whitespace normalization
  assertEquals(hash1, hash2);
});

Deno.test("ChecksumValidator - Validate payload structure - valid payload", async () => {
  const validator = new ChecksumValidator();
  const now = Math.floor(Date.now() / 1000);

  const validPayload: MerchantAuthorizationPayload = {
    iss: "test-merchant",
    sub: "test-merchant",
    aud: "payment-processor",
    iat: now,
    exp: now + 900,
    jti: "a1b2c3d4e5f67890abcdef1234567890",
    cart_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  };

  const result = await validator.validatePayloadStructure(validPayload);
  assertEquals(result, true);
});

Deno.test("ChecksumValidator - Validate payload structure - missing fields", async () => {
  const validator = new ChecksumValidator();
  const now = Math.floor(Date.now() / 1000);

  const invalidPayload = {
    iss: "test-merchant",
    exp: now + 900
  } as any;

  const result = await validator.validatePayloadStructure(invalidPayload);
  assertEquals(result, false);
});

Deno.test("ChecksumValidator - Validate payload structure - invalid field types", async () => {
  const validator = new ChecksumValidator();
  const now = Math.floor(Date.now() / 1000);

  const invalidPayload = {
    iss: 123,
    sub: "test-merchant",
    aud: "payment-processor",
    iat: "invalid",
    exp: now + 900,
    jti: "a1b2c3d4e5f67890abcdef1234567890",
    cart_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  } as any;

  const result = await validator.validatePayloadStructure(invalidPayload);
  assertEquals(result, false);
});

Deno.test("ChecksumValidator - Validate payload structure - invalid timestamps", async () => {
  const validator = new ChecksumValidator();
  const now = Math.floor(Date.now() / 1000);

  const invalidPayload = {
    iss: "test-merchant",
    sub: "test-merchant",
    aud: "payment-processor",
    iat: now + 100,
    exp: now,
    jti: "a1b2c3d4e5f67890abcdef1234567890",
    cart_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  } as any;

  const result = await validator.validatePayloadStructure(invalidPayload);
  assertEquals(result, false);
});

Deno.test("ChecksumValidator - Validate JWT components - valid JWT", async () => {
  const { jwt } = await createTestJWT();
  const validator = new ChecksumValidator();

  const result = await validator.validateJWTComponents(jwt);

  assertEquals(result.length, 3);
  const headerValidation = result.find(r => r.type === 'header');
  const payloadValidation = result.find(r => r.type === 'payload');
  const signatureValidation = result.find(r => r.type === 'signature');

  assertExists(headerValidation);
  assertExists(payloadValidation);
  assertExists(signatureValidation);

  assertEquals(headerValidation.valid, true);
  assertEquals(payloadValidation.valid, true);
  assertEquals(signatureValidation.valid, true);
});

Deno.test("ChecksumValidator - Validate JWT components - invalid JWT format", async () => {
  const validator = new ChecksumValidator();
  const invalidJWT = "not.a.valid.jwt.format";

  const result = await validator.validateJWTComponents(invalidJWT);

  assertEquals(result.length, 1);
  assertEquals(result[0].valid, false);
  assertExists(result[0].error);
  assert(result[0].error!.includes('Invalid JWT format'));
});

Deno.test("ChecksumValidator - Complete JWT checksum validation - valid", async () => {
  const { jwt, cartContents } = await createTestJWT();
  const validator = new ChecksumValidator();

  const result = await validator.validateJWTChecksums(jwt, cartContents);

  // ASERCIONES ESTRICTAS: Un test "válido" debe pasar todas las comprobaciones.
  assert(result.valid, `Validation should be valid, but failed with: ${result.errors.join(", ")}`);
  assertEquals(result.errors.length, 0);
  
  assertEquals(result.components.header, true);
  assertEquals(result.components.payload, true);
  assertEquals(result.components.cartHash, true);
  assertEquals(result.components.structure, true);

  assertExists(result.checksums);
  // La aserción más importante: los hashes DEBEN ser idénticos.
  assertEquals(
    result.checksums.actualCartHash,
    result.checksums.expectedCartHash,
    "The actual cart hash and the expected hash from the JWT must be identical."
  );
});

Deno.test("ChecksumValidator - Complete JWT checksum validation - tampered cart", async () => {
  const { jwt, cartContents } = await createTestJWT();
  const validator = new ChecksumValidator();

  const tamperedCart = { ...cartContents, id: "tampered-id" };
  const result = await validator.validateJWTChecksums(jwt, tamperedCart);

  assertEquals(result.valid, false);
  assertEquals(result.components.cartHash, false);
  assert(result.errors.some(error => error.includes('Cart hash mismatch')));
  assertExists(result.checksums);
  assertNotEquals(result.checksums.actualCartHash, result.checksums.expectedCartHash);
});

Deno.test("ChecksumValidator - Strict mode validation", async () => {
  // Asumimos que el validador tiene límites configurables para el modo estricto
  const validator = new ChecksumValidator({ strictMode: true });
  const oversizedCart = { ...Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`field${i}`, i])) };
  const { jwt } = await createTestJWT(); // Usamos un JWT válido cualquiera

  const result = await validator.validateJWTChecksums(jwt, oversizedCart);

  // ASERCIÓN ESTRICTA: El test debe afirmar que la validación falla y por la razón correcta.
  assertEquals(result.valid, false);
  assert(result.errors.some(e => e.includes("Object exceeds property limit")), "Should fail due to too many properties");
});

Deno.test("ChecksumValidator - Object depth validation in strict mode", async () => {
  const validator = new ChecksumValidator({ strictMode: true });
  let deepObject: any = {};
  for (let i = 0; i < 11; i++) { deepObject = { nested: deepObject }; }
  const { jwt } = await createTestJWT();

  const result = await validator.validateJWTChecksums(jwt, deepObject);

  // ASERCIÓN ESTRICTA: El test debe afirmar que la validación falla y por la razón correcta.
  assertEquals(result.valid, false);
  assert(result.errors.some(e => e.includes("Object exceeds max depth")), "Should fail due to excessive nesting");
});

Deno.test("ChecksumValidator - Custom canonicalization options", async () => {
  const validatorWithSort = new ChecksumValidator({ canonicalization: { sortKeys: true } });
  const validatorWithoutSort = new ChecksumValidator({ canonicalization: { sortKeys: false } });

  const cart1 = { b: 1, a: 2 };
  const cart2 = { a: 2, b: 1 };

  const hashSorted1 = await validatorWithSort.computeRobustCartHash(cart1);
  const hashSorted2 = await validatorWithSort.computeRobustCartHash(cart2);
  assertEquals(hashSorted1, hashSorted2, "With key sorting, hashes should be identical");

  const hashUnsorted1 = await validatorWithoutSort.computeRobustCartHash(cart1);
  const hashUnsorted2 = await validatorWithoutSort.computeRobustCartHash(cart2);
  assertNotEquals(hashUnsorted1, hashUnsorted2, "Without key sorting, hashes should be different");
});

Deno.test("ChecksumValidator - Error handling for invalid input", async () => {
  const validator = new ChecksumValidator();
  const circularObj: any = { a: 1 };
  circularObj.self = circularObj;

  // Usar assertRejects es más idiomático para probar errores
  assertThrows(() => {
    validator.computeRobustCartHash(circularObj)
  }, Error, "Failed to compute robust cart hash: Maximum call stack size exceeded");
});

Deno.test("ChecksumValidator - Default instance", async () => {
  const { jwt, cartContents } = await createTestJWT();
  const result = await defaultChecksumValidator.validateJWTChecksums(jwt, cartContents);

  // ASERCIÓN ESTRICTA: El validador por defecto debe funcionar para un caso válido.
  assert(result.valid, `Default validator failed with: ${result.errors.join(", ")}`);
  assertEquals(result.errors.length, 0);
  assertExists(result.checksums);
  assertEquals(result.checksums.actualCartHash, result.checksums.expectedCartHash);
});

Deno.test("ChecksumValidator - Array sorting option", async () => {
  const validatorWithSort = new ChecksumValidator({ canonicalization: { sortArrays: true } });
  const validatorWithoutSort = new ChecksumValidator({ canonicalization: { sortArrays: false } });

  const cart1 = { items: [3, 1, 2] };
  const cart2 = { items: [1, 2, 3] };

  const hashWithSort1 = await validatorWithSort.computeRobustCartHash(cart1);
  const hashWithSort2 = await validatorWithSort.computeRobustCartHash(cart2);
  assertEquals(hashWithSort1, hashWithSort2, "With array sorting, hashes should be identical");

  const hashWithoutSort1 = await validatorWithoutSort.computeRobustCartHash(cart1);
  const hashWithoutSort2 = await validatorWithoutSort.computeRobustCartHash(cart2);
  assertNotEquals(hashWithoutSort1, hashWithoutSort2, "Without array sorting, hashes should be different");
});

Deno.test("ChecksumValidator - Malformed JWT handling", async () => {
  const validator = new ChecksumValidator();
  const malformedJWT = "invalid.base64.token";
  const result = await validator.validateJWTComponents(malformedJWT);

  assert(result.some(r => !r.valid && r.error?.includes('validation failed')));
});