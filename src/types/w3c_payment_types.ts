/**
 * W3C Payment Request API TypeScript Types
 *
 * Based on the W3C Candidate Recommendation Draft (September 30, 2025)
 * https://w3c.github.io/payment-request/
 *
 * These are exported types that can be used in both JSR and NPM builds
 * without global namespace pollution.
 */

/**
 * Represents a monetary amount with currency
 * @see https://w3c.github.io/payment-request/#paymentcurrencyamount-dictionary
 */
export interface PaymentCurrencyAmount {
  readonly currency: string;
  readonly value: string;
}

/**
 * Represents a line item in a payment request
 * @see https://w3c.github.io/payment-request/#paymentitem-dictionary
 */
export interface PaymentItem {
  readonly label: string;
  readonly amount: PaymentCurrencyAmount;
  readonly pending?: boolean;
}

/**
 * Represents a shipping option with cost and selection state
 * @see https://w3c.github.io/payment-request/#paymentshippingoption-dictionary
 */
export interface PaymentShippingOption {
  readonly id: string;
  readonly label: string;
  readonly amount: PaymentCurrencyAmount;
  readonly selected?: boolean;
}

/**
 * Contains the total and line items for a payment request
 * @see https://w3c.github.io/payment-request/#paymentdetailsinit-dictionary
 */
export interface PaymentDetailsInit {
  readonly total: PaymentItem;
  readonly displayItems?: readonly PaymentItem[];
  readonly shippingOptions?: readonly PaymentShippingOption[];
}

/**
 * Specifies payment method and associated data
 * @see https://w3c.github.io/payment-request/#paymentmethoddata-dictionary
 */
export interface PaymentMethodData {
  readonly supportedMethods: string;
  readonly data?: Record<string, unknown>;
}

/**
 * Configuration options for payment request information collection
 * @see https://w3c.github.io/payment-request/#paymentoptions-dictionary
 */
export interface PaymentOptions {
  readonly requestPayerName?: boolean;
  readonly requestPayerEmail?: boolean;
  readonly requestPayerPhone?: boolean;
  readonly requestShipping?: boolean;
  readonly shippingType?: "shipping" | "delivery" | "pickup";
}