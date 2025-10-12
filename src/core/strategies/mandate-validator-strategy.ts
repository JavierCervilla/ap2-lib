/**
 * Mandate Validation Strategy
 *
 * Implements strategy pattern for mandate validation, allowing different
 * validation strategies for different mandate types.
 */

import type { Mandate, IntentMandate, CartMandate } from "../../types/mod.ts";
import { isIntentMandate, isCartMandate } from "../../types/mod.ts";
import { ValidationResult, createValidationResult } from "../validation/interfaces.ts";
import { IntentMandateValidator } from "../validation/intent-mandate-validator.ts";
import { CartMandateValidator } from "../validation/cart-mandate-validator.ts";
import { MandateType, MandateTypeDetectorRegistry, defaultMandateTypeDetector } from "./mandate-type-detector.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../config/validation-config.ts";
import { MANDATE_MESSAGES } from "../config/validation-messages.ts";

/**
 * Interface for mandate validation strategies
 */
export interface MandateValidationStrategy<T extends Mandate = Mandate> {
  validate(mandate: T): Promise<ValidationResult>;
  validateIntegrity(mandate: T): Promise<ValidationResult>;
  checkExpiry(mandate: T, currentDate?: Date): Promise<boolean>;
  canHandle(mandateType: MandateType): boolean;
}

/**
 * Abstract base class for validation strategies
 */
export abstract class BaseMandateValidationStrategy<T extends Mandate> implements MandateValidationStrategy<T> {
  protected readonly config: ValidationConfig;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    this.config = config;
  }

  abstract validate(mandate: T): Promise<ValidationResult>;
  abstract validateIntegrity(mandate: T): Promise<ValidationResult>;
  abstract checkExpiry(mandate: T, currentDate?: Date): Promise<boolean>;
  abstract canHandle(mandateType: MandateType): boolean;
}

/**
 * Validation strategy for IntentMandate
 */
export class IntentMandateValidationStrategy extends BaseMandateValidationStrategy<IntentMandate> {
  private readonly validator: IntentMandateValidator;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super(config);
    this.validator = new IntentMandateValidator(config);
  }

  async validate(mandate: IntentMandate): Promise<ValidationResult> {
    return await this.validator.validate(mandate);
  }

  async validateIntegrity(mandate: IntentMandate): Promise<ValidationResult> {
    return await this.validator.validateIntegrity(mandate);
  }

  async checkExpiry(mandate: IntentMandate, currentDate = new Date()): Promise<boolean> {
    return await this.validator.checkExpiry(mandate, currentDate);
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.INTENT;
  }
}

/**
 * Validation strategy for CartMandate
 */
export class CartMandateValidationStrategy extends BaseMandateValidationStrategy<CartMandate> {
  private readonly validator: CartMandateValidator;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super(config);
    this.validator = new CartMandateValidator(config);
  }

  async validate(mandate: CartMandate): Promise<ValidationResult> {
    return await this.validator.validate(mandate);
  }

  async validateIntegrity(mandate: CartMandate): Promise<ValidationResult> {
    return await this.validator.validateIntegrity(mandate);
  }

  async checkExpiry(mandate: CartMandate, currentDate = new Date()): Promise<boolean> {
    return await this.validator.checkExpiry(mandate, currentDate);
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.CART;
  }
}

/**
 * Registry for mandate validation strategies
 */
export class MandateValidationStrategyRegistry {
  private readonly strategies: Map<MandateType, MandateValidationStrategy> = new Map();
  private readonly typeDetector: MandateTypeDetectorRegistry;

  constructor(
    typeDetector: MandateTypeDetectorRegistry = defaultMandateTypeDetector,
    config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
  ) {
    this.typeDetector = typeDetector;

    // Register default strategies
    this.registerStrategy(new IntentMandateValidationStrategy(config));
    this.registerStrategy(new CartMandateValidationStrategy(config));
  }

  /**
   * Register a validation strategy
   */
  registerStrategy(strategy: MandateValidationStrategy): void {
    for (const type of Object.values(MandateType)) {
      if (type !== MandateType.UNKNOWN && strategy.canHandle(type)) {
        this.strategies.set(type, strategy);
      }
    }
  }

  /**
   * Get strategy for a specific mandate type
   */
  getStrategy(mandateType: MandateType): MandateValidationStrategy | undefined {
    return this.strategies.get(mandateType);
  }

  /**
   * Validate mandate by detecting type and using appropriate strategy
   */
  async validateMandate(mandate: Mandate): Promise<ValidationResult> {
    const mandateType = this.typeDetector.detectType(mandate);

    if (mandateType === MandateType.UNKNOWN) {
      return createValidationResult(false, [MANDATE_MESSAGES.UNKNOWN_TYPE]);
    }

    const strategy = this.getStrategy(mandateType);
    if (!strategy) {
      return createValidationResult(false, [`No validation strategy found for mandate type: ${mandateType}`]);
    }

    return await strategy.validate(mandate);
  }

  /**
   * Validate mandate integrity by detecting type and using appropriate strategy
   */
  async validateMandateIntegrity(mandate: Mandate): Promise<ValidationResult> {
    const mandateType = this.typeDetector.detectType(mandate);

    // Handle case where mandate type cannot be determined
    if (mandateType === MandateType.UNKNOWN) {
      // Use type guards for more reliable detection
      const errors: string[] = [];

      if (isIntentMandate(mandate)) {
        // Detected as IntentMandate, validate its required fields
        const intentStrategy = this.getStrategy(MandateType.INTENT);
        if (intentStrategy) {
          return await intentStrategy.validateIntegrity(mandate);
        }
      } else if (isCartMandate(mandate)) {
        // Detected as CartMandate, validate its required fields
        const cartStrategy = this.getStrategy(MandateType.CART);
        if (cartStrategy) {
          return await cartStrategy.validateIntegrity(mandate);
        }
      }

      // If neither type guard matches, it's truly unknown
      errors.push(MANDATE_MESSAGES.MISSING_CONTENTS);
      return createValidationResult(false, errors);
    }

    const strategy = this.getStrategy(mandateType);
    if (!strategy) {
      return createValidationResult(false, [`No validation strategy found for mandate type: ${mandateType}`]);
    }

    return await strategy.validateIntegrity(mandate);
  }

  /**
   * Check mandate expiry by detecting type and using appropriate strategy
   */
  async checkMandateExpiry(mandate: Mandate, currentDate = new Date()): Promise<boolean> {
    const mandateType = this.typeDetector.detectType(mandate);

    if (mandateType === MandateType.UNKNOWN) {
      // Unknown mandate type - assume not expired
      return false;
    }

    const strategy = this.getStrategy(mandateType);
    if (!strategy) {
      // No strategy available - assume not expired
      return false;
    }

    return await strategy.checkExpiry(mandate, currentDate);
  }

  /**
   * Static method to validate a mandate using the default registry
   */
  static async validate(mandate: Mandate): Promise<ValidationResult> {
    return await defaultMandateValidationRegistry.validateMandate(mandate);
  }

  /**
   * Static method to validate mandate integrity using the default registry
   */
  static async validateIntegrity(mandate: Mandate): Promise<ValidationResult> {
    return await defaultMandateValidationRegistry.validateMandateIntegrity(mandate);
  }

  /**
   * Static method to check mandate expiry using the default registry
   */
  static async checkExpiry(mandate: Mandate, currentDate = new Date()): Promise<boolean> {
    return await defaultMandateValidationRegistry.checkMandateExpiry(mandate, currentDate);
  }
}

/**
 * Default singleton instance
 */
export const defaultMandateValidationRegistry = new MandateValidationStrategyRegistry();