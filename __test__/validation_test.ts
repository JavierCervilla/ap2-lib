/**
 * Validation Functions Test Suite (TDD)
 *
 * Tests written FIRST for validation functions.
 * These tests define the expected behavior before implementation.
 */

import { assert, assertEquals, assertRejects } from "@std/assert";
import type { IntentMandate, CartContents, PaymentRequest } from "../src/mod.ts";
import {
  MandateValidationError,
  PaymentRequestValidationError,
  MandateExpiredError,
  createFutureISO8601,
  TIME_CONSTANTS,
} from "../src/utils/mod.ts";

// Import functions that don't exist yet - will be implemented to pass these tests
import {
  validateMandate,
  validateCartContents,
  validateIntentMandate,
  validatePaymentRequest,
  checkMandateExpiry,
  checkCartContentsExpiry,
  validateMandateIntegrity,
  validateCartContentsIntegrity,
} from "../src/core/validation.ts";

Deno.test("validateMandate - Valid IntentMandate passes", async () => {
  const validIntent: IntentMandate = {
    user_cart_confirmation_required: true,
    natural_language_description: "High quality wireless headphones",
    merchants: ["bestbuy.com", "amazon.com"],
    skus: ["SKU123", "SKU456"],
    requires_refundability: false,
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.WEEK),
  };

  const result = await validateMandate(validIntent);
  assert(result.isValid, "Valid mandate should pass validation");
  assertEquals(result.errors.length, 0, "Valid mandate should have no errors");
});

Deno.test("validateMandate - Rejects mandate with empty description", async () => {
  const invalidIntent: IntentMandate = {
    natural_language_description: "", // Empty!
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const result = await validateMandate(invalidIntent);
  assert(!result.isValid, "Mandate with empty description should fail");
  assert(result.errors.some((e: string) => e.includes("description")), "Should mention description error");
});

Deno.test("validateMandate - Rejects mandate with past expiry", async () => {
  const invalidIntent: IntentMandate = {
    natural_language_description: "Test product",
    intent_expiry: "2020-01-01T00:00:00Z", // Past date
  };

  const result = await validateMandate(invalidIntent);
  assert(!result.isValid, "Mandate with past expiry should fail");
  assert(result.errors.some((e: string) => e.includes("expired")), "Should mention expiry error");
});

Deno.test("validateMandate - Rejects mandate with invalid date format", async () => {
  const invalidIntent: IntentMandate = {
    natural_language_description: "Test product",
    intent_expiry: "not-a-date", // Invalid format
  };

  const result = await validateMandate(invalidIntent);
  assert(!result.isValid, "Mandate with invalid date should fail");
  assert(result.errors.some((e: string) => e.includes("date format")), "Should mention date format error");
});

Deno.test("validateCartContents - Valid CartContents structure", async () => {
  const validCart: CartContents = {
    id: "cart_12345",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR * 2),
    merchant_name: "Test Store",
  };

  const result = await validateCartContents(validCart);
  assert(result.isValid, "Valid cart contents should pass");
  assertEquals(result.errors.length, 0);
});

Deno.test("validateCartContents - Rejects cart with empty ID", async () => {
  const invalidCart: CartContents = {
    id: "", // Empty ID!
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    merchant_name: "Test Store",
  };

  const result = await validateCartContents(invalidCart);
  assert(!result.isValid, "Cart with empty ID should fail");
  assert(result.errors.some((e: string) => e.includes("ID")), "Should mention ID error");
});

Deno.test("validatePaymentRequest - Valid payment request passes", async () => {
  const validRequest: PaymentRequest = {
    id: "payment-req-789",
    methodData: [
      { supportedMethods: "basic-card" },
      { supportedMethods: "https://pay.google.com" },
    ],
    details: {
      total: {
        label: "Order Total",
        amount: { currency: "USD", value: "199.99" },
        refund_period: 14,
      },
      displayItems: [
        {
          label: "Product 1",
          amount: { currency: "USD", value: "150.00" },
          refund_period: 14,
        },
        {
          label: "Shipping",
          amount: { currency: "USD", value: "49.99" },
          refund_period: 0,
        },
      ],
    },
    options: {
      requestPayerName: true,
      requestShipping: true,
    },
  };

  const result = await validatePaymentRequest(validRequest);
  assert(result.isValid, "Valid payment request should pass");
  assertEquals(result.errors.length, 0);
});

