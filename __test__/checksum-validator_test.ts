/**
 * Checksum Validator Test Suite (Refactored)
 *
 * Comprehensive tests for multi-level checksum validation, grouped by method.
 */

import { assert, assertEquals, assertNotEquals, assertThrows, assertExists } from "./test_helper.ts";
import { stub } from "@std/testing/mock";

import {
  ChecksumValidator,
  defaultChecksumValidator,
  jwtService,
  type MerchantAuthorizationPayload
} from "../src/mod.ts";

// --- Test Data Setup ---
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
        total: { label: "Test Total", amount: { currency: "USD", value: "99.99" }, refund_period: 30 }
      },
      options: {}
    }
  };
}

async function createTestJWT(cartData?: unknown) {
  const keyPair = await jwtService.generateKeyPair('RS256');
  const cartContents = cartData ?? createTestCartContents();
  const cartHash = await jwtService.computeCartHash(cartContents);
  const payload = { iss: "test-merchant", sub: "test-merchant", aud: "payment-processor", cart_hash: cartHash };
  const jwt = await jwtService.signMerchantAuthorization(payload, { keyConfig: keyPair, expiresIn: 900 });
  return { jwt, cartContents, keyPair };
}


// --- Test Suites ---

Deno.test("ChecksumValidator.computeRobustCartHash()", async (t) => {
  const validator = new ChecksumValidator();

  await t.step("should be deterministic for the same input", async () => {
    const cartContents = createTestCartContents();
    const hash1 = await validator.computeRobustCartHash(cartContents);
    const hash2 = await validator.computeRobustCartHash(cartContents);
    assertEquals(hash1, hash2);
    assertEquals(hash1.length, 64);
  });

  await t.step("should handle different field order (canonicalization)", async () => {
    const cart1 = { a: 1, b: 2 };
    const cart2 = { b: 2, a: 1 };
    assertEquals(await validator.computeRobustCartHash(cart1), await validator.computeRobustCartHash(cart2));
  });

  await t.step("should handle undefined values", async () => {
    const cart1 = { a: 1, b: undefined, c: 3 };
    const cart2 = { a: 1, c: 3 };
    assertEquals(await validator.computeRobustCartHash(cart1), await validator.computeRobustCartHash(cart2));
  });

  await t.step("should handle whitespace normalization", async () => {
    const cart1 = { message: "Hello   World\n\t" };
    const cart2 = { message: "Hello World" };
    assertEquals(await validator.computeRobustCartHash(cart1), await validator.computeRobustCartHash(cart2));
  });

  await t.step("should handle array sorting option correctly", async () => {
    const validatorWithSort = new ChecksumValidator({ canonicalization: { sortArrays: true } });
    const validatorWithoutSort = new ChecksumValidator({ canonicalization: { sortArrays: false } });
    const cart1 = { items: [3, 1, 2] };
    const cart2 = { items: [1, 2, 3] };
    assertEquals(await validatorWithSort.computeRobustCartHash(cart1), await validatorWithSort.computeRobustCartHash(cart2));
    assertNotEquals(await validatorWithoutSort.computeRobustCartHash(cart1), await validatorWithoutSort.computeRobustCartHash(cart2));
  });

  await t.step("should handle strings when whitespace normalization is disabled", () => {
    const validator = new ChecksumValidator({ canonicalization: { normalizeWhitespace: false } });
    const cart1 = " Hello  World ";
    const hash = validator.computeRobustCartHash(cart1);
    assertExists(hash); // Solo necesitamos verificar que se ejecuta sin errores
  });

  await t.step("should handle exceptions correctly", () => {
    const validator = new ChecksumValidator();

    // Caso 1: Error estándar (referencia circular)
    const circularObj: any = { a: 1 };
    circularObj.self = circularObj;
    assertThrows(() => validator.computeRobustCartHash(circularObj), Error, "Failed to compute robust cart hash");

    // Caso 2: Error no estándar
    const stringifyStub = stub(JSON, "stringify", () => { throw "non-error thrown"; });
    try {
      assertThrows(() => validator.computeRobustCartHash({}), Error, "non-error thrown");
    } finally {
      stringifyStub.restore();
    }
  });
});


