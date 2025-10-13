/**
 * BaseMandate Test Suite (Refactored)
 *
 * Comprehensive tests for BaseMandate, grouped by method for clarity.
 * Focus on covering all conditional branches and optional parameter paths.
 */

import { assertEquals, assertExists, assertNotEquals } from "./test_helper.ts";
import { BaseMandate } from "../src/core/mandates/shared/base-mandate.ts";
import type { IntentMandate } from "../src/types/mod.ts";

// --- Test Setup ---

// Create a concrete implementation for testing the abstract BaseMandate
class TestMandate extends BaseMandate<IntentMandate> {
  constructor(data: IntentMandate, options?: any) {
    super(data, options);
  }

  toString(): string {
    return `TestMandate: ${this._data.natural_language_description}`;
  }

  protected async validate(): Promise<void> {
    if (!this._data.natural_language_description) {
      throw new Error("Missing natural_language_description");
    }
  }
}

// Valid test data used across multiple tests
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2026-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
  merchants: ["coffee-store.com"],
  requires_refundability: true
};


// --- Test Suites ---

Deno.test("BaseMandate.constructor()", async (t) => {
  await t.step("should initialize with default options when none are provided", () => {
    const mandate = new TestMandate(validIntentMandate);
    assertEquals(mandate.getStatus(), "pending");
    assertExists(mandate.getCreatedAt());
    assertEquals(mandate.getSignature(), undefined);
    assertExists(mandate.getId());
  });

  await t.step("should use provided options and fall back to defaults for missing ones", () => {
    const customDate = new Date("2024-01-01T00:00:00Z");
    const mandate = new TestMandate(validIntentMandate, {
      status: "authorized",
      createdAt: customDate,
    });
    assertEquals(mandate.getStatus(), "authorized");
    assertEquals(mandate.getCreatedAt().getTime(), customDate.getTime());
    assertEquals(mandate.getSignature(), undefined);
    assertExists(mandate.getId());
  });

  await t.step("should use all provided options correctly", () => {
    const customDate = new Date("2024-01-01T00:00:00Z");
    const mandate = new TestMandate(validIntentMandate, {
      status: "captured",
      createdAt: customDate,
      signature: "test-signature",
      id: "custom-id-123"
    });
    assertEquals(mandate.getStatus(), "captured");
    assertEquals(mandate.getCreatedAt().getTime(), customDate.getTime());
    assertEquals(mandate.getSignature(), "test-signature");
    assertEquals(mandate.getId(), "custom-id-123");
  });

  await t.step("should use defaults when an empty options object is passed", () => {
    const mandate = new TestMandate(validIntentMandate, {});
    assertEquals(mandate.getStatus(), "pending");
    assertExists(mandate.getCreatedAt());
    assertEquals(mandate.getSignature(), undefined);
    assertExists(mandate.getId());
  });

  await t.step("should accept all valid status types", () => {
    const statuses: Array<"pending" | "authorized" | "captured" | "failed" | "cancelled" | "refunded"> = [
      "pending", "authorized", "captured", "failed", "cancelled", "refunded"
    ];
    for (const status of statuses) {
      const mandate = new TestMandate(validIntentMandate, { status });
      assertEquals(mandate.getStatus(), status);
    }
  });
});

Deno.test("BaseMandate.setStatus()", async (t) => {
  await t.step("should update the mandate's status", () => {
    const mandate = new TestMandate(validIntentMandate);
    assertEquals(mandate.getStatus(), "pending");
    mandate.setStatus("authorized");
    assertEquals(mandate.getStatus(), "authorized");
  });
});

Deno.test("BaseMandate.getData()", async (t) => {
  await t.step("should return a deep copy to ensure immutability", () => {
    const mandate = new TestMandate(validIntentMandate);
    const dataCopy = mandate.getData();
    
    // Attempt to mutate the returned copy
    (dataCopy as any).natural_language_description = "MODIFIED";

    // Verify the original data within the class instance remains unchanged
    const originalData = mandate.getData();
    assertEquals(originalData.natural_language_description, validIntentMandate.natural_language_description);
  });
});

Deno.test("BaseMandate.getCreatedAt()", async (t) => {
  await t.step("should return a new Date instance to ensure immutability", () => {
    const originalDate = new Date();
    const mandate = new TestMandate(validIntentMandate, { createdAt: originalDate });
    const dateCopy = mandate.getCreatedAt();

    // Attempt to mutate the returned copy
    dateCopy.setFullYear(1999);

    // Verify the original date within the class instance remains unchanged
    const originalDateFromGetter = mandate.getCreatedAt();
    assertNotEquals(originalDateFromGetter.getFullYear(), 1999);
  });
});

Deno.test("BaseMandate.getId()", async (t) => {
  await t.step("should return a custom ID if provided", () => {
    const customId = "my-custom-id-12345";
    const mandate = new TestMandate(validIntentMandate, { id: customId });
    assertEquals(mandate.getId(), customId);
  });

  await t.step("should generate a unique and consistent ID if not provided", () => {
    const mandate1 = new TestMandate({ ...validIntentMandate, natural_language_description: "A" });
    const mandate2 = new TestMandate({ ...validIntentMandate, natural_language_description: "B" });
    
    assertNotEquals(mandate1.getId(), mandate2.getId(), "Different mandates should have different IDs");

    const id1 = mandate1.getId();
    assertEquals(mandate1.getId(), id1, "Calling getId() multiple times should return the same ID");
  });
});

Deno.test("BaseMandate.isSigned()", async (t) => {
  await t.step("should return false for the base implementation", () => {
    const mandateWithSig = new TestMandate(validIntentMandate, { signature: "test-sig" });
    const mandateWithoutSig = new TestMandate(validIntentMandate);
    
    assertEquals(mandateWithSig.isSigned(), false);
    assertEquals(mandateWithoutSig.isSigned(), false);
  });
});

Deno.test("BaseMandate.toJSON()", async (t) => {
  await t.step("should serialize all properties including signature", () => {
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

  await t.step("should handle an undefined signature correctly", () => {
    const mandate = new TestMandate(validIntentMandate);
    const json = mandate.toJSON();
    assertExists(json.id);
    assertEquals(json.status, "pending");
    assertExists(json.createdAt);
    assertEquals(json.signature, undefined);
    assertEquals(json.data, validIntentMandate);
  });
});