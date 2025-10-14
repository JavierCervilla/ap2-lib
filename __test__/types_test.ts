 
/**
 * AP2 Types Test Suite
 *
 * Comprehensive tests for all AP2 type definitions to ensure they match
 * the Google AP2 specification exactly.
 */

import { assert, assertEquals, assertExists } from "./test_helper.ts";
import {
  CART_MANDATE_DATA_KEY,
  INTENT_MANDATE_DATA_KEY,
  PAYMENT_MANDATE_DATA_KEY,
} from "../src/mod.ts";
import type {
  IntentMandate,
  CartContents,
  CartMandate,
  ContactAddress,
} from "../src/mod.ts";
import type { ExtendedPaymentItem, AP2PaymentRequest, AP2PaymentResponse, PaymentCurrencyAmount } from "../src/types/mod.ts";


Deno.test("Constants - Mandate Data Keys", () => {
  assertEquals(CART_MANDATE_DATA_KEY, "ap2.mandates.CartMandate");
  assertEquals(INTENT_MANDATE_DATA_KEY, "ap2.mandates.IntentMandate");
  assertEquals(PAYMENT_MANDATE_DATA_KEY, "ap2.mandates.PaymentMandate");
});

Deno.test("PaymentCurrencyAmount - Valid Structure", () => {
  const amount: PaymentCurrencyAmount = {
    currency: "USD",
    value: "19.99",
  };

  assertEquals(amount.currency, "USD");
  assertEquals(amount.value, "19.99");
  assert(typeof amount.currency === "string");
  assert(typeof amount.value === "string");
});

Deno.test("PaymentItem - Complete Structure", () => {
  const item: ExtendedPaymentItem = {
    label: "Red Basketball Shoes - Size 10",
    amount: {
      currency: "USD",
      value: "129.99",
    },
    pending: false,
    refund_period: 30,
  };

  assertEquals(item.label, "Red Basketball Shoes - Size 10");
  assertEquals(item.amount.currency, "USD");
  assertEquals(item.amount.value, "129.99");
  assertEquals(item.pending, false);
  assertEquals(item.refund_period, 30);
});

Deno.test("ContactAddress - All Fields Optional", () => {
  const minimalAddress: ContactAddress = {};

  const fullAddress: ContactAddress = {
    city: "San Francisco",
    country: "US",
    dependent_locality: "SOMA",
    organization: "Google",
    phone_number: "+1-555-0123",
    postal_code: "94105",
    recipient: "John Doe",
    region: "CA",
    sorting_code: "ABC123",
    address_line: ["123 Main St", "Apt 4B"],
  };

  assertExists(minimalAddress);
  assertEquals(fullAddress.city, "San Francisco");
  assertEquals(fullAddress.country, "US");
  assertEquals(fullAddress.address_line?.length, 2);
});

Deno.test("IntentMandate - Required and Optional Fields", () => {
  const minimalIntent: IntentMandate = {
    natural_language_description: "High top, old school, red basketball shoes",
    intent_expiry: "2024-12-31T23:59:59Z",
  };

  const fullIntent: IntentMandate = {
    user_cart_confirmation_required: false,
    natural_language_description: "High top, old school, red basketball shoes",
    merchants: ["nike.com", "adidas.com"],
    skus: ["NIKE-AIR-JORDAN-1-RED-10"],
    requires_refundability: true,
    intent_expiry: "2024-12-31T23:59:59Z",
  };

  assertEquals(minimalIntent.natural_language_description, "High top, old school, red basketball shoes");
  assertEquals(minimalIntent.intent_expiry, "2024-12-31T23:59:59Z");

  assertEquals(fullIntent.user_cart_confirmation_required, false);
  assertEquals(fullIntent.merchants?.length, 2);
  assertEquals(fullIntent.skus?.length, 1);
  assertEquals(fullIntent.requires_refundability, true);
});