Deno.test("ChecksumValidator.validatePayloadStructure()", async (t) => {
  const validator = new ChecksumValidator();
  const now = Math.floor(Date.now() / 1000);

  await t.step("should return true for a valid payload", async () => {
    const validPayload: MerchantAuthorizationPayload = { iss: "m", sub: "m", aud: "p", iat: now, exp: now + 900, jti: "a".repeat(32), cart_hash: "b".repeat(64) };
    assertEquals(await validator.validatePayloadStructure(validPayload), true);
  });

  await t.step("should return false for missing required fields", async () => {
    const invalidPayload = { iss: "merchant" } as any;
    assertEquals(await validator.validatePayloadStructure(invalidPayload), false);
  });

  await t.step("should return false for invalid field types", async () => {
    const invalidPayload = { iss: 123, sub: "m", aud: "p", cart_hash: "b".repeat(64) } as any;
    assertEquals(await validator.validatePayloadStructure(invalidPayload), false);
  });

  await t.step("should return false for invalid timestamps (exp <= iat)", async () => {
    const invalidPayload = { iss: "m", sub: "m", aud: "p", iat: now, exp: now, cart_hash: "b".repeat(64) } as any;
    assertEquals(await validator.validatePayloadStructure(invalidPayload), false);
  });

  await t.step("should return false for null or undefined input", async () => {
    const validator = new ChecksumValidator();
    assertEquals(await validator.validatePayloadStructure(null as any), false);
    assertEquals(await validator.validatePayloadStructure(undefined as any), false);
  });

  await t.step("should return false for non-object inputs", async () => {
    const validator = new ChecksumValidator();
    assertEquals(await validator.validatePayloadStructure(null as any), false);
    assertEquals(await validator.validatePayloadStructure(undefined as any), false);
  });

  await t.step("should return false for non-object inputs", async () => {
    const validator = new ChecksumValidator();
    // Forzamos la llamada con null para activar el bloque catch
    assertEquals(await validator.validatePayloadStructure(null as any), false);
  });
});


