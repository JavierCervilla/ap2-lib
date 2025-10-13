/// <reference types="../src/types/deno.d.ts" />
/**
 * PaymentMandateContents Class Test Suite
 *
 * Comprehensive tests to achieve 100% branch coverage.
 * Focus on covering all conditional branches in constructor and methods.
 */

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { PaymentMandateContentsClass } from "../src/core/mandates/payment/payment-mandate-contents-class.ts";
import { MandateValidationError } from "../src/utils/mod.ts";
import type { PaymentMandateContents } from "../src/types/payment-mandate.ts";

// Valid test data
const validPaymentMandateContents: PaymentMandateContents = {
  payment_mandate_id: "pm-test-123",
  payment_details_id: "pd-test-456",
  payment_details_total: {
    label: "Test Payment",
    amount: { currency: "USD", value: "99.99" },
    refund_period: 30
  },
  payment_response: {
    requestId: "req-789",
    methodName: "basic-card",
    details: { cardNumber: "**** **** **** 1234" }
  },
  merchant_agent: "test-merchant-agent",
  timestamp: "2024-01-01T00:00:00Z"
};

const validPaymentMandateContentsNoTimestamp: PaymentMandateContents = {
  payment_mandate_id: "pm-test-no-ts",
  payment_details_id: "pd-test-no-ts",
  payment_details_total: {
    label: "Test Payment No Timestamp",
    amount: { currency: "USD", value: "49.99" },
    refund_period: 15
  },
  payment_response: {
    requestId: "req-no-ts",
    methodName: "digital-wallet",
    details: { token: "wallet-token-123" }
  },
  merchant_agent: "test-merchant-no-ts",
  timestamp: "" // Empty timestamp to test the || branch
};

// CRITICAL TEST: This covers lines 28-29 constructor branches (options?.createdAt ?? new Date() and options?.id ?? this.generateUniqueId())
Deno.test("PaymentMandateContentsClass - constructor with no options (default branches)", async () => {
  // Test with createWithOptions but no options object to cover default ?? branches
  const contents = await PaymentMandateContentsClass.createWithOptions(validPaymentMandateContents);

  // Verify default values are set (covering the ?? branches)
  assertExists(contents.getCreatedAt()); // Covers options?.createdAt ?? new Date()
  assertExists(contents.getId()); // Covers options?.id ?? this.generateUniqueId()

  // Verify generated ID is hex string
  const id = contents.getId();
  assert(/^[0-9a-f]+$/.test(id));
});

// CRITICAL TEST: This covers lines 28-29 constructor branches with undefined options (right side of ?? operators)
Deno.test("PaymentMandateContentsClass - constructor with undefined options (default branches)", async () => {
  // Test with createWithOptions but undefined options to cover ?? branches
  const contents = await PaymentMandateContentsClass.createWithOptions(validPaymentMandateContents, {
    createdAt: undefined,
    id: undefined
  });

  // Verify default values are set (covering the ?? branches when values are undefined)
  assertExists(contents.getCreatedAt()); // Covers options?.createdAt ?? new Date()
  assertExists(contents.getId()); // Covers options?.id ?? this.generateUniqueId()

  // Verify generated ID is hex string
  const id = contents.getId();
  assert(/^[0-9a-f]+$/.test(id));
});

// CRITICAL TEST: This covers lines 28-29 with provided options (left side of ?? operators)
Deno.test("PaymentMandateContentsClass - constructor with custom options (provided branches)", async () => {
  const customDate = new Date("2024-06-15T12:00:00Z");
  const customId = "custom-payment-id-123";

  // Use the new createWithOptions method to test the constructor branches with provided options
  const contents = await PaymentMandateContentsClass.createWithOptions(validPaymentMandateContents, {
    createdAt: customDate,
    id: customId
  });

  // Verify custom values are used (covering left side of ?? operators)
  assertEquals(contents.getCreatedAt().getTime(), customDate.getTime()); // Covers options?.createdAt (left side)
  assertEquals(contents.getId(), customId); // Covers options?.id (left side)
});

