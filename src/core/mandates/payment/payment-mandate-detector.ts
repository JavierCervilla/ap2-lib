/**
 * PaymentMandate Type Detector
 *
 * Detector for PaymentMandate type following strategy pattern.
 */

import { MandateType, type MandateTypeDetector, type MandateTypeDetectionResult } from "../shared/mandate-type-detector.ts";
import { BaseMandateTypeDetector } from "../shared/mandate-type-detector.ts";

/**
 * Detector for PaymentMandate type
 */
export class PaymentMandateDetector extends BaseMandateTypeDetector {
  private static readonly PAYMENT_FIELDS = ['payment_mandate_contents'];
  private static readonly PAYMENT_CONTENTS_FIELDS = [
    'payment_mandate_id',
    'payment_details_id',
    'merchant_agent',
    'payment_details_total',
    'payment_response',
    'timestamp'
  ];

  detectType(mandate: any): MandateType {
    // Must have payment_mandate_contents field
    if (!this.hasFields(mandate, PaymentMandateDetector.PAYMENT_FIELDS)) {
      return MandateType.UNKNOWN;
    }

    // Contents must have payment-specific fields
    if (!mandate.payment_mandate_contents ||
        !this.hasFields(mandate.payment_mandate_contents, PaymentMandateDetector.PAYMENT_CONTENTS_FIELDS)) {
      return MandateType.UNKNOWN;
    }

    // Should not have cart or intent-specific fields
    if ('contents' in mandate || 'natural_language_description' in mandate || 'intent_expiry' in mandate) {
      return MandateType.UNKNOWN;
    }

    return MandateType.PAYMENT;
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.PAYMENT;
  }

  /**
   * Detailed detection with confidence and reasoning
   */
  detectWithDetails(mandate: any): MandateTypeDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for payment_mandate_contents field
    if (this.hasFields(mandate, PaymentMandateDetector.PAYMENT_FIELDS)) {
      confidence += 0.3;
      reasons.push("Has required PaymentMandate payment_mandate_contents field");

      // Check contents structure
      if (mandate.payment_mandate_contents &&
          this.hasFields(mandate.payment_mandate_contents, PaymentMandateDetector.PAYMENT_CONTENTS_FIELDS)) {
        confidence += 0.6;
        reasons.push("Contents has required payment fields");
      } else {
        return {
          type: MandateType.UNKNOWN,
          confidence: 0,
          reasons: ["Contents missing required payment fields"],
        };
      }
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Missing required PaymentMandate payment_mandate_contents field"],
      };
    }

    // Check for cart/intent-specific fields (should not have)
    if (!('contents' in mandate) &&
        !('natural_language_description' in mandate) &&
        !('intent_expiry' in mandate)) {
      confidence += 0.1;
      reasons.push("Does not have Cart or Intent mandate-specific fields");
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Has Cart or Intent mandate-specific fields"],
      };
    }

    // Check for optional user_authorization field
    if ('user_authorization' in mandate) {
      confidence += 0.05;
      reasons.push("Has optional user_authorization field");
    }

    return {
      type: MandateType.PAYMENT,
      confidence: Math.min(confidence, 1),
      reasons,
    };
  }
}