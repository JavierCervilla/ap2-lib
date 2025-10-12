/**
 * PaymentMandate Serializer Test Suite
 *
 * Comprehensive tests for PaymentMandateSerializer to achieve 100% coverage.
 * Tests serialization, deserialization, validation, and error handling.
 */

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { PaymentMandateSerializer } from "../src/core/mandates/payment/mod.ts";
import type { PaymentMandate, PaymentMandateContents } from "../src/types/mod.ts";

// Valid test data
const validPaymentMandateContents: PaymentMandateContents = {
  payment_mandate_id: "pm_test_123",
  payment_details_id: "pd_test_456",
  merchant_agent: "test-merchant-agent",
  payment_details_total: {
    label: "Test Payment Total",
    amount: { currency: "USD", value: "99.99" },
    refund_period: 30
  },
  payment_response: {
    requestId: "req_test_789",
    methodName: "basic-card",
    details: { cardNumber: "****1234" }
  },
  timestamp: "2024-01-15T10:00:00.000Z"
};

const validPaymentMandate: PaymentMandate = {
  payment_mandate_contents: validPaymentMandateContents
};

const validPaymentMandateWithAuth: PaymentMandate = {
  payment_mandate_contents: validPaymentMandateContents,
  user_authorization: "mock.jwt.token"
};

Deno.test("PaymentMandateSerializer - serialize valid mandate", async () => {
  const serializer = PaymentMandateSerializer.create();
  const json = await serializer.serialize(validPaymentMandate);

  assertExists(json);
  assert(typeof json === 'string');

  // Verify it's valid JSON
  const parsed = JSON.parse(json);
  assertEquals(parsed.payment_mandate_contents.payment_mandate_id, "pm_test_123");
});

Deno.test("PaymentMandateSerializer - serialize mandate with user authorization", async () => {
  const serializer = PaymentMandateSerializer.create();
  const json = await serializer.serialize(validPaymentMandateWithAuth);

  const parsed = JSON.parse(json);
  assertEquals(parsed.user_authorization, "mock.jwt.token");
  assertEquals(parsed.payment_mandate_contents.payment_mandate_id, "pm_test_123");
});

Deno.test("PaymentMandateSerializer - deserialize valid JSON", async () => {
  const serializer = PaymentMandateSerializer.create();
  const json = JSON.stringify(validPaymentMandate);

  const mandate = await serializer.deserialize(json);

  assertEquals(mandate.payment_mandate_contents.payment_mandate_id, "pm_test_123");
  assertEquals(mandate.payment_mandate_contents.merchant_agent, "test-merchant-agent");
});

Deno.test("PaymentMandateSerializer - deserialize with user authorization", async () => {
  const serializer = PaymentMandateSerializer.create();
  const json = JSON.stringify(validPaymentMandateWithAuth);

  const mandate = await serializer.deserialize(json);

  assertEquals(mandate.user_authorization, "mock.jwt.token");
  assertEquals(mandate.payment_mandate_contents.payment_mandate_id, "pm_test_123");
});

Deno.test("PaymentMandateSerializer - deserialize throws on invalid JSON", async () => {
  const serializer = PaymentMandateSerializer.create();

  await assertRejects(
    () => serializer.deserialize("invalid json"),
    Error,
    "Invalid JSON format"
  );
});

Deno.test("PaymentMandateSerializer - deserialize throws on missing payment_mandate_contents", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidJson = JSON.stringify({ some_other_field: "value" });

  await assertRejects(
    () => serializer.deserialize(invalidJson),
    Error,
    "Missing required field 'payment_mandate_contents'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing payment_mandate_id", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).payment_mandate_id;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'payment_mandate_id'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing payment_details_id", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).payment_details_id;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'payment_details_id'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing merchant_agent", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).merchant_agent;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'merchant_agent'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing payment_details_total", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).payment_details_total;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'payment_details_total'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing payment_response", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).payment_response;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'payment_response'"
  );
});

Deno.test("PaymentMandateSerializer - validateRequiredFields missing timestamp", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidContents = { ...validPaymentMandateContents };
  delete (invalidContents as any).timestamp;

  const invalidMandate = {
    payment_mandate_contents: invalidContents
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field in payment_mandate_contents: 'timestamp'"
  );
});

Deno.test("PaymentMandateSerializer - static create method", () => {
  const serializer = PaymentMandateSerializer.create();
  assertExists(serializer);
  assert(serializer instanceof PaymentMandateSerializer);
});

Deno.test("PaymentMandateSerializer - static serialize method", async () => {
  const json = await PaymentMandateSerializer.serialize(validPaymentMandate);

  assertExists(json);
  assert(typeof json === 'string');

  const parsed = JSON.parse(json);
  assertEquals(parsed.payment_mandate_contents.payment_mandate_id, "pm_test_123");
});

Deno.test("PaymentMandateSerializer - static deserialize method", async () => {
  const json = JSON.stringify(validPaymentMandate);
  const mandate = await PaymentMandateSerializer.deserialize(json);

  assertEquals(mandate.payment_mandate_contents.payment_mandate_id, "pm_test_123");
  assertEquals(mandate.payment_mandate_contents.merchant_agent, "test-merchant-agent");
});

Deno.test("PaymentMandateSerializer - round-trip serialization", async () => {
  const serializer = PaymentMandateSerializer.create();

  // Serialize then deserialize
  const json = await serializer.serialize(validPaymentMandateWithAuth);
  const roundTrip = await serializer.deserialize(json);

  // Should match original
  assertEquals(roundTrip.payment_mandate_contents.payment_mandate_id, validPaymentMandateWithAuth.payment_mandate_contents.payment_mandate_id);
  assertEquals(roundTrip.payment_mandate_contents.merchant_agent, validPaymentMandateWithAuth.payment_mandate_contents.merchant_agent);
  assertEquals(roundTrip.user_authorization, validPaymentMandateWithAuth.user_authorization);
});

Deno.test("PaymentMandateSerializer - validateRequiredFields with no payment_mandate_contents", async () => {
  const serializer = PaymentMandateSerializer.create();
  const invalidMandate = {
    payment_mandate_contents: null
  };

  const json = JSON.stringify(invalidMandate);

  await assertRejects(
    () => serializer.deserialize(json),
    Error,
    "Missing required field 'payment_mandate_contents'"
  );
});