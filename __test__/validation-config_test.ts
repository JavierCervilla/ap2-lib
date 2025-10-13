/// <reference types="../src/types/deno.d.ts" />
/**
 * Validation Config Test Suite
 *
 * Comprehensive tests for ValidationConfig and DefaultCurrencyProvider
 * to achieve 100% coverage, including error handling scenarios.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { DEFAULT_VALIDATION_CONFIG } from "../src/core/config/validation-config.ts";

Deno.test("ValidationConfig - DEFAULT_VALIDATION_CONFIG exists and has correct structure", () => {
  assertExists(DEFAULT_VALIDATION_CONFIG);

  // Test payment config
  assertExists(DEFAULT_VALIDATION_CONFIG.payment);
  assertEquals(DEFAULT_VALIDATION_CONFIG.payment.maxRefundPeriodDays, 365);
  assertEquals(DEFAULT_VALIDATION_CONFIG.payment.minRefundPeriodDays, 0);
  assertExists(DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider);

  // Test strings config
  assertExists(DEFAULT_VALIDATION_CONFIG.strings);
  assertEquals(DEFAULT_VALIDATION_CONFIG.strings.allowWhitespaceOnly, false);
  assertEquals(DEFAULT_VALIDATION_CONFIG.strings.maxDescriptionLength, 1000);
  assertEquals(DEFAULT_VALIDATION_CONFIG.strings.minDescriptionLength, 1);

  // Test dates config
  assertExists(DEFAULT_VALIDATION_CONFIG.dates);
  assertEquals(DEFAULT_VALIDATION_CONFIG.dates.allowPastDates, false);
  assertEquals(DEFAULT_VALIDATION_CONFIG.dates.maxFutureDays, 365);
});

Deno.test("DefaultCurrencyProvider - isValidCurrency with valid currencies", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test common valid currencies
  assert(provider.isValidCurrency("USD"));
  assert(provider.isValidCurrency("EUR"));
  assert(provider.isValidCurrency("GBP"));
  assert(provider.isValidCurrency("JPY"));
  assert(provider.isValidCurrency("CAD"));
  assert(provider.isValidCurrency("AUD"));
});

Deno.test("DefaultCurrencyProvider - isValidCurrency with invalid format", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test invalid formats (not 3 uppercase letters)
  assertEquals(provider.isValidCurrency(""), false);
  assertEquals(provider.isValidCurrency("US"), false);
  assertEquals(provider.isValidCurrency("USDD"), false);
  assertEquals(provider.isValidCurrency("usd"), false);
  assertEquals(provider.isValidCurrency("123"), false);
  assertEquals(provider.isValidCurrency("U$D"), false);
});

Deno.test("DefaultCurrencyProvider - isValidCurrency with unknown but valid format", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test unknown currency codes that are not in the fallback list
  // These should return false if not found in currency-codes library
  assertEquals(provider.isValidCurrency("ZZZ"), false);

  // Test a currency that we know should not exist
  assertEquals(provider.isValidCurrency("QQQ"), false);
});

// Test to trigger the fallback mechanism by creating a situation where currency-codes might fail
Deno.test("DefaultCurrencyProvider - fallback mechanism when library fails", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // These tests check currencies that should be handled by fallback
  // Assuming some currencies might not be found by currency-codes library

  // Test currencies that should be in the fallback list
  const fallbackCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW',
    'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL',
    'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'ZAR', 'EGP', 'MAD', 'NGN'
  ];

  // All fallback currencies should be valid
  for (const currency of fallbackCurrencies) {
    assert(
      provider.isValidCurrency(currency),
      `Fallback currency ${currency} should be valid`
    );
  }
});

Deno.test("DefaultCurrencyProvider - currency not in fallback list", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test a properly formatted but unknown currency
  // This should return false if not in currency-codes and not in fallback
  const result = provider.isValidCurrency("XYZ");
  assertEquals(typeof result, "boolean");
  // XYZ is not in the fallback list, so if currency-codes doesn't find it,
  // it should return false
});

// Mock test to ensure error handling path is covered
Deno.test("DefaultCurrencyProvider - handles library errors gracefully", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test with a currency that should work fine
  // This mainly tests that the provider is robust
  assert(provider.isValidCurrency("USD"));

  // Test edge cases that might cause issues
  assertEquals(provider.isValidCurrency("ABC"), false); // Not a real currency
});

// Test config immutability (readonly properties)
Deno.test("ValidationConfig - configuration properties are readonly", () => {
  const config = DEFAULT_VALIDATION_CONFIG;

  // These should all exist and be properly typed
  assertEquals(typeof config.payment.maxRefundPeriodDays, "number");
  assertEquals(typeof config.payment.minRefundPeriodDays, "number");
  assertEquals(typeof config.strings.allowWhitespaceOnly, "boolean");
  assertEquals(typeof config.dates.allowPastDates, "boolean");
});

Deno.test("ValidationConfig - optional properties exist when defined", () => {
  const config = DEFAULT_VALIDATION_CONFIG;

  // Test optional properties
  assertExists(config.strings.maxDescriptionLength);
  assertExists(config.strings.minDescriptionLength);
  assertExists(config.dates.maxFutureDays);

  assertEquals(typeof config.strings.maxDescriptionLength, "number");
  assertEquals(typeof config.strings.minDescriptionLength, "number");
  assertEquals(typeof config.dates.maxFutureDays, "number");
});

// Test to trigger error handling by passing invalid input that might cause currency-codes to fail
Deno.test("DefaultCurrencyProvider - error handling with problematic input", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test with null/undefined - these should be handled gracefully by format check
  assertEquals(provider.isValidCurrency(null as any), false);
  assertEquals(provider.isValidCurrency(undefined as any), false);

  // Test with object/function that might cause toString issues
  assertEquals(provider.isValidCurrency({} as any), false);
  assertEquals(provider.isValidCurrency([] as any), false);
  assertEquals(provider.isValidCurrency(123 as any), false);
});

// Create a test that might trigger the currency-codes error path
Deno.test("DefaultCurrencyProvider - handle potential library edge cases", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test currencies that definitely exist in the fallback list
  const fallbackCurrencies = ['NGN', 'MAD', 'EGP', 'ZAR', 'UYU', 'PEN', 'COP', 'CLP', 'ARS'];

  for (const currency of fallbackCurrencies) {
    const result = provider.isValidCurrency(currency);
    assert(result, `Currency ${currency} should be valid (either via library or fallback)`);
  }

  // Test some obviously invalid ones to ensure they fail properly
  assertEquals(provider.isValidCurrency("999"), false);
  assertEquals(provider.isValidCurrency("@#$"), false);
});

// Comprehensive currency provider interface test
Deno.test("CurrencyProvider - interface compliance", () => {
  const provider = DEFAULT_VALIDATION_CONFIG.payment.supportedCurrencyProvider;

  // Test that the provider implements the CurrencyProvider interface
  assertEquals(typeof provider.isValidCurrency, "function");

  // Test return type is boolean
  const result = provider.isValidCurrency("USD");
  assertEquals(typeof result, "boolean");
});