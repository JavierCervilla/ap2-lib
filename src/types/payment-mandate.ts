/**
 * PaymentMandate Types
 *
 * Types for PaymentMandate according to AP2 specification.
 * Used for visibility into agentic transactions in the payments ecosystem.
 */

import type { ExtendedPaymentItem, AP2PaymentResponse } from "./payment_request.ts";

/**
 * The data contents of a PaymentMandate
 */
export interface PaymentMandateContents {
  /** A unique identifier for this payment mandate */
  payment_mandate_id: string;

  /** A unique identifier for the payment request */
  payment_details_id: string;

  /** The total payment amount */
  payment_details_total: ExtendedPaymentItem;

  /** The payment response containing details of the payment method chosen by the user */
  payment_response: AP2PaymentResponse;

  /** Identifier for the merchant */
  merchant_agent: string;

  /** The date and time the mandate was created, in ISO 8601 format */
  timestamp: string;
}

/**
 * Contains the user's instructions & authorization for payment
 *
 * While the Cart and Intent mandates are required by the merchant to fulfill the
 * order, separately the protocol provides additional visibility into the agentic
 * transaction to the payments ecosystem. For this purpose, the PaymentMandate
 * (bound to Cart/Intent mandate but containing separate information) may be
 * shared with the network/issuer along with the standard transaction
 * authorization messages. The goal of the PaymentMandate is to help the
 * network/issuer build trust into the agentic transaction.
 */
export interface PaymentMandate {
  /** The data contents of the payment mandate */
  payment_mandate_contents: PaymentMandateContents;

  /**
   * This is a base64_url-encoded verifiable presentation of a verifiable
   * credential signing over the cart_mandate and payment_mandate_hashes.
   * For example an sd-jwt-vc would contain:
   *
   * - An issuer-signed jwt authorizing a 'cnf' claim
   * - A key-binding jwt with the claims
   *   "aud": ...
   *   "nonce": ...
   *   "sd_hash": hash of the issuer-signed jwt
   *   "transaction_data": an array containing the secure hashes of
   *     CartMandate and PaymentMandateContents.
   */
  user_authorization?: string;
}