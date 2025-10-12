/**
 * IntentMandate Type Detector
 *
 * Detector for IntentMandate type following strategy pattern.
 */

import { MandateType, type MandateTypeDetector, type MandateTypeDetectionResult } from "../shared/mandate-type-detector.ts";
import { BaseMandateTypeDetector } from "../shared/mandate-type-detector.ts";

/**
 * Detector for IntentMandate type
 */
export class IntentMandateDetector extends BaseMandateTypeDetector {
  private static readonly INTENT_FIELDS = ['natural_language_description', 'intent_expiry'];
  private static readonly INTENT_OPTIONAL_FIELDS = ['merchants', 'skus', 'requires_refundability'];

  detectType(mandate: any): MandateType {
    // Must have core intent fields
    if (!this.hasFields(mandate, IntentMandateDetector.INTENT_FIELDS)) {
      return MandateType.UNKNOWN;
    }

    // Should not have cart-specific fields
    if ('contents' in mandate) {
      return MandateType.UNKNOWN;
    }

    return MandateType.INTENT;
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.INTENT;
  }

  /**
   * Detailed detection with confidence and reasoning
   */
  detectWithDetails(mandate: any): MandateTypeDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check required fields
    if (this.hasFields(mandate, IntentMandateDetector.INTENT_FIELDS)) {
      confidence += 0.8;
      reasons.push("Has required IntentMandate fields");
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Missing required IntentMandate fields"],
      };
    }

    // Check for cart-specific fields (should not have)
    if (!('contents' in mandate)) {
      confidence += 0.1;
      reasons.push("Does not have CartMandate-specific fields");
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Has CartMandate-specific fields"],
      };
    }

    // Check optional fields
    if (this.hasAnyFields(mandate, IntentMandateDetector.INTENT_OPTIONAL_FIELDS)) {
      confidence += 0.1;
      reasons.push("Has IntentMandate optional fields");
    }

    return {
      type: MandateType.INTENT,
      confidence: Math.min(confidence, 1),
      reasons,
    };
  }
}