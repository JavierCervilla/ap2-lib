/**
 * CartMandate Type Detector
 *
 * Detector for CartMandate type following strategy pattern.
 */

import { MandateType, type MandateTypeDetectionResult } from "../shared/mandate-type-detector.ts";
import { BaseMandateTypeDetector } from "../shared/mandate-type-detector.ts";

/**
 * Detector for CartMandate type
 */
export class CartMandateDetector extends BaseMandateTypeDetector {
  private static readonly CART_FIELDS = ['contents'];
  private static readonly CART_CONTENTS_FIELDS = ['id', 'merchant_name', 'cart_expiry', 'payment_request'];

  detectType(mandate: any): MandateType {
    // Must have contents field
    if (!this.hasFields(mandate, CartMandateDetector.CART_FIELDS)) {
      return MandateType.UNKNOWN;
    }

    // Contents must have cart-specific fields
    if (!mandate.contents || !this.hasFields(mandate.contents, CartMandateDetector.CART_CONTENTS_FIELDS)) {
      return MandateType.UNKNOWN;
    }

    // Should not have intent-specific fields
    if ('natural_language_description' in mandate || 'intent_expiry' in mandate) {
      return MandateType.UNKNOWN;
    }

    return MandateType.CART;
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.CART;
  }

  /**
   * Detailed detection with confidence and reasoning
   */
  detectWithDetails(mandate: any): MandateTypeDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for contents field
    if (this.hasFields(mandate, CartMandateDetector.CART_FIELDS)) {
      confidence += 0.4;
      reasons.push("Has required CartMandate contents field");

      // Check contents structure
      if (mandate.contents && this.hasFields(mandate.contents, CartMandateDetector.CART_CONTENTS_FIELDS)) {
        confidence += 0.5;
        reasons.push("Contents has required cart fields");
      } else {
        return {
          type: MandateType.UNKNOWN,
          confidence: 0,
          reasons: ["Contents missing required cart fields"],
        };
      }
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Missing required CartMandate contents field"],
      };
    }

    // Check for intent-specific fields (should not have)
    if (!('natural_language_description' in mandate) && !('intent_expiry' in mandate)) {
      confidence += 0.1;
      reasons.push("Does not have IntentMandate-specific fields");
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Has IntentMandate-specific fields"],
      };
    }

    return {
      type: MandateType.CART,
      confidence: Math.min(confidence, 1),
      reasons,
    };
  }
}