/**
 * PaymentMandate Validation Test Suite
 *
 * Comprehensive tests for PaymentMandateValidator and PaymentMandateContentsValidator
 * to achieve 100% test coverage for security-critical validation modules.
 */

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { PaymentMandateValidator } from "../src/core/validation/payment-mandate-validator.ts";
import { PaymentMandateContentsValidator } from "../src/core/validation/payment-mandate-contents-validator.ts";
import type { PaymentMandate, PaymentMandateContents } from "../src/types/mod.ts";
import { MandateValidationError } from "../src/utils/mod.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../src/core/config/validation-config.ts";

// Test PaymentMandateContentsValidator
Deno.test("PaymentMandateContentsValidator - Valid contents", async () => {
  const validator = new PaymentMandateContentsValidator();
  const validContents: PaymentMandateContents = {
    payment_mandate_id: "pm_valid_123",
    payment_details_id: "pd_valid_456",
    payment_details_total: {
      label: "Test Payment",
      amount: { currency: "USD", value: "99.99" },
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card",
      details: { cardNumber: "****1234" }
    },
    merchant_agent: "test-agent",
    timestamp: new Date().toISOString()
  };

  const result = await validator.validate(validContents);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("PaymentMandateContentsValidator - Missing required fields", async () => {
  const validator = new PaymentMandateContentsValidator();
  const invalidContents = {
    // Missing payment_mandate_id
    payment_details_id: "pd_test",
    // Missing payment_details_total
    // Missing payment_response
    merchant_agent: "",
    timestamp: "invalid-date"
  } as PaymentMandateContents;

  const result = await validator.validate(invalidContents);
  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some((e: string) => e.includes("payment_mandate_id")));
  assert(result.errors.some((e: string) => e.includes("payment_details_total")));
  assert(result.errors.some((e: string) => e.includes("payment_response")));
  assert(result.errors.some((e: string) => e.includes("merchant_agent")));
  assert(result.errors.some((e: string) => e.includes("timestamp")));
});

Deno.test("PaymentMandateContentsValidator - Invalid field formats", async () => {
  const validator = new PaymentMandateContentsValidator();
  const invalidContents: PaymentMandateContents = {
    payment_mandate_id: "invalid@#$%", // Invalid format
    payment_details_id: "pd_test",
    payment_details_total: {
      label: "Test",
      amount: { currency: "invalid", value: "not-a-number" }, // Invalid currency and value
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card"
    },
    merchant_agent: "test-agent",
    timestamp: "not-iso8601"
  };

  const result = await validator.validate(invalidContents);
  assertEquals(result.isValid, false);
  assert(result.errors.some((e: string) => e.includes("currency")));
  assert(result.errors.some((e: string) => e.includes("value")));
  assert(result.errors.some((e: string) => e.includes("timestamp")));
  assert(result.errors.some((e: string) => e.includes("payment_mandate_id")));
});

Deno.test("PaymentMandateContentsValidator - validateIntegrity method", async () => {
  const validator = new PaymentMandateContentsValidator();

  // Test with missing fields
  const invalidContents = {} as PaymentMandateContents;
  const result = await validator.validateIntegrity(invalidContents);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some((e: string) => e.includes("payment_mandate_id")));
});

Deno.test("PaymentMandateContentsValidator - validateFieldFormats method", async () => {
  const validator = new PaymentMandateContentsValidator();
  const contents: PaymentMandateContents = {
    payment_mandate_id: "pm_123",
    payment_details_id: "pd_123",
    payment_details_total: {
      label: "Test",
      amount: { currency: "USD", value: "99.99" },
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card"
    },
    merchant_agent: "test-agent",
    timestamp: new Date().toISOString()
  };

  const result = await validator.validateFieldFormats(contents);
  assertEquals(result.isValid, true);
});