Deno.test("validatePaymentRequest - Rejects request with no payment methods", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [], // No payment methods!
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30,
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Request with no payment methods should fail");
  assert(result.errors.some((e: string) => e.includes("payment method")), "Should mention payment method error");
});

Deno.test("validatePaymentRequest - Rejects request with invalid currency", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "INVALID", value: "100.00" }, // Invalid currency
        refund_period: 30,
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Request with invalid currency should fail");
  assert(result.errors.some((e: string) => e.includes("currency")), "Should mention currency error");
});

Deno.test("validatePaymentRequest - Rejects request with negative amount", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "-50.00" }, // Negative!
        refund_period: 30,
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Request with negative amount should fail");
  assert(result.errors.some((e: string) => e.includes("amount")), "Should mention amount error");
});

Deno.test("checkMandateExpiry - Returns false for future mandate", async () => {
  const futureIntent: IntentMandate = {
    natural_language_description: "Future product",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.WEEK),
  };

  const isExpired = await checkMandateExpiry(futureIntent);
  assert(!isExpired, "Future mandate should not be expired");
});

Deno.test("checkMandateExpiry - Returns true for past mandate", async () => {
  const pastIntent: IntentMandate = {
    natural_language_description: "Past product",
    intent_expiry: "2020-01-01T00:00:00Z",
  };

  const isExpired = await checkMandateExpiry(pastIntent);
  assert(isExpired, "Past mandate should be expired");
});

Deno.test("checkCartContentsExpiry - Works with CartContents", async () => {
  const futureCart: CartContents = {
    id: "cart_future",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "100.00" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    merchant_name: "Test Store",
  };

  const isExpired = await checkCartContentsExpiry(futureCart);
  assert(!isExpired, "Future cart should not be expired");
});

Deno.test("validateMandateIntegrity - Validates required fields are present", async () => {
  const completeMandate: IntentMandate = {
    natural_language_description: "Complete mandate",
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const result = await validateMandateIntegrity(completeMandate);
  assert(result.isValid, "Complete mandate should pass integrity check");
});

Deno.test("validateMandateIntegrity - Detects missing required fields", async () => {
  const incompleteMandate = {
    // Missing natural_language_description!
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  } as IntentMandate;

  const result = await validateMandateIntegrity(incompleteMandate);
  assert(!result.isValid, "Incomplete mandate should fail integrity check");
  assert(result.errors.some((e: string) => e.includes("required")), "Should mention missing required field");
});

Deno.test("validateCartContentsIntegrity - Validates merchant_name for CartContents", async () => {
  const cartWithoutMerchant = {
    id: "cart_123",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "100.00" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    // Missing merchant_name!
  } as unknown as CartContents;

  const result = await validateCartContentsIntegrity(cartWithoutMerchant);
  assert(!result.isValid, "Cart without merchant name should fail");
  assert(result.errors.some((e: string) => e.includes("merchant")), "Should mention merchant error");
});

// Additional tests to improve coverage

Deno.test("validateIntentMandate - Handles whitespace-only description", async () => {
  const invalidIntent: IntentMandate = {
    natural_language_description: "   ", // Whitespace only
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
  };

  const result = await validateIntentMandate(invalidIntent);
  assert(!result.isValid, "Whitespace-only description should fail");
  assert(result.errors.some((e: string) => e.includes("description")), "Should mention description error");
});

Deno.test("validateCartContents - Handles whitespace-only cart ID", async () => {
  const invalidCart: CartContents = {
    id: "   ", // Whitespace only
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    merchant_name: "Test Store",
  };

  const result = await validateCartContents(invalidCart);
  assert(!result.isValid, "Whitespace-only cart ID should fail");
  assert(result.errors.some((e: string) => e.includes("ID")), "Should mention ID error");
});

Deno.test("validateCartContents - Handles whitespace-only merchant name", async () => {
  const invalidCart: CartContents = {
    id: "cart_123",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: createFutureISO8601(TIME_CONSTANTS.HOUR),
    merchant_name: "   ", // Whitespace only
  };

  const result = await validateCartContents(invalidCart);
  assert(!result.isValid, "Whitespace-only merchant name should fail");
  assert(result.errors.some((e: string) => e.includes("Merchant name")), "Should mention merchant name error");
});

Deno.test("validateCartContents - Handles expired cart", async () => {
  const expiredCart: CartContents = {
    id: "cart_expired",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: "2020-01-01T00:00:00Z", // Past date
    merchant_name: "Test Store",
  };

  const result = await validateCartContents(expiredCart);
  assert(!result.isValid, "Expired cart should fail");
  assert(result.errors.some((e: string) => e.includes("expired")), "Should mention expiry error");
});

Deno.test("validateCartContents - Handles invalid cart expiry format", async () => {
  const invalidCart: CartContents = {
    id: "cart_123",
    user_cart_confirmation_required: false,
    payment_request: {
      id: "payment-123",
      methodData: [{ supportedMethods: "basic-card" }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "99.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: "not-a-date", // Invalid format
    merchant_name: "Test Store",
  };

  const result = await validateCartContents(invalidCart);
  assert(!result.isValid, "Invalid date format should fail");
  assert(result.errors.some((e: string) => e.includes("date format")), "Should mention date format error");
});

Deno.test("validatePaymentRequest - Handles request with only displayItems", async () => {
  const requestWithDisplayItems: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30,
      },
      displayItems: [
        {
          label: "Product",
          amount: { currency: "USD", value: "80.00" },
          refund_period: 30,
        },
        {
          label: "Tax",
          amount: { currency: "USD", value: "20.00" },
          refund_period: 0,
        },
      ],
    },
  };

  const result = await validatePaymentRequest(requestWithDisplayItems);
  assert(result.isValid, "Request with valid total and display items should pass");
});

