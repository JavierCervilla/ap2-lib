 
/**
 * IntentMandate Validator Test Suite
 *
 * Comprehensive tests for IntentMandateValidator to achieve 100% branch coverage.
 * Focus on covering all conditional branches and edge cases.
 */

import { assert, assertEquals, assertExists } from "./test_helper.ts";
import { IntentMandateValidator } from "../src/core/mandates/intent/mod.ts";
import { type ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../src/core/config/validation-config.ts";
import type { IntentMandate } from "../src/types/mod.ts";

// Valid test data
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2026-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
  merchants: ["coffee-store.com"],
  requires_refundability: true
};

const expiredIntentMandate: IntentMandate = {
  natural_language_description: "Buy expired item",
  intent_expiry: "2020-01-01T00:00:00Z", // Expired date
  user_cart_confirmation_required: false,
  merchants: ["expired-store.com"],
  requires_refundability: false
};

// Custom validation config for testing
const customConfig: ValidationConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  strings: {
    ...DEFAULT_VALIDATION_CONFIG.strings,
    allowWhitespaceOnly: true
  }
};

Deno.test("IntentMandateValidator - constructor with default config", () => {
  const validator = new IntentMandateValidator();
  assertExists(validator);
});

Deno.test("IntentMandateValidator - constructor with custom config", () => {
  const validator = new IntentMandateValidator(customConfig);
  assertExists(validator);
});

Deno.test("IntentMandateValidator - validate valid IntentMandate", async () => {
  const validator = new IntentMandateValidator();
  const result = await validator.validate(validIntentMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("IntentMandateValidator - validate IntentMandate with validation errors", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate: IntentMandate = {
    ...validIntentMandate,
    natural_language_description: "", // Empty description should fail
    intent_expiry: "invalid-date" // Invalid date format
  };

  const result = await validator.validate(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

Deno.test("IntentMandateValidator - validateIntegrity valid IntentMandate", async () => {
  const validator = new IntentMandateValidator();
  const result = await validator.validateIntegrity(validIntentMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

// CRITICAL TEST: This covers branch lines 69-71 (missing natural_language_description)
Deno.test("IntentMandateValidator - validateIntegrity missing natural_language_description", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    natural_language_description: undefined // Missing required field
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("natural_language_description")));
});

// CRITICAL TEST: This covers branch lines 69-71 (empty natural_language_description)
Deno.test("IntentMandateValidator - validateIntegrity empty natural_language_description", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate: IntentMandate = {
    ...validIntentMandate,
    natural_language_description: "" // Empty string
  };

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("natural_language_description")));
});

// CRITICAL TEST: This covers branch lines 69-71 (null natural_language_description)
Deno.test("IntentMandateValidator - validateIntegrity null natural_language_description", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    natural_language_description: null
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("natural_language_description")));
});

// CRITICAL TEST: This covers branch lines 73-75 (missing intent_expiry)
Deno.test("IntentMandateValidator - validateIntegrity missing intent_expiry", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    intent_expiry: undefined // Missing required field
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("intent_expiry")));
});

// CRITICAL TEST: This covers branch lines 73-75 (empty intent_expiry)
Deno.test("IntentMandateValidator - validateIntegrity empty intent_expiry", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    intent_expiry: "" // Empty string
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("intent_expiry")));
});

// CRITICAL TEST: This covers branch lines 73-75 (null intent_expiry)
Deno.test("IntentMandateValidator - validateIntegrity null intent_expiry", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    intent_expiry: null
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("intent_expiry")));
});

// CRITICAL TEST: This covers both branches (lines 69-75) - missing both fields
Deno.test("IntentMandateValidator - validateIntegrity missing both required fields", async () => {
  const validator = new IntentMandateValidator();
  const invalidMandate = {
    ...validIntentMandate,
    natural_language_description: undefined,
    intent_expiry: undefined
  } as unknown as IntentMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assertEquals(result.errors.length, 2); // Should have both errors
  assert(result.errors.some(error => error.includes("natural_language_description")));
  assert(result.errors.some(error => error.includes("intent_expiry")));
});