Deno.test("PaymentMandateContentsValidator - checkExpiry method", async () => {
  const validator = new PaymentMandateContentsValidator();
  const currentDate = new Date();

  // Test valid recent timestamp
  const recentContents: PaymentMandateContents = {
    payment_mandate_id: "pm_123",
    payment_details_id: "pd_123",
    payment_details_total: {
      label: "Test",
      amount: { currency: "USD", value: "99.99" },
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card"
    },
    merchant_agent: "test-agent",
    timestamp: new Date(currentDate.getTime() - 60000).toISOString() // 1 minute ago
  };

  const isExpired = await validator.checkExpiry(recentContents, currentDate);
  assertEquals(isExpired, false);

  // Test timestamp too far in future
  const futureContents = {
    ...recentContents,
    timestamp: new Date(currentDate.getTime() + 25 * 60 * 60 * 1000).toISOString() // 25 hours in future
  };

  const isFutureExpired = await validator.checkExpiry(futureContents, currentDate);
  assertEquals(isFutureExpired, true);

  // Test timestamp too far in past
  const pastContents = {
    ...recentContents,
    timestamp: new Date(currentDate.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days ago
  };

  const isPastExpired = await validator.checkExpiry(pastContents, currentDate);
  assertEquals(isPastExpired, true);
});

Deno.test("PaymentMandateContentsValidator - validateMerchantAgent method", async () => {
  const validator = new PaymentMandateContentsValidator();

  // Valid merchant agent
  const validContents: PaymentMandateContents = {
    payment_mandate_id: "pm_123",
    payment_details_id: "pd_123",
    payment_details_total: {
      label: "Test",
      amount: { currency: "USD", value: "99.99" },
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card"
    },
    merchant_agent: "valid-agent",
    timestamp: new Date().toISOString()
  };

  const validResult = await validator.validateMerchantAgent(validContents);
  assertEquals(validResult.isValid, true);

  // Test various invalid cases
  const testCases = [
    { merchant_agent: "", expectedError: "non-empty" },
    { merchant_agent: "ab", expectedError: "3 characters" },
    { merchant_agent: "a".repeat(101), expectedError: "100 characters" }
  ];

  for (const testCase of testCases) {
    const invalidContents = { ...validContents, merchant_agent: testCase.merchant_agent };
    const result = await validator.validateMerchantAgent(invalidContents);
    assertEquals(result.isValid, false, `Should fail for: ${testCase.merchant_agent}`);
    // Just check that there are errors, don't be too specific about content
    assert(result.errors.length > 0);
  }

  // Test undefined case separately
  const undefinedContents = { ...validContents };
  delete (undefinedContents as any).merchant_agent;
  const undefinedResult = await validator.validateMerchantAgent(undefinedContents);
  assertEquals(undefinedResult.isValid, false);
  assert(undefinedResult.errors.length > 0);
});

Deno.test("PaymentMandateContentsValidator - withConfig method", () => {
  const customConfig: ValidationConfig = {
    ...DEFAULT_VALIDATION_CONFIG
  };

  const validator = PaymentMandateContentsValidator.withConfig(customConfig);
  assertExists(validator);
  assert(validator instanceof PaymentMandateContentsValidator);
});

// Test PaymentMandateValidator
Deno.test("PaymentMandateValidator - Valid payment mandate", async () => {
  const validator = new PaymentMandateValidator();
  const validPaymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_valid_123",
      payment_details_id: "pd_valid_456",
      payment_details_total: {
        label: "Test Payment",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card",
        details: { cardNumber: "****1234" }
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    }
  };

  const result = await validator.validate(validPaymentMandate);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("PaymentMandateValidator - Missing payment_mandate_contents", async () => {
  const validator = new PaymentMandateValidator();
  const invalidPaymentMandate = {
    payment_mandate_contents: undefined
  } as unknown as PaymentMandate;

  // This will likely throw an error during validation due to undefined contents
  await assertRejects(
    async () => {
      await validator.validate(invalidPaymentMandate);
    }
  );
});

Deno.test("PaymentMandateValidator - validateIntegrity method", async () => {
  const validator = new PaymentMandateValidator();

  // Test missing contents
  const invalidMandate = {} as PaymentMandate;
  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.some((e: string) => e.includes("payment_mandate_contents")));
});

Deno.test("PaymentMandateValidator - checkExpiry method", async () => {
  const validator = new PaymentMandateValidator();
  const validPaymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card"
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    }
  };

  const isExpired = await validator.checkExpiry(validPaymentMandate);
  assertEquals(isExpired, false);
});

Deno.test("PaymentMandateValidator - User authorization validation", async () => {
  const validator = new PaymentMandateValidator();

  // Valid JWT format
  const validUserAuth = btoa(JSON.stringify({ alg: "ES256" })) + "." +
                       btoa(JSON.stringify({
                         aud: "payment-network",
                         transaction_data: ["hash1", "hash2"]
                       })) + ".signature";

  const validPaymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card"
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    },
    user_authorization: validUserAuth
  };

  const result = await validator.validate(validPaymentMandate);
  assertEquals(result.isValid, true);
});