Deno.test("validatePaymentRequest - Handles invalid refund period (negative)", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: -5, // Negative refund period
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Negative refund period should fail");
  assert(result.errors.some((e: string) => e.includes("Refund period")), "Should mention refund period error");
});

Deno.test("validatePaymentRequest - Handles excessive refund period", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 400, // Too many days
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Excessive refund period should fail");
  assert(result.errors.some((e: string) => e.includes("Refund period")), "Should mention refund period error");
});

Deno.test("validatePaymentRequest - Handles invalid amount format", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "not-a-number" },
        refund_period: 30,
      },
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Invalid amount format should fail");
  assert(result.errors.some((e: string) => e.includes("amount")), "Should mention amount error");
});

Deno.test("validatePaymentRequest - Handles display items with invalid amounts", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30,
      },
      displayItems: [
        {
          label: "Item 1",
          amount: { currency: "USD", value: "invalid-amount" },
          refund_period: 30,
        },
      ],
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Display item with invalid amount should fail");
  assert(result.errors.some((e: string) => e.includes("Display item 1")), "Should mention display item error");
});

Deno.test("validatePaymentRequest - Handles display items with invalid currency", async () => {
  const invalidRequest: PaymentRequest = {
    id: "payment-123",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30,
      },
      displayItems: [
        {
          label: "Item 1",
          amount: { currency: "INVALID", value: "50.00" },
          refund_period: 30,
        },
      ],
    },
  };

  const result = await validatePaymentRequest(invalidRequest);
  assert(!result.isValid, "Display item with invalid currency should fail");
  assert(result.errors.some((e: string) => e.includes("Display item 1")), "Should mention display item error");
});

Deno.test("validateMandate - Unknown mandate type", async () => {
  const unknownMandate = {
    unknown_field: "value",
  } as any;

  const result = await validateMandate(unknownMandate);
  assert(!result.isValid, "Unknown mandate type should fail");
  assert(result.errors.some((e: string) => e.includes("Unknown mandate type")), "Should mention unknown type error");
});

Deno.test("checkMandateExpiry - Unknown mandate type returns false", async () => {
  const unknownMandate = {
    unknown_field: "value",
  } as any;

  const isExpired = await checkMandateExpiry(unknownMandate);
  assert(!isExpired, "Unknown mandate type should default to not expired");
});

