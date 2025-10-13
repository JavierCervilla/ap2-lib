/**
 * CartMandate Validator Test Suite
 *
 * Comprehensive tests for CartMandateValidator to achieve 100% coverage.
 * Tests validation, integrity checking, and expiry checking.
 */

import { assert, assertEquals, assertExists } from "./test_helper.ts";
import { CartMandateValidator } from "../src/core/mandates/cart/mod.ts";
import { type ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../src/core/config/validation-config.ts";
import type { CartMandate, CartContents } from "../src/types/mod.ts";

// Valid test data
const validCartContents: CartContents = {
  id: "cart-test-123",
  merchant_name: "Test Coffee Store",
  cart_expiry: "2026-12-31T23:59:59Z",
  payment_request: {
    id: "payment-req-456",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Test Total",
        amount: { currency: "USD", value: "29.99" },
        refund_period: 30
      }
    }
  },
  user_cart_confirmation_required: true
};

const validCartMandate: CartMandate = {
  contents: validCartContents
};

const validCartMandateWithAuth: CartMandate = {
  contents: validCartContents,
  merchant_authorization: "mock.jwt.signature"
};

const expiredCartContents: CartContents = {
  id: "cart-expired-123",
  merchant_name: "Expired Store",
  cart_expiry: "2020-01-01T00:00:00Z", // Expired date
  payment_request: {
    id: "payment-req-expired",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Expired Total",
        amount: { currency: "USD", value: "19.99" },
        refund_period: 30
      }
    }
  },
  user_cart_confirmation_required: false
};

const expiredCartMandate: CartMandate = {
  contents: expiredCartContents
};

// Custom validation config for testing
const customConfig: ValidationConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  strings: {
    ...DEFAULT_VALIDATION_CONFIG.strings,
    allowWhitespaceOnly: true
  }
};

Deno.test("CartMandateValidator - constructor with default config", () => {
  const validator = new CartMandateValidator();
  assertExists(validator);
});

Deno.test("CartMandateValidator - constructor with custom config", () => {
  const validator = new CartMandateValidator(customConfig);
  assertExists(validator);
});

Deno.test("CartMandateValidator - validate valid CartMandate", async () => {
  const validator = new CartMandateValidator();
  const result = await validator.validate(validCartMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("CartMandateValidator - validate CartMandate with auth", async () => {
  const validator = new CartMandateValidator();
  const result = await validator.validate(validCartMandateWithAuth);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("CartMandateValidator - validate CartMandate with invalid contents", async () => {
  const validator = new CartMandateValidator();
  const invalidMandate: CartMandate = {
    contents: {
      ...validCartContents,
      id: "", // Invalid empty ID
      merchant_name: "" // Invalid empty merchant name
    }
  };

  const result = await validator.validate(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

Deno.test("CartMandateValidator - validateIntegrity valid CartMandate", async () => {
  const validator = new CartMandateValidator();
  const result = await validator.validateIntegrity(validCartMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("CartMandateValidator - validateIntegrity missing contents", async () => {
  const validator = new CartMandateValidator();
  const invalidMandate = {
    contents: null
  } as unknown as CartMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
  assert(result.errors.some(error => error.includes("required field 'contents' is missing")));
});

Deno.test("CartMandateValidator - validateIntegrity with contents validation errors", async () => {
  const validator = new CartMandateValidator();
  const invalidMandate: CartMandate = {
    contents: {
      ...validCartContents,
      id: "", // This will cause contents validation to fail
      merchant_name: ""
    }
  };

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

Deno.test("CartMandateValidator - checkExpiry valid CartMandate", async () => {
  const validator = new CartMandateValidator();
  const currentDate = new Date("2024-01-01T00:00:00Z");

  const isExpired = await validator.checkExpiry(validCartMandate, currentDate);

  assertEquals(isExpired, false); // Should not be expired
});

Deno.test("CartMandateValidator - checkExpiry expired CartMandate", async () => {
  const validator = new CartMandateValidator();
  const currentDate = new Date("2024-01-01T00:00:00Z");

  const isExpired = await validator.checkExpiry(expiredCartMandate, currentDate);

  assertEquals(isExpired, true); // Should be expired
});

Deno.test("CartMandateValidator - checkExpiry with default date", async () => {
  const validator = new CartMandateValidator();

  // Should use current date if not provided
  const isExpired = await validator.checkExpiry(expiredCartMandate);

  assertEquals(isExpired, true); // Should be expired against current date
});

Deno.test("CartMandateValidator - withConfig static method", () => {
  const validator = CartMandateValidator.withConfig(customConfig);

  assertExists(validator);
  assert(validator instanceof CartMandateValidator);
});

Deno.test("CartMandateValidator - static validate method", async () => {
  const result = await CartMandateValidator.validate(validCartMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("CartMandateValidator - static validate with invalid mandate", async () => {
  const invalidMandate: CartMandate = {
    contents: {
      ...validCartContents,
      id: "", // Invalid
      merchant_name: "" // Invalid
    }
  };

  const result = await CartMandateValidator.validate(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

Deno.test("CartMandateValidator - static validateIntegrity method", async () => {
  const result = await CartMandateValidator.validateIntegrity(validCartMandate);

  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("CartMandateValidator - static validateIntegrity with missing contents", async () => {
  const invalidMandate = {
    contents: null
  } as unknown as CartMandate;

  const result = await CartMandateValidator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assert(result.errors.length > 0);
});

Deno.test("CartMandateValidator - static checkExpiry method", async () => {
  const currentDate = new Date("2024-01-01T00:00:00Z");
  const isExpired = await CartMandateValidator.checkExpiry(validCartMandate, currentDate);

  assertEquals(isExpired, false);
});

Deno.test("CartMandateValidator - static checkExpiry with expired mandate", async () => {
  const currentDate = new Date("2024-01-01T00:00:00Z");
  const isExpired = await CartMandateValidator.checkExpiry(expiredCartMandate, currentDate);

  assertEquals(isExpired, true);
});

Deno.test("CartMandateValidator - static checkExpiry with default date", async () => {
  // Should use current date when not provided
  const isExpired = await CartMandateValidator.checkExpiry(expiredCartMandate);

  assertEquals(isExpired, true); // Expired mandate should be expired against current date
});

Deno.test("CartMandateValidator - validateIntegrity returns early on missing contents", async () => {
  const validator = new CartMandateValidator();
  const invalidMandate = {
    contents: undefined
  } as unknown as CartMandate;

  const result = await validator.validateIntegrity(invalidMandate);

  assertEquals(result.isValid, false);
  assertEquals(result.errors.length, 1);
  assert(result.errors[0].includes("required field 'contents' is missing"));
});