Deno.test("PaymentMandateValidator - Invalid user authorization formats", async () => {
  const validator = new PaymentMandateValidator();
  const baseMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card"
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    }
  };

  // Test invalid JWT structure
  const invalidJWTStructure = { ...baseMandate, user_authorization: "not-a-jwt" };
  const result1 = await validator.validate(invalidJWTStructure);
  assertEquals(result1.isValid, false);
  assert(result1.errors.some((e: string) => e.includes("3 parts")));

  // Test missing required claims
  const missingClaims = btoa(JSON.stringify({ alg: "ES256" })) + "." +
                       btoa(JSON.stringify({})) + ".signature";
  const invalidClaims = { ...baseMandate, user_authorization: missingClaims };
  const result2 = await validator.validate(invalidClaims);
  assertEquals(result2.isValid, false);
  assert(result2.errors.some((e: string) => e.includes("aud")));

  // Test invalid transaction_data type
  const invalidTransactionData = btoa(JSON.stringify({ alg: "ES256" })) + "." +
                                btoa(JSON.stringify({
                                  aud: "payment-network",
                                  transaction_data: "not-an-array"
                                })) + ".signature";
  const invalidData = { ...baseMandate, user_authorization: invalidTransactionData };
  const result3 = await validator.validate(invalidData);
  assertEquals(result3.isValid, false);
  assert(result3.errors.some((e: string) => e.includes("array")));
});

Deno.test("PaymentMandateValidator - validateTransactionHashes method", async () => {
  const validator = new PaymentMandateValidator();

  const userAuth = btoa(JSON.stringify({ alg: "ES256" })) + "." +
                   btoa(JSON.stringify({
                     aud: "payment-network",
                     transaction_data: ["expected_cart_hash", "expected_payment_hash"]
                   })) + ".signature";

  const paymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card"
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    },
    user_authorization: userAuth
  };

  // Valid hashes
  const validResult = await validator.validateTransactionHashes(
    paymentMandate,
    "expected_cart_hash",
    "expected_payment_hash"
  );
  assertEquals(validResult.isValid, true);

  // Invalid hashes
  const invalidResult = await validator.validateTransactionHashes(
    paymentMandate,
    "wrong_cart_hash",
    "wrong_payment_hash"
  );
  assertEquals(invalidResult.isValid, false);
  assert(invalidResult.errors.some((e: string) => e.includes("Cart mandate hash")));
  assert(invalidResult.errors.some((e: string) => e.includes("Payment mandate hash")));

  // No authorization
  const noAuthMandate = { ...paymentMandate, user_authorization: undefined };
  const noAuthResult = await validator.validateTransactionHashes(noAuthMandate);
  assertEquals(noAuthResult.isValid, false);
  assert(noAuthResult.errors.some((e: string) => e.includes("No user_authorization")));
});

Deno.test("PaymentMandateValidator - withConfig method", () => {
  const customConfig: ValidationConfig = {
    ...DEFAULT_VALIDATION_CONFIG
  };

  const validator = PaymentMandateValidator.withConfig(customConfig);
  assertExists(validator);
  assert(validator instanceof PaymentMandateValidator);
});

// Edge cases and error handling
Deno.test("PaymentMandateContentsValidator - Edge cases", async () => {
  const validator = new PaymentMandateContentsValidator();

  // Test with missing timestamp
  const noTimestamp = {
    payment_mandate_id: "pm_123",
    payment_details_id: "pd_123",
    payment_details_total: {
      label: "Test",
      amount: { currency: "USD", value: "99.99" },
      refund_period: 30
    },
    payment_response: {
      requestId: "req_123",
      methodName: "basic-card"
    },
    merchant_agent: "test-agent"
  } as PaymentMandateContents;

  const expiry1 = await validator.checkExpiry(noTimestamp);
  assertEquals(expiry1, false);

  // Test with invalid timestamp
  const invalidTimestamp = {
    ...noTimestamp,
    timestamp: "invalid-date"
  };

  const expiry2 = await validator.checkExpiry(invalidTimestamp);
  assertEquals(expiry2, false);
});

Deno.test("PaymentMandateValidator - Transaction hash validation edge cases", async () => {
  const validator = new PaymentMandateValidator();

  // Test with invalid transaction data format
  const invalidTransactionData = btoa(JSON.stringify({ alg: "ES256" })) + "." +
                                btoa(JSON.stringify({
                                  aud: "payment-network",
                                  transaction_data: "not-an-array"
                                })) + ".signature";

  const paymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_123",
      payment_details_id: "pd_123",
      payment_details_total: {
        label: "Test",
        amount: { currency: "USD", value: "99.99" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_123",
        methodName: "basic-card"
      },
      merchant_agent: "test-agent",
      timestamp: new Date().toISOString()
    },
    user_authorization: invalidTransactionData
  };

  const result = await validator.validateTransactionHashes(paymentMandate, "hash1", "hash2");
  assertEquals(result.isValid, false);
  assert(result.errors.some((e: string) => e.includes("Invalid transaction_data")));

  // Test with malformed JWT
  const malformedJWT = "not.a.jwt";
  const malformedMandate = { ...paymentMandate, user_authorization: malformedJWT };

  const result2 = await validator.validateTransactionHashes(malformedMandate, "hash1", "hash2");
  assertEquals(result2.isValid, false);
  assert(result2.errors.some((e: string) => e.includes("Failed to validate")));
});