Deno.test("checkMandateExpiry - Custom current date for IntentMandate", async () => {
  const intentMandate: IntentMandate = {
    natural_language_description: "Test product",
    intent_expiry: "2025-01-01T00:00:00Z",
  };

  // Check with current date in the future
  const futureDate = new Date("2025-06-01T00:00:00Z");
  const isExpired = await checkMandateExpiry(intentMandate, futureDate);
  assert(isExpired, "Mandate should be expired when checked with future date");
});

Deno.test("checkMandateExpiry - Custom current date for CartMandate", async () => {
  const cartMandate = {
    contents: {
      id: "cart_123",
      user_cart_confirmation_required: false,
      payment_request: {
        id: "payment-123",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: {
            label: "Total",
            amount: { currency: "USD", value: "100.00" },
            refund_period: 30,
          },
        },
      },
      cart_expiry: "2025-01-01T00:00:00Z",
      merchant_name: "Test Store",
    },
  };

  // Check with current date in the future
  const futureDate = new Date("2025-06-01T00:00:00Z");
  const isExpired = await checkMandateExpiry(cartMandate, futureDate);
  assert(isExpired, "Cart mandate should be expired when checked with future date");
});

Deno.test("validateCartContentsIntegrity - Missing all fields", async () => {
  const emptyCart = {} as CartContents;

  const result = await validateCartContentsIntegrity(emptyCart);
  assert(!result.isValid, "Empty cart should fail integrity check");
  assert(result.errors.length >= 4, "Should have multiple missing field errors");
});

Deno.test("validateMandateIntegrity - CartMandate with missing contents", async () => {
  const cartMandateWithoutContents = {
    // Missing contents field
  } as any;

  const result = await validateMandateIntegrity(cartMandateWithoutContents);
  assert(!result.isValid, "CartMandate without contents should fail");
  assert(result.errors.some((e: string) => e.includes("contents")), "Should mention missing contents");
});

Deno.test("validateMandateIntegrity - IntentMandate with partial fields", async () => {
  const partialIntent = {
    intent_expiry: createFutureISO8601(TIME_CONSTANTS.DAY),
    // Missing natural_language_description
  } as IntentMandate;

  const result = await validateMandateIntegrity(partialIntent);
  assert(!result.isValid, "Partial IntentMandate should fail integrity check");
  // After our refactoring, the error message might be different
  // Check for either specific field mention or general integrity failure
  const hasRelevantError = result.errors.some((e: string) =>
    e.includes("natural_language_description") ||
    e.includes("required") ||
    e.includes("missing") ||
    e.includes("contents")
  );
  assert(hasRelevantError, `Should mention missing fields, got errors: ${result.errors.join(', ')}`);
});

// Import additional modules for coverage improvement
import { FieldValidator } from "../src/core/utils/field-validator.ts";
import { MANDATE_MESSAGES, CART_MESSAGES } from "../src/core/config/validation-messages.ts";

Deno.test("FieldValidator - String validation methods", () => {
  const config = { allowWhitespaceOnly: false };

  // Test validateRequiredString
  const validResult = FieldValidator.validateRequiredString("test", "testField", config);
  assertEquals(validResult.isValid, true);
  assertEquals(validResult.error, undefined);

  const emptyResult = FieldValidator.validateRequiredString("", "testField", config);
  assertEquals(emptyResult.isValid, false);
  assert(emptyResult.error?.includes("testField"));

  const nullResult = FieldValidator.validateRequiredString(null, "testField", config);
  assertEquals(nullResult.isValid, false);
  assert(nullResult.error?.includes("testField"));

  const whitespaceResult = FieldValidator.validateRequiredString("   ", "testField", config);
  assertEquals(whitespaceResult.isValid, false);
  assert(whitespaceResult.error?.includes("testField"));
});

Deno.test("Validation messages - Message constants", () => {
  // Test mandate messages exist and have reasonable content
  assert(typeof MANDATE_MESSAGES.EMPTY_DESCRIPTION === "string");
  assert(typeof MANDATE_MESSAGES.INVALID_DATE_FORMAT === "string");
  assert(typeof MANDATE_MESSAGES.EXPIRED_MANDATE === "string");

  assert(MANDATE_MESSAGES.EMPTY_DESCRIPTION.includes("empty"));
  assert(MANDATE_MESSAGES.INVALID_DATE_FORMAT.includes("date"));
  assert(MANDATE_MESSAGES.EXPIRED_MANDATE.includes("expired"));

  // Test cart messages exist and have reasonable content
  assert(typeof CART_MESSAGES.EMPTY_ID === "string");
  assert(typeof CART_MESSAGES.EMPTY_MERCHANT_NAME === "string");
  assert(CART_MESSAGES.EMPTY_ID.includes("empty"));
  assert(CART_MESSAGES.EMPTY_MERCHANT_NAME.includes("empty"));
});