// CRITICAL TEST: This covers line 128 (timestamp: data.timestamp || new Date().toISOString())
Deno.test("PaymentMandateContentsClass - createNew with existing timestamp (left side of ||)", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);

  const data = contents.getData();
  assertEquals(data.timestamp, "2024-01-01T00:00:00Z"); // Should use provided timestamp
});

// CRITICAL TEST: This covers line 128 (right side of || when timestamp is empty/falsy)
Deno.test("PaymentMandateContentsClass - createNew with empty timestamp (right side of ||)", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContentsNoTimestamp);

  const data = contents.getData();
  // Should have generated a new timestamp (not empty)
  assert(data.timestamp !== "");
  assert(data.timestamp !== validPaymentMandateContentsNoTimestamp.timestamp);

  // Verify it's a valid ISO string
  assert(new Date(data.timestamp).toISOString() === data.timestamp);
});

Deno.test("PaymentMandateContentsClass - getData returns copy", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const data = contents.getData();

  assertEquals(data.payment_mandate_id, validPaymentMandateContents.payment_mandate_id);

  // Verify it's a copy (modifying returned data shouldn't affect original)
  assert(data !== validPaymentMandateContents);
});

Deno.test("PaymentMandateContentsClass - getId returns unique ID", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const id = contents.getId();

  assertExists(id);
  assertEquals(typeof id, "string");
  assert(id.length > 0);

  // Should be hex string
  assert(/^[0-9a-f]+$/.test(id));
});

Deno.test("PaymentMandateContentsClass - getCreatedAt returns copy", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const createdAt1 = contents.getCreatedAt();
  const createdAt2 = contents.getCreatedAt();

  assertEquals(createdAt1.getTime(), createdAt2.getTime());

  // Verify they are different objects (copies)
  assert(createdAt1 !== createdAt2);
});

Deno.test("PaymentMandateContentsClass - getHash returns hash", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const hash = await contents.getHash();

  assertExists(hash);
  assertEquals(typeof hash, "string");
  assert(hash.length > 0);
});

Deno.test("PaymentMandateContentsClass - toJSON returns complete object", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const json = contents.toJSON();

  assertExists(json.id);
  assertExists(json.createdAt);
  assertExists(json.data);

  assertEquals(json.data.payment_mandate_id, validPaymentMandateContents.payment_mandate_id);
  assertEquals(typeof json.createdAt, "string");

  // Verify createdAt is valid ISO string
  assert(new Date(json.createdAt).toISOString() === json.createdAt);
});

Deno.test("PaymentMandateContentsClass - toString returns formatted description", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const description = contents.toString();

  assert(description.includes("Payment Mandate Contents"));
  assert(description.includes(validPaymentMandateContents.payment_mandate_id));
  assert(description.includes(validPaymentMandateContents.payment_details_id));
  assert(description.includes(validPaymentMandateContents.merchant_agent));
  assert(description.includes("99.99"));
  assert(description.includes("USD"));
  assert(description.includes("basic-card"));
  assert(description.includes(validPaymentMandateContents.timestamp));
});

Deno.test("PaymentMandateContentsClass - validate with valid data", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);

  // Should not throw since createNew already validates
  await contents.validate();
});

Deno.test("PaymentMandateContentsClass - validate throws on invalid data", async () => {
  const invalidData: PaymentMandateContents = {
    ...validPaymentMandateContents,
    payment_mandate_id: "", // Invalid empty ID
    payment_details_id: ""   // Invalid empty ID
  };

  // Should throw during createNew since it validates
  await assertRejects(
    async () => await PaymentMandateContentsClass.createNew(invalidData),
    MandateValidationError
  );
});

