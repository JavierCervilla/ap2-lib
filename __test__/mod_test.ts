/**
 * AP2 Library - Main Module Tests
 *
 * Tests for the main module exports to ensure all types are properly exported.
 */

import { assert, assertExists } from "@std/assert";
import * as AP2 from "../src/mod.ts";

Deno.test("AP2 Library - All exports available", () => {
  // Test that main types are exported
  assert(typeof AP2 === "object", "AP2 module should be an object");

  // Test constants are available
  assertExists(AP2.CART_MANDATE_DATA_KEY);
  assertExists(AP2.INTENT_MANDATE_DATA_KEY);
  assertExists(AP2.PAYMENT_MANDATE_DATA_KEY);

  // Basic sanity check
  assert(true, "Basic test should pass");
});

Deno.test("AP2 Library - Constants have correct values", () => {
  assert(AP2.CART_MANDATE_DATA_KEY === "ap2.mandates.CartMandate");
  assert(AP2.INTENT_MANDATE_DATA_KEY === "ap2.mandates.IntentMandate");
  assert(AP2.PAYMENT_MANDATE_DATA_KEY === "ap2.mandates.PaymentMandate");
});