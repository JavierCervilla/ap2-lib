 /**
 * BaseMandate Test Suite
 *
 * Comprehensive tests for BaseMandate to achieve 100% branch coverage.
 * Focus on covering all conditional branches and optional parameter paths.
 */

import {  assertEquals, assertExists } from "./test_helper.ts";
import { BaseMandate } from "../src/core/mandates/shared/base-mandate.ts";
import type { IntentMandate } from "../src/types/mod.ts";
import { assertNotEquals } from "@std/assert/not-equals";

// Create a concrete implementation for testing BaseMandate
class TestMandate extends BaseMandate<IntentMandate> {
  constructor(data: IntentMandate, options?: any) {
    super(data, options);
  }

  // Implement required abstract methods
  toString(): string {
    return `TestMandate: ${this._data.natural_language_description}`;
  }

  protected async validate(): Promise<void> {
    // Simple validation for testing
    if (!this._data.natural_language_description) {
      throw new Error("Missing natural_language_description");
    }
  }
}

// Valid test data
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2026-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
  merchants: ["coffee-store.com"],
  requires_refundability: true
};

Deno.test("BaseMandate - constructor with default options (all branches)", () => {
  // CRITICAL: This covers branches 37-42 when all options are undefined
  const mandate = new TestMandate(validIntentMandate);

  // Verify default values are set (covering the ?? branches)
  assertEquals(mandate.getStatus(), "pending"); // Covers options?.status ?? 'pending'
  assertExists(mandate.getCreatedAt()); // Covers options?.createdAt ?? new Date()
  assertEquals(mandate.getSignature(), undefined); // Covers options?.signature (undefined)
  assertExists(mandate.getId()); // Covers options?.id ?? this.generateUniqueId()
});

Deno.test("BaseMandate - constructor with partial options (mixed branches)", () => {
  const customDate = new Date("2024-01-01T00:00:00Z");

  // CRITICAL: This covers some branches with values, others with defaults
  const mandate = new TestMandate(validIntentMandate, {
    status: "authorized", // Provided value, covers left side of ??
    createdAt: customDate, // Provided value, covers left side of ??
    // signature and id omitted, covers right side of ??
  });

  assertEquals(mandate.getStatus(), "authorized");
  assertEquals(mandate.getCreatedAt().getTime(), customDate.getTime());
  assertEquals(mandate.getSignature(), undefined); // Right side of ?? branch
  assertExists(mandate.getId()); // Right side of ?? branch (generateUniqueId)
});

Deno.test("BaseMandate - constructor with all options provided (left side branches)", () => {
  const customDate = new Date("2024-01-01T00:00:00Z");

  // CRITICAL: This covers all left sides of ?? operators
  const mandate = new TestMandate(validIntentMandate, {
    status: "captured", // Left side of ??
    createdAt: customDate, // Left side of ??
    signature: "test-signature", // Provided value
    id: "custom-id-123" // Left side of ??
  });

  assertEquals(mandate.getStatus(), "captured");
  assertEquals(mandate.getCreatedAt().getTime(), customDate.getTime());
  assertEquals(mandate.getSignature(), "test-signature"); // CRITICAL: Covers line 109-111
  assertEquals(mandate.getId(), "custom-id-123");
});

Deno.test("BaseMandate - constructor with signature provided (signature branch)", () => {
  // CRITICAL: This specifically tests the signature branch (line 39 and getSignature method)
  const mandate = new TestMandate(validIntentMandate, {
    signature: "mock.signature.value"
  });

  // This covers the getSignature() method return (line 110)
  assertEquals(mandate.getSignature(), "mock.signature.value");
});

Deno.test("BaseMandate - constructor with signature undefined (signature branch)", () => {
  // CRITICAL: This tests when signature is explicitly undefined
  const mandate = new TestMandate(validIntentMandate, {
    signature: undefined
  });

  // This covers the getSignature() method return undefined (line 110)
  assertEquals(mandate.getSignature(), undefined);
});