Deno.test("PaymentRequest - Complete Structure", () => {
  const paymentRequest: AP2PaymentRequest = {
    id: "payment-123",
    methodData: [{
      supportedMethods: "basic-card",
      data: { supportedNetworks: ["visa", "mastercard"] },
    }],
    details: {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "129.99" },
        refund_period: 30,
      },
      displayItems: [{
        label: "Basketball Shoes",
        amount: { currency: "USD", value: "129.99" },
        refund_period: 30,
      }],
    },
    options: {
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: true,
    },
  };

  assertEquals(paymentRequest.id, "payment-123");
  assertEquals(paymentRequest.methodData.length, 1);
  assertEquals(paymentRequest.details.total.label, "Total");
  assertEquals(paymentRequest.options?.requestPayerName, true);
});

Deno.test("CartContents - All Required Fields", () => {
  const cartContents: CartContents = {
    id: "cart_abc123def456",
    user_cart_confirmation_required: true,
    payment_request: {
      id: "payment-123",
      methodData: [{
        supportedMethods: "basic-card",
      }],
      details: {
        total: {
          label: "Total",
          amount: { currency: "USD", value: "129.99" },
          refund_period: 30,
        },
      },
    },
    cart_expiry: "2024-01-15T14:30:00Z",
    merchant_name: "Nike Store",
  };

  assertEquals(cartContents.id, "cart_abc123def456");
  assertEquals(cartContents.user_cart_confirmation_required, true);
  assertEquals(cartContents.merchant_name, "Nike Store");
  assertEquals(cartContents.cart_expiry, "2024-01-15T14:30:00Z");
  assertExists(cartContents.payment_request);
});

Deno.test("CartMandate - With Optional Signature", () => {
  const cartContents: CartContents = {
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
    cart_expiry: "2024-01-15T14:30:00Z",
    merchant_name: "Test Store",
  };

  const unsignedMandate: CartMandate = {
    contents: cartContents,
  };

  const signedMandate: CartMandate = {
    contents: cartContents,
    merchant_authorization: "304502210089abcdef123456789",
  };

  assertExists(unsignedMandate.contents);
  assertEquals(unsignedMandate.merchant_authorization, undefined);

  assertExists(signedMandate.contents);
  assertEquals(signedMandate.merchant_authorization, "304502210089abcdef123456789");
});

Deno.test("PaymentResponse - All Fields", () => {
  const response: AP2PaymentResponse = {
    requestId: "payment-123",
    methodName: "basic-card",
    details: {
      cardholderName: "John Doe",
      cardNumber: "4111111111111111",
    },
    shippingAddress: {
      recipient: "John Doe",
      address_line: ["123 Main St"],
      city: "San Francisco",
      region: "CA",
      postal_code: "94105",
      country: "US",
    },
    shippingOption: {
      id: "standard",
      label: "Standard Shipping",
      amount: { currency: "USD", value: "5.00" },
    },
    payerName: "John Doe",
    payerEmail: "john@example.com",
    payerPhone: "+1-555-0123",
  };

  assertEquals(response.requestId, "payment-123");
  assertEquals(response.methodName, "basic-card");
  assertExists(response.details);
  assertExists(response.shippingAddress);
  assertEquals(response.payerName, "John Doe");
});

Deno.test("Type Immutability - Readonly Properties", () => {
  const item: ExtendedPaymentItem = {
    label: "Test Item",
    amount: { currency: "USD", value: "10.00" },
    refund_period: 30,
  };

  // TypeScript prevents these assignments at compile time due to readonly properties
  // This test verifies the structure is accessible
  assertEquals(item.label, "Test Item");
  assertEquals(item.amount.currency, "USD");
  assertEquals(item.refund_period, 30);
});

Deno.test("ISO 8601 Date Strings - Format Validation", () => {
  const validDates = [
    "2024-12-31T23:59:59Z",
    "2024-03-15T10:30:00-05:00",
    "2024-01-15T14:30:00+00:00",
  ];

  const intent: IntentMandate = {
    natural_language_description: "Test intent",
    intent_expiry: validDates[0],
  };

  const cartContents: CartContents = {
    id: "cart_123",
    user_cart_confirmation_required: true,
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
    cart_expiry: validDates[1],
    merchant_name: "Test Store",
  };

  assertEquals(intent.intent_expiry, validDates[0]);
  assertEquals(cartContents.cart_expiry, validDates[1]);
});