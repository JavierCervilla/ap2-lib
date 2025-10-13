/**
 * PaymentMandateContents Validator
 *
 * Specialized validator for PaymentMandateContents entities following the Single Responsibility Principle.
 */

import type { PaymentMandateContents } from "../../../types/payment-mandate.ts";
import { BaseValidator, type ValidationResult, createValidationResult } from "../shared/interfaces.ts";
import { type ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../../config/validation-config.ts";

/**
 * Validator for PaymentMandateContents entities
 */
export class PaymentMandateContentsValidator extends BaseValidator<PaymentMandateContents> {
  private readonly config: ValidationConfig;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
  }

  /**
   * Validate PaymentMandateContents
   */
  async validate(contents: PaymentMandateContents): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate integrity first
    const integrityResult = await this.validateIntegrity(contents);
    if (!integrityResult.isValid) {
      errors.push(...integrityResult.errors);
    }

    // Validate field formats
    const formatResult = await this.validateFieldFormats(contents);
    if (!formatResult.isValid) {
      errors.push(...formatResult.errors);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate the integrity of PaymentMandateContents by checking required fields
   */
  async validateIntegrity(contents: PaymentMandateContents): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required string fields
    const requiredStringFields = [
      'payment_mandate_id',
      'payment_details_id',
      'merchant_agent',
      'timestamp'
    ];

    for (const field of requiredStringFields) {
      const value = contents[field as keyof PaymentMandateContents];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        errors.push(`Missing or invalid required field: ${field}`);
      }
    }

    // Check required object fields
    if (!contents.payment_details_total) {
      errors.push("Missing required field: payment_details_total");
    }

    if (!contents.payment_response) {
      errors.push("Missing required field: payment_response");
    }

    // Validate payment_details_total structure
    if (contents.payment_details_total) {
      const total = contents.payment_details_total;
      if (!total.label || typeof total.label !== 'string') {
        errors.push("payment_details_total.label is required and must be a string");
      }
      if (!total.amount) {
        errors.push("payment_details_total.amount is required");
      } else {
        if (!total.amount.currency || typeof total.amount.currency !== 'string') {
          errors.push("payment_details_total.amount.currency is required and must be a string");
        }
        if (!total.amount.value || typeof total.amount.value !== 'string') {
          errors.push("payment_details_total.amount.value is required and must be a string");
        }
      }
      if (typeof total.refund_period !== 'number' || total.refund_period < 0) {
        errors.push("payment_details_total.refund_period must be a non-negative number");
      }
    }

    // Validate payment_response structure
    if (contents.payment_response) {
      const response = contents.payment_response;
      if (!response.requestId || typeof response.requestId !== 'string') {
        errors.push("payment_response.requestId is required and must be a string");
      }
      if (!response.methodName || typeof response.methodName !== 'string') {
        errors.push("payment_response.methodName is required and must be a string");
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate field formats (ISO 8601 date, currency codes, etc.)
   */
  async validateFieldFormats(contents: PaymentMandateContents): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate timestamp format (ISO 8601)
    if (contents.timestamp) {
      const timestampDate = Date.parse(contents.timestamp);
      if (isNaN(timestampDate)) {
        errors.push("timestamp must be a valid ISO 8601 date string");
      }
    }

    // Validate currency format (ISO 4217)
    if (contents.payment_details_total?.amount?.currency) {
      const currency = contents.payment_details_total.amount.currency;
      // Basic validation: 3 uppercase letters
      if (!/^[A-Z]{3}$/.test(currency)) {
        errors.push("payment_details_total.amount.currency must be a valid ISO 4217 currency code (3 uppercase letters)");
      }
    }

    // Validate monetary amount format
    if (contents.payment_details_total?.amount?.value) {
      const value = contents.payment_details_total.amount.value;
      // Basic validation: numeric string with optional decimal places
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        errors.push("payment_details_total.amount.value must be a valid decimal monetary amount");
      }
    }

    // Validate IDs format (basic alphanumeric check)
    const idFields = ['payment_mandate_id', 'payment_details_id'];
    for (const field of idFields) {
      const value = contents[field as keyof PaymentMandateContents];
      if (value && typeof value === 'string' && !/^[a-zA-Z0-9_-]+$/.test(value)) {
        errors.push(`${field} must contain only alphanumeric characters, underscores, and hyphens`);
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Check if PaymentMandateContents has expired based on timestamp
   * PaymentMandates typically don't expire, but we check if timestamp is reasonable
   */
  async checkExpiry(contents: PaymentMandateContents, currentDate = new Date()): Promise<boolean> {
    if (!contents.timestamp) {
      return false; // Missing timestamp means we can't determine expiry
    }

    const timestampDate = new Date(contents.timestamp);
    if (isNaN(timestampDate.getTime())) {
      return false; // Invalid timestamp
    }

    // Check if timestamp is more than 24 hours in the future (suspicious)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const maxFutureTime = currentDate.getTime() + oneDayInMs;

    if (timestampDate.getTime() > maxFutureTime) {
      return true; // Timestamp too far in the future
    }

    // Check if timestamp is more than 30 days in the past (potentially expired)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const minPastTime = currentDate.getTime() - thirtyDaysInMs;

    return timestampDate.getTime() < minPastTime;
  }

  /**
   * Validate merchant_agent format
   */
  async validateMerchantAgent(contents: PaymentMandateContents): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!contents.merchant_agent) {
      errors.push("merchant_agent is required");
      return createValidationResult(false, errors);
    }

    const merchantAgent = contents.merchant_agent;

    // Basic format validation
    if (typeof merchantAgent !== 'string' || merchantAgent.trim() === '') {
      errors.push("merchant_agent must be a non-empty string");
    } else if (merchantAgent.length < 3) {
      errors.push("merchant_agent must be at least 3 characters long");
    } else if (merchantAgent.length > 100) {
      errors.push("merchant_agent must be no more than 100 characters long");
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): PaymentMandateContentsValidator {
    return new PaymentMandateContentsValidator(config);
  }

  /**
   * Static method to validate PaymentMandateContents with default config
   */
  static async validate(contents: PaymentMandateContents): Promise<ValidationResult> {
    return await PaymentMandateContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validate(contents);
  }

  /**
   * Static method to validate PaymentMandateContents integrity with default config
   */
  static async validateIntegrity(contents: PaymentMandateContents): Promise<ValidationResult> {
    return await PaymentMandateContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validateIntegrity(contents);
  }

  /**
   * Static method to check PaymentMandateContents expiry with default config
   */
  static async checkExpiry(contents: PaymentMandateContents, currentDate = new Date()): Promise<boolean> {
    return await PaymentMandateContentsValidator.withConfig(DEFAULT_VALIDATION_CONFIG).checkExpiry(contents, currentDate);
  }
}