Deno.test("BaseMandate - constructor with empty options object (default branches)", () => {
  // CRITICAL: This covers when options is {} - all properties are undefined
  const mandate = new TestMandate(validIntentMandate, {});

  assertEquals(mandate.getStatus(), "pending"); // ?? 'pending' branch
  assertExists(mandate.getCreatedAt()); // ?? new Date() branch
  assertEquals(mandate.getSignature(), undefined); // undefined branch
  assertExists(mandate.getId()); // ?? this.generateUniqueId() branch
});

Deno.test("BaseMandate - all status types (comprehensive)", () => {
  const statuses: Array<"pending" | "authorized" | "captured" | "failed" | "cancelled" | "refunded"> = [
    "pending", "authorized", "captured", "failed", "cancelled", "refunded"
  ];

  for (const status of statuses) {
    const mandate = new TestMandate(validIntentMandate, { status });
    assertEquals(mandate.getStatus(), status);
  }
});

Deno.test("BaseMandate - setStatus method", () => {
  const mandate = new TestMandate(validIntentMandate);

  assertEquals(mandate.getStatus(), "pending");

  mandate.setStatus("authorized");
  assertEquals(mandate.getStatus(), "authorized");

  mandate.setStatus("captured");
  assertEquals(mandate.getStatus(), "captured");
});

Deno.test("BaseMandate - getData method returns a deep copy", () => {
  const mandate = new TestMandate(validIntentMandate);
  const dataCopy = mandate.getData();

  // Intenta mutar la copia
  (dataCopy as any).natural_language_description = "MODIFIED";

  // Vuelve a obtener los datos y comprueba que el original no ha cambiado
  const originalData = mandate.getData();
  assertEquals(originalData.natural_language_description, validIntentMandate.natural_language_description);
});

Deno.test("BaseMandate - getCreatedAt returns a new Date instance", () => {
  const originalDate = new Date();
  const mandate = new TestMandate(validIntentMandate, { createdAt: originalDate });
  const dateCopy = mandate.getCreatedAt();

  // Intenta mutar la copia
  dateCopy.setFullYear(1999);

  // Vuelve a obtener la fecha y comprueba que la original no ha cambiado
  const originalDateFromGetter = mandate.getCreatedAt();
  assertNotEquals(originalDateFromGetter.getFullYear(), 1999);
});

Deno.test("BaseMandate - unique ID generation is consistent and unique", () => {
  // 1. Dos mandatos diferentes deben tener IDs diferentes.
  const mandate1 = new TestMandate({ ...validIntentMandate, natural_language_description: "Mandato A" });
  const mandate2 = new TestMandate({ ...validIntentMandate, natural_language_description: "Mandato B" });
  
  assertNotEquals(mandate1.getId(), mandate2.getId(), "Different mandates should have different IDs");

  // 2. El ID de una instancia debe ser consistente.
  const id1 = mandate1.getId();
  assertEquals(mandate1.getId(), id1, "Calling getId() multiple times should return the same ID");
});

Deno.test("BaseMandate - custom ID provided", () => {
  const customId = "my-custom-id-12345";
  const mandate = new TestMandate(validIntentMandate, { id: customId });

  assertEquals(mandate.getId(), customId);
});

Deno.test("BaseMandate - isSigned method (base implementation)", () => {
  const mandate = new TestMandate(validIntentMandate, { signature: "test-sig" });

  // Base implementation always returns false
  assertEquals(mandate.isSigned(), false);
});

Deno.test("BaseMandate - toJSON method comprehensive", () => {
  const customDate = new Date("2024-01-01T00:00:00Z");
  const mandate = new TestMandate(validIntentMandate, {
    status: "authorized",
    createdAt: customDate,
    signature: "test-signature",
    id: "test-id"
  });

  const json = mandate.toJSON();

  assertEquals(json.id, "test-id");
  assertEquals(json.status, "authorized");
  assertEquals(json.createdAt, customDate.toISOString());
  assertEquals(json.signature, "test-signature");
  assertEquals(json.data, validIntentMandate);
});

Deno.test("BaseMandate - toJSON method without signature", () => {
  const mandate = new TestMandate(validIntentMandate);

  const json = mandate.toJSON();

  assertExists(json.id);
  assertEquals(json.status, "pending");
  assertExists(json.createdAt);
  assertEquals(json.signature, undefined);
  assertEquals(json.data, validIntentMandate);
});