Deno.test("ChecksumValidator.validateJWTComponents()", async (t) => {
  const validator = new ChecksumValidator();

  await t.step("should return valid for all components of a valid JWT", async () => {
    const { jwt } = await createTestJWT();
    const result = await validator.validateJWTComponents(jwt);
    assertEquals(result.length, 3);
    assert(result.every(r => r.valid), "All components of a valid JWT should be valid");
  });

  await t.step("should return multiple errors for a JWT with invalid Base64 parts", async () => {
    const result = await validator.validateJWTComponents("not.a.jwt");

    // ASERCIÓN CORREGIDA: Esperamos 3 resultados, uno por cada parte del JWT.
    assertEquals(result.length, 3);

    // ASERCIÓN CORREGIDA: Verificamos que los componentes esperados son inválidos.
    const headerResult = result.find(r => r.type === 'header');
    const payloadResult = result.find(r => r.type === 'payload');

    assertEquals(headerResult?.valid, false, "Header component should be invalid");
    assertEquals(payloadResult?.valid, false, "Payload component should be invalid");
  });

  await t.step("should return a single error for a JWT with incorrect number of parts", async () => {
    const result = await validator.validateJWTComponents("this.has.four.parts");

    // ASERCIÓN NUEVA: Este es el caso que el test original intentaba cubrir.
    assertEquals(result.length, 1);
    assertEquals(result[0].valid, false);
    assert(result[0].error?.includes("Invalid JWT format"));
  });

  await t.step("should handle components that are not valid JSON", async () => {
    const validator = new ChecksumValidator();
    const header = btoa("{ not-json }");
    const payload = btoa("{ also-not-json }");
    const signature = "dummy-sig";
    const jwt = `${header}.${payload}.${signature}`;

    const result = await validator.validateJWTComponents(jwt);

    const headerResult = result.find(r => r.type === 'header');
    const payloadResult = result.find(r => r.type === 'payload');

    assertEquals(headerResult?.valid, false);
    assert(headerResult?.error?.includes("Header validation failed"));

    assertEquals(payloadResult?.valid, false);
    assert(payloadResult?.error?.includes("Payload validation failed"));
  });

  await t.step("should handle exceptions in each component", async () => {
    const validator = new ChecksumValidator();
    const jwt = "a.b.c";

    // Test 1: Forzar un error NO estándar solo en el PAYLOAD
    let callCount = 0;
    const atobStub = stub(globalThis, "atob", () => {
      callCount++;
      if (callCount === 2) { // Falla solo en la segunda llamada (payload)
        throw "payload text error";
      }
      return "{}"; // Pasa en la primera (header)
    });

    try {
      const result = await validator.validateJWTComponents(jwt);
      const payloadResult = result.find(r => r.type === 'payload');
      assertEquals(payloadResult?.valid, false);
      assert(payloadResult?.error?.includes("payload text error"));
    } finally {
      atobStub.restore(); // Limpia el stub
    }
  });

  await t.step("should fail for invalid JWT header structures", async () => {
    const validator = new ChecksumValidator();

    // Caso 1: El header no es un objeto
    const header1 = btoa("null");
    const result1 = await validator.validateJWTComponents(`${header1}.b.c`);
    assertEquals(result1.find(r => r.type === 'header')?.valid, false);

    // Caso 2: El campo 'typ' es inválido
    const header2 = btoa(JSON.stringify({ alg: "RS256", typ: "NOT_JWT" }));
    const result2 = await validator.validateJWTComponents(`${header2}.b.c`);
    assertEquals(result2.find(r => r.type === 'header')?.valid, false);
  });

  await t.step("should handle an exception during signature processing", async () => {
    const validator = new ChecksumValidator();
    const jwt = "a.b.c";

    // Forzamos que TextEncoder.encode lance un error solo para la parte de la firma
    const originalEncode = TextEncoder.prototype.encode;
    const encodeStub = stub(TextEncoder.prototype, "encode", (input) => {
      if (input === "c") { // La parte de la firma de nuestro JWT falso
        throw new Error("Signature encoding failed");
      }
      return originalEncode.call(new TextEncoder(), input);
    });

    try {
      const result = await validator.validateJWTComponents(jwt);
      const sigResult = result.find(r => r.type === 'signature');
      assertEquals(sigResult?.valid, false);
      assert(sigResult?.error?.includes("Signature validation failed"));
    } finally {
      encodeStub.restore(); // ¡Crucial restaurar la función original!
    }
  });

  await t.step("should fail for invalid JWT header structures", async () => {
    const validator = new ChecksumValidator();

    // Caso 1: El header no es un objeto (cubre la línea 300)
    const header1 = btoa("null");
    const result1 = await validator.validateJWTComponents(`${header1}.b.c`);
    assertEquals(result1.find(r => r.type === 'header')?.valid, false);

    // Caso 2: El campo 'typ' es inválido (cubre la línea 302)
    const header2 = btoa(JSON.stringify({ alg: "RS256", typ: "NOT_JWT" }));
    const result2 = await validator.validateJWTComponents(`${header2}.b.c`);
    assertEquals(result2.find(r => r.type === 'header')?.valid, false);
  });

  await t.step("should handle an empty signature and exceptions", async () => {
    const validator = new ChecksumValidator();

    // Caso 1: Firma vacía (cubre la línea 308)
    const jwtWithEmptySig = "a.b.";
    const result1 = await validator.validateJWTComponents(jwtWithEmptySig);
    assertEquals(result1.find(r => r.type === 'signature')?.valid, false);

    // Caso 2: Excepción en el procesamiento de la firma (cubre la línea 247)
    const jwt = "a.b.c";
    const originalEncode = TextEncoder.prototype.encode;
    const encodeStub = stub(TextEncoder.prototype, "encode", (input) => {
      if (input === "c") { // La parte de la firma de nuestro JWT falso
        throw new Error("Signature encoding failed");
      }
      return originalEncode.call(new TextEncoder(), input);
    });

    try {
      const result2 = await validator.validateJWTComponents(jwt);
      const sigResult = result2.find(r => r.type === 'signature');
      assertEquals(sigResult?.valid, false);
      assert(sigResult?.error?.includes("Signature validation failed"));
    } finally {
      encodeStub.restore(); // ¡Crucial restaurar la función original!
    }
  });

  await t.step("should handle non-Error exceptions from internal functions", async () => {
    const validator = new ChecksumValidator();
    const jwt = "a.b.c";

    // Forzamos que atob lance un string para cubrir los catch
    const atobStub = stub(globalThis, "atob", () => { throw "atob failed"; });
    try {
      const result = await validator.validateJWTComponents(jwt);

      const headerResult = result.find(r => r.type === 'header');
      const payloadResult = result.find(r => r.type === 'payload');

      assertEquals(headerResult?.valid, false, "Header should be invalid when atob fails");
      assert(headerResult?.error?.includes("atob failed"), "Header error should contain the thrown message");

      assertEquals(payloadResult?.valid, false, "Payload should be invalid when atob fails");
      assert(payloadResult?.error?.includes("atob failed"), "Payload error should contain the thrown message");
    } finally {
      atobStub.restore();
    }
  });
});


