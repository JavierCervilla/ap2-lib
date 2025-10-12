/**
 * Payment Request Types
 *
 * TypeScript implementations of the payment request types as defined in the
 * Google AP2 specification. These types handle the core payment flow.
 */

import type {
  ContactAddress,
} from "./contact_picker.ts";


/**
 * Represents a monetary amount with currency information.
 *
 * This follows the W3C Payment Request API specification for
 * representing currency amounts.
 */
export interface PaymentCurrencyAmount {
  /** The currency identifier (ISO 4217 currency code) */
  readonly currency: string;

  /**
   * The monetary amount as a string.
   * Must be a valid decimal monetary value.
   *
   * @example "19.99"
   * @example "100.00"
   */
  readonly value: string;
}


/**
 * An item for purchase and the value asked for it.
 *
 * This represents a single item in a payment request, including
 * its description, cost, and refund policy.
 */
export interface PaymentItem {
  /**
   * A human-readable description of the item.
   *
   * @example "Red Basketball Shoes - Size 10"
   * @example "Shipping Cost"
   * @example "Tax"
   */
  readonly label: string;

  /**
   * The monetary amount of the item.
   *
   * Includes both the currency and the numerical value.
   */
  readonly amount: PaymentCurrencyAmount;

  /**
   * If true, indicates the amount is not final.
   *
   * This is useful for items where the final cost may change,
   * such as shipping costs that depend on the delivery address.
   *
   * @default undefined
   */
  readonly pending?: boolean;

  /**
   * The refund duration for this item, in days.
   *
   * Specifies how long after purchase the item can be refunded.
   *
   * @default 30
   * @example 30 // 30 days refund period
   * @example 0  // No refunds allowed
   */
  readonly refund_period: number;
}

/**
 * Represents a shipping option in a payment request.
 */
export interface PaymentShippingOption {
  /** Unique identifier for this shipping option */
  readonly id: string;

  /** Human-readable label for the shipping option */
  readonly label: string;

  /** The cost of this shipping option */
  readonly amount: PaymentCurrencyAmount;

  /** Whether this option is selected by default */
  readonly selected?: boolean;
}

/**
 * Configuration options for a payment request.
 */
export interface PaymentOptions {
  /** Whether to request the payer's name */
  readonly requestPayerName?: boolean;

  /** Whether to request the payer's email */
  readonly requestPayerEmail?: boolean;

  /** Whether to request the payer's phone number */
  readonly requestPayerPhone?: boolean;

  /** Whether to request shipping information */
  readonly requestShipping?: boolean;

  /** The type of shipping information to collect */
  readonly shippingType?: "shipping" | "delivery" | "pickup";
}

/**
 * Represents a payment method that can be used for a payment.
 *
 * This follows the W3C Payment Request API specification.
 */
export interface PaymentMethodData {
  /**
   * The payment method identifier.
   *
   * @example "basic-card"
   * @example "https://pay.google.com"
   */
  readonly supportedMethods: string;

  /**
   * Payment method specific data.
   * The structure depends on the payment method.
   */
  readonly data?: Record<string, unknown>;
}

/**
 * Represents the initial payment details for a payment request.
 *
 * This follows the W3C Payment Request API specification.
 */
export interface PaymentDetailsInit {
  /** The unique identifier for this payment request */
  readonly id?: string;

  /** The total amount for the payment */
  readonly total: PaymentItem;

  /** Individual line items that make up the payment */
  readonly displayItems?: readonly PaymentItem[];

  /** Available shipping options */
  readonly shippingOptions?: readonly PaymentShippingOption[];

  /** Payment method specific modifiers */
  readonly modifiers?: readonly PaymentDetailsModifier[];
}



/**
 * Represents modifiers that can change payment details based on payment method.
 */
export interface PaymentDetailsModifier {
  /** The payment method this modifier applies to */
  readonly supportedMethods: string;

  /** The new total when this payment method is selected */
  readonly total?: PaymentItem;

  /** Additional display items for this payment method */
  readonly additionalDisplayItems?: readonly PaymentItem[];

  /** Payment method specific data */
  readonly data?: Record<string, unknown>;
}


/**
 * A request for payment.
 *
 * This represents a complete payment request as defined by the W3C Payment Request API
 * and extended by the AP2 specification.
 */
export interface PaymentRequest {
  /** The unique ID for this payment request */
  readonly id: string;

  /**
   * A list of supported payment methods.
   *
   * Each entry specifies a payment method that the merchant accepts,
   * along with any method-specific configuration.
   */
  readonly methodData: readonly PaymentMethodData[];

  /**
   * The financial details of the transaction.
   *
   * Includes the total amount, line items, and other payment details.
   */
  readonly details: PaymentDetailsInit;

  /**
   * Optional configuration for the payment request.
   *
   * Specifies what additional information should be collected
   * from the user (shipping address, contact info, etc.).
   */
  readonly options?: PaymentOptions;

  /**
   * The user's provided shipping address.
   *
   * This field is populated when the user provides shipping information
   * during the payment flow.
   */
  readonly shipping_address?: ContactAddress;
}

/**
 * Indicates a user has chosen a payment method & approved a payment request.
 *
 * This represents the response from a completed payment request, containing
 * the user's payment choice and any collected information.
 */
export interface PaymentResponse {
  /**
   * The unique ID from the original PaymentRequest.
   *
   * This links the response back to the specific payment request
   * that generated it.
   */
  readonly requestId: string;

  /**
   * The payment method chosen by the user.
   *
   * This corresponds to one of the payment methods that was offered
   * in the original PaymentRequest.
   *
   * @example "basic-card"
   * @example "https://pay.google.com"
   */
  readonly methodName: string;

  /**
   * A dictionary generated by a payment method that a merchant can use
   * to process a transaction.
   *
   * The contents will depend upon the payment method. For example,
   * for basic-card payments this might contain card details, while
   * for digital wallets it might contain tokenized payment information.
   */
  readonly details?: Record<string, unknown>;

  /**
   * The shipping address provided by the user.
   *
   * Only present if shipping information was requested in the
   * original PaymentRequest.
   */
  readonly shippingAddress?: ContactAddress;

  /**
   * The shipping option selected by the user.
   *
   * Only present if multiple shipping options were offered and
   * the user made a selection.
   */
  readonly shippingOption?: PaymentShippingOption;

  /**
   * The payer's name.
   *
   * Only present if payer name was requested in the original
   * PaymentRequest options.
   */
  readonly payerName?: string;

  /**
   * The payer's email address.
   *
   * Only present if payer email was requested in the original
   * PaymentRequest options.
   */
  readonly payerEmail?: string;

  /**
   * The payer's phone number.
   *
   * Only present if payer phone was requested in the original
   * PaymentRequest options.
   */
  readonly payerPhone?: string;
}