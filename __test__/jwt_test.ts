import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
  assertNotEquals,
} from "./test_helper.ts";
import { FakeTime } from "https://deno.land/std@0.224.0/testing/time.ts";
import {
  jwtService,
  JOSEJWTService,
  JOSEJWTSigner,
  JOSEJWTVerifier,
  JOSEJWTKeyManager,
} from "../src/mod.ts";
import * as jose from "jose";

import {
  KeyManagementError,
  JWTSigningError,
} from "../src/core/jwt/errors.ts";

Deno.test("JWT Service Suite", async (t) => {
  const keyManager = new JOSEJWTKeyManager();
  const signer = new JOSEJWTSigner();
  const createVerifier = () => new JOSEJWTVerifier();

  await t.step("Key Management (JOSEJWTKeyManager)", async (t) => {
    await t.step("should generate valid key pairs for supported algorithms", async () => {
      // FINAL CORRECTION: Probar solo los algoritmos que sabemos que son soportados
      const algorithms = ["RS256", "ES256", "ES384"] as const;
      for (const alg of algorithms) {
        const keyPair = await keyManager.generateKeyPair(alg);
        assertExists(keyPair.privateKey, `privateKey string should exist for ${alg}`);
        assertExists(keyPair.publicKey, `publicKey string should exist for ${alg}`);
        assertExists(keyPair._privateCryptoKey, `_privateCryptoKey should exist for ${alg}`);
        assertExists(keyPair._publicCryptoKey, `_publicCryptoKey should exist for ${alg}`);
        assertEquals(keyPair.algorithm, alg);
        assertExists(keyPair.keyId);
      }
    });

    await t.step("should reject unsupported or problematic algorithms with a clear error", async () => {
      // Prueba para algoritmos completamente no soportados
      await assertRejects(
        () => keyManager.generateKeyPair("HS256" as any),
        KeyManagementError,
        "Unsupported algorithm: HS256",
      );
      // FINAL CORRECTION: Prueba específica para el caso de ES512
      await assertRejects(
        () => keyManager.generateKeyPair("ES512"),
        KeyManagementError,
        "Algorithm ES512 is not supported due to Deno runtime limitations",
      );
    });

    await t.step("should validate a correct key configuration", async () => {
      const keyPair = await keyManager.generateKeyPair("RS256");
      const isValid = await keyManager.validateKeyConfig(keyPair);
      assertEquals(isValid, true);
    });

    await t.step("should invalidate an incorrect key configuration", async () => {
      const isInvalid = await keyManager.validateKeyConfig({
        privateKey: "invalid",
        publicKey: "invalid",
        algorithm: "RS256",
      });
      assertEquals(isInvalid, false);
    });
  });

  // --- El resto de las suites de pruebas no necesitan cambios ---

  await t.step("Signing (JOSEJWTSigner)", async (t) => {
    const keyPair = await keyManager.generateKeyPair("RS256");
    const payload = {
      iss: "test-issuer",
      sub: "test-subject",
      aud: "test-audience",
      cart_hash: "test-hash",
    };

    await t.step("should sign a payload with a valid PEM private key", async () => {
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: keyPair });
      assertExists(jwt);
      assertEquals(jwt.split(".").length, 3);
    });

    await t.step("should sign a payload with a valid JWK private key", async () => {
      const privateJwk = await jose.exportJWK(keyPair._privateCryptoKey!);
      const jwkKeyConfig = { ...keyPair, privateKey: JSON.stringify(privateJwk) };
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: jwkKeyConfig });
      assertExists(jwt);
    });

    await t.step("should reject signing with an invalid key format", async () => {
      await assertRejects(
        () => signer.signMerchantAuthorization(payload, {
          keyConfig: { ...keyPair, privateKey: "invalid-key-format" },
        }),
        JWTSigningError,
        "Failed to sign JWT",
      );
    });
  });

  await t.step("Verification (JOSEJWTVerifier)", async (t) => {
    const keyPair = await keyManager.generateKeyPair("RS256");
    const payload = {
      iss: "test-issuer",
      sub: "test-subject",
      aud: "test-audience",
      cart_hash: "test-hash",
    };

    await t.step("should verify a valid JWT with a PEM public key", async () => {
      const verifier = createVerifier();
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: keyPair });
      const result = await verifier.verifyMerchantAuthorization(jwt, {
        keyConfig: keyPair,
        issuer: "test-issuer",
        audience: "test-audience",
      });
      assertEquals(result.valid, true, `Verification failed: ${result.error}`);
    });

    await t.step("should verify a valid JWT with a JWK public key", async () => {
      const verifier = createVerifier();
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: keyPair });
      const publicJwk = await jose.exportJWK(keyPair._publicCryptoKey!);
      const jwkKeyConfig = { ...keyPair, publicKey: JSON.stringify(publicJwk) };
      const result = await verifier.verifyMerchantAuthorization(jwt, {
        keyConfig: jwkKeyConfig,
        issuer: "test-issuer",
        audience: "test-audience",
      });
      assertEquals(result.valid, true, `JWK verification failed: ${result.error}`);
    });

    await t.step("should fail to verify a JWT with an invalid signature", async () => {
      const verifier = createVerifier();
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: keyPair });
      const corruptedJWT = jwt.slice(0, -5) + "XXXXX";
      const result = await verifier.verifyMerchantAuthorization(corruptedJWT, { keyConfig: keyPair, issuer: "test-issuer" });
      assertEquals(result.valid, false);
      assertStringIncludes(result.error!, "signature verification failed");
    });

    await t.step("should fail to verify an expired JWT", async (t) => {
      const verifier = createVerifier();
      const time = new FakeTime();
      try {
        const shortLivedJwt = await signer.signMerchantAuthorization(payload, {
          keyConfig: keyPair,
          expiresIn: 60,
        });
        time.tick(120 * 1000);
        const result = await verifier.verifyMerchantAuthorization(shortLivedJwt, { keyConfig: keyPair, issuer: "test-issuer" });
        assertEquals(result.valid, false);
        assertStringIncludes(result.error!, '"exp" claim timestamp check failed');
      } finally {
        time.restore();
      }
    });

    await t.step("should fail if a required payload field is missing", async () => {
      const verifier = createVerifier();
      const incompletePayload = { iss: "test", sub: "test", aud: "test" };
      const privateKeyObj = await jose.importPKCS8(keyPair.privateKey, "RS256");
      const malformedJwt = await new jose.SignJWT(incompletePayload as any)
        .setProtectedHeader({ alg: "RS256", kid: keyPair.keyId })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(privateKeyObj);

      const result = await verifier.verifyMerchantAuthorization(malformedJwt, { keyConfig: keyPair, issuer: "test" });
      assertEquals(result.valid, false);
      assertStringIncludes(result.validationErrors![0], "Missing required field: cart_hash");
    });

    await t.step("should return error for invalid public key format without rejecting", async () => {
      const verifier = createVerifier();
      const jwt = await signer.signMerchantAuthorization(payload, { keyConfig: keyPair });
      const result = await verifier.verifyMerchantAuthorization(jwt, {
        keyConfig: { ...keyPair, publicKey: "invalid-key" },
      });
      assertEquals(result.valid, false);
      assertStringIncludes(result.error!, "Invalid public key format");
    });
  });

  await t.step("End-to-End Service (JOSEJWTService)", async (t) => {
    await t.step("should generate unique JTIs", () => {
      const jti1 = jwtService.generateJTI();
      const jti2 = jwtService.generateJTI();
      assertNotEquals(jti1, jti2);
    });

    await t.step("should compute a deterministic cart hash", async () => {
      const cart = { id: "123", total: 99.99 };
      const hash1 = await jwtService.computeCartHash(cart);
      const hash2 = await jwtService.computeCartHash(cart);
      assertEquals(hash1, hash2);
    });

    await t.step("should detect a replay attack using JTI", async () => {
      const keyPair = await jwtService.generateKeyPair("RS256");
      const payload = { iss: "jti-issuer", sub: "jti-subject", aud: "jti-audience", cart_hash: "jti-hash" };
      const jwt = await jwtService.signMerchantAuthorization(payload, { keyConfig: keyPair });
      
      const result1 = await jwtService.verifyMerchantAuthorization(jwt, { keyConfig: keyPair, issuer: "jti-issuer" });
      assertEquals(result1.valid, true);
      
      const result2 = await jwtService.verifyMerchantAuthorization(jwt, { keyConfig: keyPair, issuer: "jti-issuer" });
      assertEquals(result2.valid, false);
      assert(result2.validationErrors?.some(e => e.includes("replay attack")));
    });

    await t.step("should allow dependency injection for a SOLID architecture", async () => {
        const customService = new JOSEJWTService(new JOSEJWTSigner(), new JOSEJWTVerifier(), new JOSEJWTKeyManager());
        const keyPair = await customService.generateKeyPair('RS256');
        const result = await customService.validateKeyConfig(keyPair);
        assertEquals(result, true);
    });
  });
});