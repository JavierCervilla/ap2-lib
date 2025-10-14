/**
 * PaymentMandate Validator
 *
 * Specialized validator for PaymentMandate entities following the Single Responsibility Principle.
 */

import type { PaymentMandate } from "../../../types/payment-mandate.ts";
import { BaseValidator, ValidationResult, createValidationResult } from "../shared/interfaces.ts";
import { PaymentMandateContentsValidator } from "./payment-mandate-contents-validator.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../../config/validation-config.ts";

/**
 * Validator for PaymentMandate entities
 */
export class PaymentMandateValidator extends BaseValidator<PaymentMandate> {
  private readonly config: ValidationConfig;
  private readonly contentsValidator: PaymentMandateContentsValidator;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
    this.contentsValidator = new PaymentMandateContentsValidator(config);
  }

  /**
   * Validate PaymentMandate by delegating to contents validation
   */
  async validate(paymentMandate: PaymentMandate): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate contents first
    const contentsResult = await this.contentsValidator.validate(paymentMandate.payment_mandate_contents);
    if (!contentsResult.isValid) {
      errors.push(...contentsResult.errors);
    }

    // Validate user_authorization format if present
    if (paymentMandate.user_authorization) {
      const authResult = this.validateUserAuthorizationFormat(paymentMandate.user_authorization);
      if (!authResult.isValid) {
        errors.push(...authResult.errors);
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate the integrity of PaymentMandate by checking required fields
   */
  async validateIntegrity(paymentMandate: PaymentMandate): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if payment_mandate_contents exist
    if (!paymentMandate.payment_mandate_contents) {
      errors.push("Missing required field: payment_mandate_contents");
      return createValidationResult(false, errors);
    }

    // Validate contents integrity
    const contentsIntegrity = await this.contentsValidator.validateIntegrity(paymentMandate.payment_mandate_contents);
    if (!contentsIntegrity.isValid) {
      errors.push(...contentsIntegrity.errors);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Check if PaymentMandate has expired (through its contents timestamp)
   */
  async checkExpiry(paymentMandate: PaymentMandate, currentDate: Date = new Date()): Promise<boolean> {
    return await this.contentsValidator.checkExpiry(paymentMandate.payment_mandate_contents, currentDate);
  }

  /**
   * Validate user_authorization JWT format
   */
  private validateUserAuthorizationFormat(userAuth: string): ValidationResult {
    const errors: string[] = [];

    try {
      // Check JWT structure (3 parts separated by dots)
      const parts = userAuth.split('.');
      if (parts.length !== 3) {
        errors.push("Invalid user_authorization format. Expected JWT with 3 parts separated by dots.");
        return createValidationResult(false, errors);
      }

      // Try to decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Check for required SD-JWT-VC claims
      const requiredClaims = ['aud', 'transaction_data'];
      for (const claim of requiredClaims) {
        if (!(claim in payload)) {
          errors.push(`Missing required claim in user_authorization: ${claim}`);
        }
      }

      // Validate transaction_data is an array
      if (payload.transaction_data && !Array.isArray(payload.transaction_data)) {
        errors.push("user_authorization transaction_data must be an array");
      }

    } catch (error) {
      errors.push("Invalid user_authorization JWT format. Failed to decode payload.");
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate that user_authorization contains expected transaction hashes
   */
  async validateTransactionHashes(
    paymentMandate: PaymentMandate,
    expectedCartMandateHash?: string,
    expectedPaymentMandateHash?: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!paymentMandate.user_authorization) {
      errors.push("No user_authorization present to validate transaction hashes");
      return createValidationResult(false, errors);
    }

    try {
      const parts = paymentMandate.user_authorization.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      const transactionData = payload.transaction_data;
      if (!Array.isArray(transactionData)) {
        errors.push("Invalid transaction_data format in user_authorization");
        return createValidationResult(false, errors);
      }

      // Check for expected hashes
      if (expectedCartMandateHash && !transactionData.includes(expectedCartMandateHash)) {
        errors.push("Cart mandate hash not found in user_authorization transaction_data");
      }

      if (expectedPaymentMandateHash && !transactionData.includes(expectedPaymentMandateHash)) {
        errors.push("Payment mandate hash not found in user_authorization transaction_data");
      }

    } catch (error) {
      errors.push("Failed to validate transaction hashes in user_authorization");
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): PaymentMandateValidator {
    return new PaymentMandateValidator(config);
  }

  /**
   * Static method to validate PaymentMandate with default config
   */
  static async validate(paymentMandate: PaymentMandate): Promise<ValidationResult> {
    return await PaymentMandateValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validate(paymentMandate);
  }

  /**
   * Static method to validate PaymentMandate integrity with default config
   */
  static async validateIntegrity(paymentMandate: PaymentMandate): Promise<ValidationResult> {
    return await PaymentMandateValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validateIntegrity(paymentMandate);
  }

  /**
   * Static method to check PaymentMandate expiry with default config
   */
  static async checkExpiry(paymentMandate: PaymentMandate, currentDate: Date = new Date()): Promise<boolean> {
    return await PaymentMandateValidator.withConfig(DEFAULT_VALIDATION_CONFIG).checkExpiry(paymentMandate, currentDate);
  }
}