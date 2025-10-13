/**
 * JTI Validator Test Suite (Refactored)
 *
 * Comprehensive tests for JWT ID validation, replay attack prevention, and storage mechanisms.
 */

import { assert, assertEquals, assertExists, assertRejects } from "./test_helper.ts";
import {
  JTIValidator,
  MemoryJTIStorage,
  defaultJTIValidator,
  type IJTIStorage,
  type JTIEntry,
  type MerchantAuthorizationPayload
} from "../src/mod.ts";

// Helper function to create a standard test payload
function createTestPayload(overrides: Partial<MerchantAuthorizationPayload> = {}): MerchantAuthorizationPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "test-merchant", sub: "test-merchant", aud: "payment-processor",
    iat: now, exp: now + 900, jti: "a1b2c3d4e5f67890abcdef1234567890",
    cart_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ...overrides
  };
}

Deno.test("MemoryJTIStorage", async (t) => {
  await t.step("should handle basic store, exists, and size operations", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const entry: JTIEntry = { jti: "j".repeat(32), issuer: "iss", expiresAt: Date.now() + 3600, createdAt: Date.now() };
      assertEquals(await storage.exists(entry.jti, entry.issuer), false);
      await storage.store(entry);
      assertEquals(await storage.exists(entry.jti, entry.issuer), true);
      assertEquals(await storage.exists(entry.jti, "other-iss"), false);
      assertEquals(await storage.size(), 1);
    } finally {
      storage.destroy();
    }
  });

  await t.step("should correctly handle expired entries on existence check", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiredEntry: JTIEntry = { jti: "e".repeat(32), issuer: "iss", expiresAt: now - 100, createdAt: now - 200 };
      const validEntry: JTIEntry = { jti: "v".repeat(32), issuer: "iss", expiresAt: now + 3600, createdAt: now };
      await storage.store(expiredEntry);
      await storage.store(validEntry);
      assertEquals(await storage.exists(expiredEntry.jti, expiredEntry.issuer), false, "Expired entry should not exist");
      assertEquals(await storage.exists(validEntry.jti, validEntry.issuer), true, "Valid entry should exist");
    } finally {
      storage.destroy();
    }
  });

  await t.step("cleanup() should remove all expired entries", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const now = Math.floor(Date.now() / 1000);
      await storage.store({ jti: "j1".padEnd(32, '0'), issuer: "iss", expiresAt: now - 100, createdAt: now });
      await storage.store({ jti: "j2".padEnd(32, '0'), issuer: "iss", expiresAt: now + 100, createdAt: now });
      await storage.store({ jti: "j3".padEnd(32, '0'), issuer: "iss", expiresAt: now - 50, createdAt: now });
      await storage.store({ jti: "j4".padEnd(32, '0'), issuer: "iss", expiresAt: now + 200, createdAt: now });
      assertEquals(await storage.size(), 4);
      const cleanedCount = await storage.cleanup();
      assertEquals(cleanedCount, 2, "Should remove 2 expired entries");
      assertEquals(await storage.size(), 2, "Should have 2 valid entries left");
    } finally {
      storage.destroy();
    }
  });

  await t.step("should enforce maxSize by evicting oldest entries", async () => {
    const storage = new MemoryJTIStorage({ maxSize: 3 });
    try {
      const now = Math.floor(Date.now() / 1000);
      for (let i = 0; i < 5; i++) {
        await storage.store({ jti: `jti${i}`.padEnd(32, '0'), issuer: "iss", expiresAt: now + 3600, createdAt: now + i });
      }
      // The storage should have evicted the two oldest entries to stay at the maxSize.
      assertEquals(await storage.size(), 3);
      assertEquals(await storage.exists("jti0".padEnd(32, '0'), "iss"), false, "Oldest entry should be evicted");
      assertEquals(await storage.exists("jti1".padEnd(32, '0'), "iss"), false, "Second oldest entry should be evicted");
      assertEquals(await storage.exists("jti4".padEnd(32, '0'), "iss"), true, "Newest entry should exist");
    } finally {
      storage.destroy();
    }
  });
});