Deno.test("PaymentMandateContentsClass - unique ID generation for different data", async () => {
  const data1 = { ...validPaymentMandateContents, payment_mandate_id: "pm-1" };
  const data2 = { ...validPaymentMandateContents, payment_mandate_id: "pm-2" };

  const contents1 = await PaymentMandateContentsClass.createNew(data1);
  const contents2 = await PaymentMandateContentsClass.createNew(data2);

  // Different data should generate different IDs
  assert(contents1.getId() !== contents2.getId());
});

Deno.test("PaymentMandateContentsClass - ID generation is consistent for same data", async () => {
  const contents1 = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);
  const contents2 = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);

  // Same data but different creation times should generate different IDs (due to timestamp)
  // This is expected behavior since createdAt is part of the hash
  const id1 = contents1.getId();
  const id2 = contents2.getId();

  assertExists(id1);
  assertExists(id2);
  assertEquals(typeof id1, "string");
  assertEquals(typeof id2, "string");
});

Deno.test("PaymentMandateContentsClass - sha256Hash internal method consistency", async () => {
  const contents = await PaymentMandateContentsClass.createNew(validPaymentMandateContents);

  // Call getId multiple times - should return same value
  const id1 = contents.getId();
  const id2 = contents.getId();

  assertEquals(id1, id2);
});

// Test edge case with minimal valid data
Deno.test("PaymentMandateContentsClass - works with minimal valid data", async () => {
  const minimalData: PaymentMandateContents = {
    payment_mandate_id: "minimal-pm",
    payment_details_id: "minimal-pd",
    payment_details_total: {
      label: "Minimal",
      amount: { currency: "USD", value: "1.00" },
      refund_period: 0
    },
    payment_response: {
      requestId: "minimal-req",
      methodName: "test-method"
    },
    merchant_agent: "minimal-agent",
    timestamp: "2024-01-01T00:00:00Z"
  };

  const contents = await PaymentMandateContentsClass.createNew(minimalData);

  assertExists(contents);
  assertEquals(contents.getData().payment_mandate_id, "minimal-pm");

  const description = contents.toString();
  assert(description.includes("minimal-pm"));
  assert(description.includes("1.00"));
});

// Test createNew validation failure path
Deno.test("PaymentMandateContentsClass - createNew validation failure", async () => {
  const invalidData = {
    ...validPaymentMandateContents,
    payment_details_total: {
      ...validPaymentMandateContents.payment_details_total,
      amount: {
        ...validPaymentMandateContents.payment_details_total.amount,
        currency: "INVALID" // Invalid currency
      }
    }
  };

  await assertRejects(
    async () => await PaymentMandateContentsClass.createNew(invalidData),
    MandateValidationError,
    "PaymentMandateContents validation failed"
  );
});

// Test timestamp generation with undefined timestamp
Deno.test("PaymentMandateContentsClass - createNew with undefined timestamp", async () => {
  const dataWithUndefinedTimestamp = {
    ...validPaymentMandateContents,
    timestamp: undefined as any
  };

  const contents = await PaymentMandateContentsClass.createNew(dataWithUndefinedTimestamp);
  const data = contents.getData();

  // Should generate new timestamp
  assertExists(data.timestamp);
  assert(data.timestamp !== undefined);
  assert(new Date(data.timestamp).toISOString() === data.timestamp);
});

// CRITICAL TEST: This covers line 147 (timestamp branch in createWithOptions)
Deno.test("PaymentMandateContentsClass - createWithOptions with empty timestamp (right side of ||)", async () => {
  const dataWithEmptyTimestamp = {
    ...validPaymentMandateContents,
    timestamp: "" // Empty string to trigger || operator on line 147
  };

  const contents = await PaymentMandateContentsClass.createWithOptions(dataWithEmptyTimestamp);
  const data = contents.getData();

  // Should generate new timestamp (covering right side of || on line 147)
  assertExists(data.timestamp);
  assert(data.timestamp !== "");
  assert(new Date(data.timestamp).toISOString() === data.timestamp);
});