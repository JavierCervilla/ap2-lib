/**
 * Mandate Type Detection Strategy
 *
 * Implements strategy pattern for detecting mandate types, following the Open/Closed
 * principle to allow easy extension with new mandate types.
 */

import type { Mandate, IntentMandate, CartMandate } from "../../types/mod.ts";

/**
 * Enumeration of supported mandate types
 */
export enum MandateType {
  INTENT = "intent",
  CART = "cart",
  UNKNOWN = "unknown",
}

/**
 * Interface for mandate type detection strategies
 */
export interface MandateTypeDetector {
  detectType(mandate: any): MandateType;
  canHandle(mandateType: MandateType): boolean;
}

/**
 * Result of mandate type detection
 */
export interface MandateTypeDetectionResult {
  type: MandateType;
  confidence: number; // 0-1 scale
  reasons: string[];
}

/**
 * Abstract base detector
 */
export abstract class BaseMandateTypeDetector implements MandateTypeDetector {
  abstract detectType(mandate: any): MandateType;
  abstract canHandle(mandateType: MandateType): boolean;

  /**
   * Check if object has specific fields
   */
  protected hasFields(obj: any, fields: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    return fields.every(field => field in obj);
  }

  /**
   * Check if object has any of the specified fields
   */
  protected hasAnyFields(obj: any, fields: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    return fields.some(field => field in obj);
  }
}

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

/**
 * Detector for CartMandate type
 */
export class CartMandateDetector extends BaseMandateTypeDetector {
  private static readonly CART_FIELDS = ['contents'];

  detectType(mandate: any): MandateType {
    // Must have contents field
    if (!this.hasFields(mandate, CartMandateDetector.CART_FIELDS)) {
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

    // Check required fields
    if (this.hasFields(mandate, CartMandateDetector.CART_FIELDS)) {
      confidence += 0.8;
      reasons.push("Has required CartMandate fields");
    } else {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["Missing required CartMandate fields"],
      };
    }

    // Check for intent-specific fields (should not have)
    if (!('natural_language_description' in mandate) && !('intent_expiry' in mandate)) {
      confidence += 0.2;
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

/**
 * Registry for mandate type detectors
 */
export class MandateTypeDetectorRegistry {
  private readonly detectors: Map<MandateType, BaseMandateTypeDetector> = new Map();

  constructor() {
    // Register default detectors
    this.registerDetector(new IntentMandateDetector());
    this.registerDetector(new CartMandateDetector());
  }

  /**
   * Register a new detector
   */
  registerDetector(detector: BaseMandateTypeDetector): void {
    // Determine what type this detector handles
    for (const type of Object.values(MandateType)) {
      if (type !== MandateType.UNKNOWN && detector.canHandle(type)) {
        this.detectors.set(type, detector);
      }
    }
  }

  /**
   * Detect mandate type using registered detectors
   */
  detectType(mandate: any): MandateType {
    for (const detector of this.detectors.values()) {
      const type = detector.detectType(mandate);
      if (type !== MandateType.UNKNOWN) {
        return type;
      }
    }

    return MandateType.UNKNOWN;
  }

  /**
   * Get detailed detection results from all detectors
   */
  detectWithDetails(mandate: any): MandateTypeDetectionResult[] {
    const results: MandateTypeDetectionResult[] = [];

    for (const detector of this.detectors.values()) {
      if (detector instanceof IntentMandateDetector) {
        results.push(detector.detectWithDetails(mandate));
      } else if (detector instanceof CartMandateDetector) {
        results.push(detector.detectWithDetails(mandate));
      }
    }

    return results;
  }

  /**
   * Get the best detection result (highest confidence)
   */
  getBestDetection(mandate: any): MandateTypeDetectionResult {
    const results = this.detectWithDetails(mandate);

    if (results.length === 0) {
      return {
        type: MandateType.UNKNOWN,
        confidence: 0,
        reasons: ["No registered detectors"],
      };
    }

    return results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }
}

/**
 * Default singleton instance
 */
export const defaultMandateTypeDetector = new MandateTypeDetectorRegistry();