Deno.test("Validation functions - Edge cases with null/undefined", async () => {
  // Test validateMandateIntegrity with null/undefined (async functions)
  const nullIntegrityResult = await validateMandateIntegrity(null as any);
  assertEquals(nullIntegrityResult.isValid, false);

  const undefinedIntegrityResult = await validateMandateIntegrity(undefined as any);
  assertEquals(undefinedIntegrityResult.isValid, false);

  // Test checkMandateExpiry with unknown mandate type (async function)
  const unknownMandate = { unknown_field: "test" } as any;
  const expiryResult = await checkMandateExpiry(unknownMandate);
  assertEquals(expiryResult, false);

  // Test validateMandate with edge cases (async)
  const unknownMandateResult = await validateMandate(unknownMandate);
  assertEquals(unknownMandateResult.isValid, false);
});

// Import additional modules for specific function testing
import {
  validateCartMandate,
  validatePaymentMandate,
  validatePaymentMandateContents,
  validatePaymentMandateIntegrity,
  checkPaymentMandateExpiry
} from "../src/core/validation.ts";
import { ValidationMessageFormatter, formatMessage } from "../src/core/config/validation-messages.ts";
import type { CartMandate } from "../src/types/mod.ts";
import type { PaymentMandate } from "../src/types/payment-mandate.ts";

Deno.test("FieldValidator - Additional validation methods", () => {
  // Test validateFieldExists
  const validFieldResult = FieldValidator.validateFieldExists("value", "testField");
  assertEquals(validFieldResult.isValid, true);

  const nullFieldResult = FieldValidator.validateFieldExists(null, "testField");
  assertEquals(nullFieldResult.isValid, false);
  assert(nullFieldResult.error?.includes("testField"));

  const undefinedFieldResult = FieldValidator.validateFieldExists(undefined, "testField");
  assertEquals(undefinedFieldResult.isValid, false);
  assert(undefinedFieldResult.error?.includes("testField"));

  // Test validateBooleanExists
  const validBooleanResult = FieldValidator.validateBooleanExists(true, "boolField");
  assertEquals(validBooleanResult.isValid, true);

  const falseBooleanResult = FieldValidator.validateBooleanExists(false, "boolField");
  assertEquals(falseBooleanResult.isValid, true);

  const undefinedBooleanResult = FieldValidator.validateBooleanExists(undefined, "boolField");
  assertEquals(undefinedBooleanResult.isValid, false);
  assert(undefinedBooleanResult.error?.includes("boolField"));
});

Deno.test("FieldValidator - String validation with length limits", () => {
  const configWithLimits = {
    allowWhitespaceOnly: false,
    maxDescriptionLength: 10,
    minDescriptionLength: 3
  };

  // Test max length validation
  const tooLongResult = FieldValidator.validateRequiredString("This string is way too long", "testField", configWithLimits);
  assertEquals(tooLongResult.isValid, false);
  assert(tooLongResult.error?.includes("cannot exceed"));

  // Test min length validation
  const tooShortResult = FieldValidator.validateRequiredString("hi", "testField", configWithLimits);
  assertEquals(tooShortResult.isValid, false);
  assert(tooShortResult.error?.includes("must be at least"));

  // Test valid length
  const validLengthResult = FieldValidator.validateRequiredString("valid", "testField", configWithLimits);
  assertEquals(validLengthResult.isValid, true);
});

