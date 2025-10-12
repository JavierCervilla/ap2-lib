/**
 * CartContents Validator
 *
 * Specialized validator for CartContents entities following the Single Responsibility Principle.
 */

import type { CartContents } from "../../types/mod.ts";
import { isExpired } from "../../utils/mod.ts";
import { BaseValidator, ValidationResult, createValidationResult, combineValidationResults } from "./interfaces.ts";
import {
  RequiredStringRule,
  DateValidationRule,
  RequiredFieldRule,
  RequiredBooleanRule,
} from "./rules.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../config/validation-config.ts";
import { PaymentRequestValidator } from "./payment-request-validator.ts";
import {
  CART_MESSAGES,
} from "../config/validation-messages.ts";

/**
 * Validator for CartContents entities
 */
export class CartContentsValidator extends BaseValidator<CartContents> {
  private readonly config: ValidationConfig;
  private readonly paymentRequestValidator: PaymentRequestValidator;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
    this.paymentRequestValidator = new PaymentRequestValidator(config);
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules for CartContents
   */
  private initializeDefaultRules(): void {
    // Required string validation for cart ID
    this.addRule(
      new RequiredStringRule(
        "Cart ID",
        (cart) => cart.id,
        this.config
      )
    );

    // Required string validation for merchant name
    this.addRule(
      new RequiredStringRule(
        "Merchant name",
        (cart) => cart.merchant_name,
        this.config
      )
    );

    // Date validation for cart_expiry
    this.addRule(
      new DateValidationRule(
        "cart_expiry",
        (cart) => cart.cart_expiry,
        this.config
      )
    );
  }

  /**
   * Validate CartContents structure and content
   */
  async validate(cartContents: CartContents): Promise<ValidationResult> {
    // Validate basic fields using rules
    const basicValidation = await this.validateWithRules(cartContents);

    // Validate nested payment request
    const paymentValidation = await this.paymentRequestValidator.validate(cartContents.payment_request);

    // Prefix payment errors for clarity
    const paymentErrors = paymentValidation.errors.map(error => `Payment request: ${error}`);

    return combineValidationResults(
      basicValidation,
      createValidationResult(paymentValidation.isValid, paymentErrors)
    );
  }

  /**
   * Validate the integrity of CartContents by checking required fields
   */
  async validateIntegrity(cartContents: CartContents): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required field existence
    if (!cartContents.id) {
      errors.push(CART_MESSAGES.MISSING_ID);
    }

    if (!cartContents.merchant_name) {
      errors.push(CART_MESSAGES.MISSING_MERCHANT_NAME);
    }

    if (!cartContents.cart_expiry) {
      errors.push(CART_MESSAGES.MISSING_CART_EXPIRY);
    }

    if (!cartContents.payment_request) {
      errors.push(CART_MESSAGES.MISSING_PAYMENT_REQUEST);
    }

    if (cartContents.user_cart_confirmation_required === undefined) {
      errors.push(CART_MESSAGES.MISSING_USER_CONFIRMATION);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Check if CartContents has expired
   */
  async checkExpiry(cartContents: CartContents, currentDate = new Date()): Promise<boolean> {
    return isExpired(cartContents.cart_expiry, currentDate);
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): CartContentsValidator {
    return new CartContentsValidator(config);
  }

  /**
   * Static method to validate CartContents with default config
   */
  static async validate(cartContents: CartContents): Promise<ValidationResult> {
    return await CartContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validate(cartContents);
  }

  /**
   * Static method to validate CartContents integrity with default config
   */
  static async validateIntegrity(cartContents: CartContents): Promise<ValidationResult> {
    return await CartContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validateIntegrity(cartContents);
  }

  /**
   * Static method to check CartContents expiry with default config
   */
  static async checkExpiry(cartContents: CartContents, currentDate = new Date()): Promise<boolean> {
    return await CartContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).checkExpiry(cartContents, currentDate);
  }
}