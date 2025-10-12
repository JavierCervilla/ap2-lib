/**
 * AP2 Protocol Constants
 *
 * Constants used throughout the Agent Payments Protocol (AP2) implementation.
 * These match the official Google AP2 specification.
 */

/**
 * Mandate Data Keys
 *
 * These constants define the data keys used to identify different types of mandates
 * within the AP2 protocol.
 */

/** Data key for Cart Mandate objects */
export const CART_MANDATE_DATA_KEY = "ap2.mandates.CartMandate" as const;

/** Data key for Intent Mandate objects */
export const INTENT_MANDATE_DATA_KEY = "ap2.mandates.IntentMandate" as const;

/** Data key for Payment Mandate objects */
export const PAYMENT_MANDATE_DATA_KEY = "ap2.mandates.PaymentMandate" as const;

/**
 * Union type of all mandate data keys
 */
export type MandateDataKey =
  | typeof CART_MANDATE_DATA_KEY
  | typeof INTENT_MANDATE_DATA_KEY
  | typeof PAYMENT_MANDATE_DATA_KEY;