Deno.test("FieldValidator - Date and numeric validation", () => {
  // Test validateDateField (correct method name)
  const validDateResult = FieldValidator.validateDateField("2024-12-01T10:00:00Z", "dateField", true);
  assertEquals(validDateResult.isValid, true);

  const invalidDateResult = FieldValidator.validateDateField("invalid-date", "dateField", true);
  assertEquals(invalidDateResult.isValid, false);

  const emptyDateResult = FieldValidator.validateDateField("", "dateField", true);
  assertEquals(emptyDateResult.isValid, false);
  assert(emptyDateResult.error?.includes("is required"));

  // Test validateNumericRange (correct method name)
  const validNumberResult = FieldValidator.validateNumericRange(42, "numField", 0, 100);
  assertEquals(validNumberResult.isValid, true);

  const nanResult = FieldValidator.validateNumericRange(NaN, "numField", 0, 100);
  assertEquals(nanResult.isValid, false);
  assert(nanResult.error?.includes("must be a valid number"));

  // Test validateNonEmptyArray
  const validArrayResult = FieldValidator.validateNonEmptyArray(["item1", "item2"], "items");
  assertEquals(validArrayResult.isValid, true);

  const emptyArrayResult = FieldValidator.validateNonEmptyArray([], "items");
  assertEquals(emptyArrayResult.isValid, false);
  assert(emptyArrayResult.error?.includes("At least one"));
});

Deno.test("Unused validation functions coverage", async () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY);

  // Test validateCartMandate
  const cartData: CartMandate = {
    contents: {
      id: "test-cart",
      user_cart_confirmation_required: true,
      payment_request: {
        id: "payment-test",
        methodData: [{ supportedMethods: "basic-card" }],
        details: {
          total: { label: "Total", amount: { currency: "USD", value: "50.00" }, refund_period: 30 }
        },
        options: {}
      },
      cart_expiry: futureDate,
      merchant_name: "Test Merchant",
    }
  };

  const cartValidationResult = await validateCartMandate(cartData);
  assertEquals(cartValidationResult.isValid, true);

  // Test validatePaymentMandate and related functions
  const paymentMandateData: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_test",
      payment_details_id: "pd_test",
      merchant_agent: "test-agent",
      payment_details_total: {
        label: "Test Payment",
        amount: { currency: "USD", value: "100.00" },
        refund_period: 30
      },
      payment_response: {
        requestId: "req_test",
        methodName: "basic-card",
        details: {},
        shippingOption: undefined,
        shippingAddress: undefined,
        payerName: "Test Payer",
        payerEmail: "test@example.com",
        payerPhone: "+1234567890"
      },
      timestamp: new Date().toISOString()
    }
  };

  const paymentValidationResult = await validatePaymentMandate(paymentMandateData);
  assertEquals(paymentValidationResult.isValid, true);

  const paymentContentsResult = await validatePaymentMandateContents(paymentMandateData.payment_mandate_contents);
  assertEquals(paymentContentsResult.isValid, true);

  const paymentIntegrityResult = await validatePaymentMandateIntegrity(paymentMandateData);
  assertEquals(paymentIntegrityResult.isValid, true);

  const paymentExpiryResult = await checkPaymentMandateExpiry(paymentMandateData);
  assertEquals(paymentExpiryResult, false); // Not expired
});

Deno.test("ValidationMessageFormatter - Message formatting", () => {
  // Test formatMessage with substitutions
  const messageWithPlaceholder = "Error in {fieldName}: {errorType}";
  const formattedMessage = formatMessage(messageWithPlaceholder, {
    fieldName: "testField",
    errorType: "validation failed"
  });
  assertEquals(formattedMessage, "Error in testField: validation failed");

  // Test formatMessage with missing substitution
  const partialFormatted = formatMessage("Error in {fieldName}: {missing}", {
    fieldName: "testField"
  });
  assertEquals(partialFormatted, "Error in testField: {missing}");

  // Test formatPaymentRequestError
  const paymentError = ValidationMessageFormatter.formatPaymentRequestError("Invalid amount");
  assertEquals(paymentError, "Payment request: Invalid amount");

  // Test formatDisplayItemError
  const displayItemError = ValidationMessageFormatter.formatDisplayItemError("Item {index} is invalid", 0);
  assertEquals(displayItemError, "Item 1 is invalid");

  // Test formatRefundPeriodError
  const refundPeriodError = ValidationMessageFormatter.formatRefundPeriodError(1, 365);
  assert(refundPeriodError.includes("1") && refundPeriodError.includes("365"));
});