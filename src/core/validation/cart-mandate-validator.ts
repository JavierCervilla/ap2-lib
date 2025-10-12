/**
 * CartMandate Validator
 *
 * Specialized validator for CartMandate entities following the Single Responsibility Principle.
 */

import type { CartMandate } from "../../types/mod.ts";
import { BaseValidator, ValidationResult, createValidationResult } from "./interfaces.ts";
import { CartContentsValidator } from "./cart-contents-validator.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../config/validation-config.ts";
import { MANDATE_MESSAGES } from "../config/validation-messages.ts";

/**
 * Validator for CartMandate entities
 */
export class CartMandateValidator extends BaseValidator<CartMandate> {
  private readonly config: ValidationConfig;
  private readonly cartContentsValidator: CartContentsValidator;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
    this.cartContentsValidator = new CartContentsValidator(config);
  }

  /**
   * Validate CartMandate by delegating to CartContents validation
   */
  async validate(cartMandate: CartMandate): Promise<ValidationResult> {
    // CartMandate validation is essentially CartContents validation
    return await this.cartContentsValidator.validate(cartMandate.contents);
  }

  /**
   * Validate the integrity of CartMandate by checking required fields
   */
  async validateIntegrity(cartMandate: CartMandate): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if contents exist
    if (!cartMandate.contents) {
      errors.push(MANDATE_MESSAGES.MISSING_CONTENTS);
      return createValidationResult(false, errors);
    }

    // Validate contents integrity
    const contentsIntegrity = await this.cartContentsValidator.validateIntegrity(cartMandate.contents);
    if (!contentsIntegrity.isValid) {
      errors.push(...contentsIntegrity.errors);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Check if CartMandate has expired (through its contents)
   */
  async checkExpiry(cartMandate: CartMandate, currentDate = new Date()): Promise<boolean> {
    return await this.cartContentsValidator.checkExpiry(cartMandate.contents, currentDate);
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): CartMandateValidator {
    return new CartMandateValidator(config);
  }
}