Deno.test("JTIValidator", async (t) => {
  await t.step("validateJTI() should pass for a valid payload", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const validator = new JTIValidator(storage);
      const result = await validator.validateJTI(createTestPayload());
      assertEquals(result.valid, true);
      assertEquals(result.error, undefined);
    } finally {
      storage.destroy();
    }
  });

  await t.step("validateJTI() should fail for various invalid payloads", async () => {
    const cases = {
      "Missing JWT ID": { jti: undefined },
      "Invalid JTI format": { jti: "invalid" },
      "Missing issuer": { iss: undefined },
      "Missing expiration": { exp: undefined },
      "JWT has expired": { exp: Math.floor(Date.now() / 1000) - 100 },
      "JWT is issued in the future": { iat: Math.floor(Date.now() / 1000) + 100 },
    };
    for (const [name, payloadOverride] of Object.entries(cases)) {
      const storage = new MemoryJTIStorage();
      try {
        const validator = new JTIValidator(storage);
        const payload = createTestPayload(payloadOverride as any);
        const result = await validator.validateJTI(payload);
        assertEquals(result.valid, false, `Should fail for: ${name}`);
        assertExists(result.error);
      } finally {
        storage.destroy();
      }
    }
  });

  await t.step("validateJTI() should detect a replay attack", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const validator = new JTIValidator(storage);
      const payload = createTestPayload();
      await validator.markJTIAsUsed(payload); // Mark as used first
      const result = await validator.validateJTI(payload);
      assertEquals(result.valid, false);
      assertEquals(result.isReplay, true);
      assert(result.error?.includes("replay attack"));
    } finally {
      storage.destroy();
    }
  });

  await t.step("validateJTI() should respect clock tolerance", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const validator = new JTIValidator(storage, { clockTolerance: 60 });
      const now = Math.floor(Date.now() / 1000);
      const payload = createTestPayload({ exp: now - 30, iat: now + 30 });
      const result = await validator.validateJTI(payload);
      assertEquals(result.valid, true, "Should be valid within clock tolerance");
    } finally {
      storage.destroy();
    }
  });

  await t.step("markJTIAsUsed() should reject an invalid payload", async () => {
    const storage = new MemoryJTIStorage();
    try {
      const validator = new JTIValidator(storage);
      const invalidPayload = createTestPayload({ jti: undefined } as any);
      await assertRejects(() => validator.markJTIAsUsed(invalidPayload), Error, "Invalid payload");
    } finally {
      storage.destroy();
    }
  });

  await t.step("should handle storage errors gracefully", async () => {
    class ErrorStorage implements IJTIStorage {
      exists = () => Promise.reject(new Error("Storage error"));
      store = () => Promise.reject(new Error("Storage error"));
      cleanup = () => Promise.reject(new Error("Storage error"));
      size = () => Promise.reject(new Error("Storage error"));
    }
    const validator = new JTIValidator(new ErrorStorage());
    const result = await validator.validateJTI(createTestPayload());
    assertEquals(result.valid, false);
    assert(result.error?.includes("validation error"));
  });

  await t.step("should cover final edge cases for 100% coverage", async () => {
  // --- Test para la rama `|| 86400` en markJTIAsUsed ---
  const storage1 = new MemoryJTIStorage();
  try {
    // Creamos un validador sin maxAge para cubrir la rama de fallback.
    const validator = new JTIValidator(storage1, { maxAge: undefined });
    // Usamos exp: 0 para asegurar que Math.max evalúe la segunda parte.
    const payload = createTestPayload({ exp: 0 });
    await validator.markJTIAsUsed(payload);
    assertEquals(await storage1.size(), 1);
  } finally {
    storage1.destroy();
  }

  // --- Test para el `catch` de error no estándar en validateJTI ---
  class MockStorage implements IJTIStorage {
    exists = () => Promise.reject("a plain string error"); // Lanza un string
    store = () => Promise.resolve();
    cleanup = () => Promise.resolve(0);
    size = () => Promise.resolve(0);
  }
  const validator2 = new JTIValidator(new MockStorage());
  const result = await validator2.validateJTI(createTestPayload());
  assertEquals(result.valid, false);
  assert(result.error?.includes("a plain string error"));

  // --- Test para getStats() ---
  const storage3 = new MemoryJTIStorage();
  try {
    const validator = new JTIValidator(storage3);
    await validator.markJTIAsUsed(createTestPayload());
    const stats = await validator.getStats();
    assertEquals(stats.size, 1);
  } finally {
    storage3.destroy();
  }
});
});

Deno.test("defaultJTIValidator", async (t) => {
  await t.step("should perform validation and replay detection", async () => {
    // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
    // Usamos crypto.randomUUID() para garantizar un JTI 100% único en cada ejecución.
    const uniqueJTI = crypto.randomUUID().replaceAll("-", "");
    const payload = createTestPayload({ jti: uniqueJTI });

    // Ahora la primera validación siempre debería pasar.
    const result1 = await defaultJTIValidator.validateJTI(payload);
    assertEquals(result1.valid, true, `First validation failed with error: ${result1.error}`);

    await defaultJTIValidator.markJTIAsUsed(payload);

    const result2 = await defaultJTIValidator.validateJTI(payload);
    assertEquals(result2.valid, false);
    assertEquals(result2.isReplay, true);
  });
});