Deno.test("ChecksumValidator.validateJWTChecksums()", async (t) => {
  await t.step("should pass for a valid JWT and cart", async () => {
    const { jwt, cartContents } = await createTestJWT();
    const result = await defaultChecksumValidator.validateJWTChecksums(jwt, cartContents);
    assert(result.valid, `Default validator failed: ${result.errors.join(", ")}`);
    assertEquals(result.errors.length, 0);
    assertEquals(result.checksums?.actualCartHash, result.checksums?.expectedCartHash);
  });

  await t.step("should fail for a tampered cart", async () => {
    const { jwt, cartContents } = await createTestJWT();
    const validator = new ChecksumValidator();
    const tamperedCart = { ...cartContents, id: "tampered-id" };
    const result = await validator.validateJWTChecksums(jwt, tamperedCart);
    assertEquals(result.valid, false);
    assertEquals(result.components.cartHash, false);
    assert(result.errors.some(e => e.includes('Cart hash mismatch')));
  });

  await t.step("strict mode should fail for an oversized object", async () => {
    const validator = new ChecksumValidator({ strictMode: true, maxObjectProperties: 100 });
    const oversizedCart = { ...Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`field${i}`, i])) };
    const { jwt } = await createTestJWT(oversizedCart);
    const result = await validator.validateJWTChecksums(jwt, oversizedCart);
    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes("Object exceeds property limit")));
  });

  await t.step("strict mode should fail for a deeply nested object", async () => {
    const validator = new ChecksumValidator({ strictMode: true, maxObjectDepth: 10 });
    let deepObject: any = {};
    for (let i = 0; i < 11; i++) { deepObject = { nested: deepObject }; }
    const { jwt } = await createTestJWT(deepObject);
    const result = await validator.validateJWTChecksums(jwt, deepObject);
    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes("Object exceeds max depth")));
  });

  await t.step("strict mode should fail for a deeply nested object within an array", async () => {
    const validator = new ChecksumValidator({ strictMode: true, maxObjectDepth: 5 });
    let deepObject: any = {};
    for (let i = 0; i < 6; i++) { deepObject = { nested: deepObject }; }

    const cartWithDeepArray = { items: [1, 2, deepObject] };
    const { jwt } = await createTestJWT(cartWithDeepArray);

    const result = await validator.validateJWTChecksums(jwt, cartWithDeepArray);

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes("Object exceeds max depth")));
  });

  await t.step("should fail if payload is not valid JSON", async () => {
    const validator = new ChecksumValidator();
    // Header válido, Payload es Base64 válido pero JSON inválido
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const invalidPayload = btoa("{ not-json }");
    const signature = "dummy-sig";
    const jwt = `${header}.${invalidPayload}.${signature}`;

    const result = await validator.validateJWTChecksums(jwt, createTestCartContents());

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes("Failed to decode JWT payload")));
  });

  await t.step("should handle unexpected errors during validation", async () => {
    const validator = new ChecksumValidator();

    // Caso 1: Error estándar (JWT es nulo)
    const result1 = await validator.validateJWTChecksums(null as any, {});
    assertEquals(result1.valid, false);
    assert(result1.errors.some(e => e.includes("Checksum validation error")));

    // Caso 2: Error no estándar
    const splitStub = stub(String.prototype, "split", () => { throw "non-error split"; });
    try {
      const result2 = await validator.validateJWTChecksums("a.b.c", {});
      assertEquals(result2.valid, false);
      assert(result2.errors.some(e => e.includes("non-error split")));
    } finally {
      splitStub.restore();
    }
  });
});