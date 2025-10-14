/**
 * Mandate Type Detection Strategy
 *
 * Implements strategy pattern for detecting mandate types, following the Open/Closed
 * principle to allow easy extension with new mandate types.
 */


/**
 * Enumeration of supported mandate types
 */
export enum MandateType {
  INTENT = "intent",
  CART = "cart",
  PAYMENT = "payment",
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
 * Registry for mandate type detectors
 */
export class MandateTypeDetectorRegistry {
  private readonly detectors: Map<MandateType, BaseMandateTypeDetector> = new Map();
  private initialized = false;

  constructor() {
    // Don't initialize detectors immediately to avoid circular dependencies
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      // Import detectors lazily to avoid circular dependencies
      const [intentModule, cartModule, paymentModule] = await Promise.all([
        import("../intent/intent-mandate-detector.ts"),
        import("../cart/cart-mandate-detector.ts"),
        import("../payment/payment-mandate-detector.ts")
      ]);

      this.registerDetector(new intentModule.IntentMandateDetector());
      this.registerDetector(new cartModule.CartMandateDetector());
      this.registerDetector(new paymentModule.PaymentMandateDetector());

      this.initialized = true;
    } catch (error) {
      console.warn("Failed to initialize mandate detectors:", error);
    }
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
    // Use simple heuristic detection for synchronous operation
    // This avoids the async initialization issue
    if (!mandate || typeof mandate !== 'object') {
      return MandateType.UNKNOWN;
    }

    // Check for mixed mandate types (should be UNKNOWN)
    const hasIntentField = 'natural_language_description' in mandate || 'intent_expiry' in mandate;
    const hasCartField = 'contents' in mandate;
    const hasPaymentField = 'payment_mandate_contents' in mandate;


    // Count how many mandate types are detected
    const typesDetected = [hasIntentField, hasCartField, hasPaymentField].filter(Boolean).length;

    // If multiple mandate types detected, return UNKNOWN (conflicting fields)
    if (typesDetected > 1) {
      return MandateType.UNKNOWN;
    }

    // Single mandate type detection
    if (hasIntentField) {
      if ('natural_language_description' in mandate && 'intent_expiry' in mandate) {
        return MandateType.INTENT;
      }
    }

    if (hasCartField) {
      return MandateType.CART;
    }

    if (hasPaymentField) {
      return MandateType.PAYMENT;
    }

    return MandateType.UNKNOWN;
  }

  /**
   * Get detailed detection results from all detectors
   */
  async detectWithDetails(mandate: any): Promise<MandateTypeDetectionResult[]> {
    await this.ensureInitialized();
    const results: MandateTypeDetectionResult[] = [];

    for (const detector of this.detectors.values()) {
      // Check if detector has detailed detection method
      if ('detectWithDetails' in detector && typeof detector.detectWithDetails === 'function') {
        results.push((detector as any).detectWithDetails(mandate));
      } else {
        // Fallback to basic detection
        const type = detector.detectType(mandate);
        results.push({
          type,
          confidence: type !== MandateType.UNKNOWN ? 0.8 : 0,
          reasons: [type !== MandateType.UNKNOWN ? `Detected as ${type}` : "Unknown type"]
        });
      }
    }

    return results;
  }

  /**
   * Get the best detection result (highest confidence)
   */
  async getBestDetection(mandate: any): Promise<MandateTypeDetectionResult> {
    const results = await this.detectWithDetails(mandate);

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
export const defaultMandateTypeDetector: MandateTypeDetectorRegistry = new MandateTypeDetectorRegistry();