Deno.test("IntentMandateValidator - checkExpiry valid IntentMandate", async () => {
  const validator = new IntentMandateValidator();
  const currentDate = new Date("2024-01-01T00:00:00Z");

  const isExpired = await validator.checkExpiry(validIntentMandate, currentDate);

  assertEquals(isExpired, false); // Should not be expired
});

Deno.test("IntentMandateValidator - checkExpiry expired IntentMandate", async () => {
  const validator = new IntentMandateValidator();
  const currentDate = new Date("2024-01-01T00:00:00Z");

  const isExpired = await validator.checkExpiry(expiredIntentMandate, currentDate);

  assertEquals(isExpired, true); // Should be expired
});

Deno.test("IntentMandateValidator - checkExpiry with default date", async () => {
  const validator = new IntentMandateValidator();

  // Should use current date if not provided
  const isExpired = await validator.checkExpiry(expiredIntentMandate);

  assertEquals(isExpired, true); // Should be expired against current date
});

Deno.test("IntentMandateValidator - withConfig static method", () => {
  const validator = IntentMandateValidator.withConfig(customConfig);

  assertExists(validator);
  assert(validator instanceof IntentMandateValidator);
});

Deno.test("IntentMandateValidator - static validate method", async () => {
  const result = await IntentMandateValidator.validate(validIntentMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("IntentMandateValidator - static validate with invalid mandate", async () => {
  const invalidMandate: IntentMandate = {
    ...validIntentMandate,
    natural_language_description: "", // Invalid
    intent_expiry: "invalid-date" // Invalid
  };

  const result = await IntentMandateValidator.validate(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

// CRITICAL TEST: This covers lines 104-106 (static validateIntegrity method)
Deno.test("IntentMandateValidator - static validateIntegrity method", async () => {
  const result = await IntentMandateValidator.validateIntegrity(validIntentMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

// CRITICAL TEST: This covers lines 104-106 with invalid mandate
Deno.test("IntentMandateValidator - static validateIntegrity with invalid mandate", async () => {
  const invalidMandate = {
    ...validIntentMandate,
    natural_language_description: undefined,
    intent_expiry: undefined
  } as unknown as IntentMandate;

  const result = await IntentMandateValidator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assertEquals(result.errors.length, 2);
});

// CRITICAL TEST: This covers lines 111-113 (static checkExpiry method)
Deno.test("IntentMandateValidator - static checkExpiry method", async () => {
  const currentDate = new Date("2024-01-01T00:00:00Z");
  const isExpired = await IntentMandateValidator.checkExpiry(validIntentMandate, currentDate);

  assertEquals(isExpired, false);
});

// CRITICAL TEST: This covers lines 111-113 with expired mandate
Deno.test("IntentMandateValidator - static checkExpiry with expired mandate", async () => {
  const currentDate = new Date("2024-01-01T00:00:00Z");
  const isExpired = await IntentMandateValidator.checkExpiry(expiredIntentMandate, currentDate);

  assertEquals(isExpired, true);
});

// CRITICAL TEST: This covers lines 111-113 with default date
Deno.test("IntentMandateValidator - static checkExpiry with default date", async () => {
  // Should use current date when not provided
  const isExpired = await IntentMandateValidator.checkExpiry(expiredIntentMandate);

  assertEquals(isExpired, true); // Expired mandate should be expired against current date
});

// Test edge cases that might affect branch coverage
Deno.test("IntentMandateValidator - validateIntegrity with partial invalid data", async () => {
  const validator = new IntentMandateValidator();

  // Test with only natural_language_description missing
  const onlyDescMissing = {
    ...validIntentMandate,
    natural_language_description: ""
  };

  const result1 = await validator.validateIntegrity(onlyDescMissing);
  assertEquals(result1.isValid, false);
  assertEquals(result1.errors.length, 1);

  // Test with only intent_expiry missing
  const onlyExpiryMissing = {
    ...validIntentMandate,
    intent_expiry: ""
  };

  const result2 = await validator.validateIntegrity(onlyExpiryMissing);
  assertEquals(result2.isValid, false);
  assertEquals(result2.errors.length, 1);
});