/**
 * PaymentRequest Validator
 *
 * Specialized validator for PaymentRequest entities following the Single Responsibility Principle.
 */

import type { AP2PaymentRequest } from "../../../types/mod.ts";
import { BaseValidator, type ValidationResult, createValidationResult } from "./interfaces.ts";
import {
  NonEmptyArrayRule,
  CurrencyValidationRule,
  PositiveAmountRule,
  NumericRangeRule,
} from "./rules.ts";
import { type ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../../config/validation-config.ts";
import {
  PAYMENT_MESSAGES,
} from "../../config/validation-messages.ts";
import { ValidationMessageFormatter } from "../../config/validation-messages.ts";

/**
 * Validator for PaymentRequest entities
 */
export class PaymentRequestValidator extends BaseValidator<AP2PaymentRequest> {
  private readonly config: ValidationConfig;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules for PaymentRequest
   */
  private initializeDefaultRules(): void {
    // Payment methods array must not be empty
    this.addRule(
      new NonEmptyArrayRule(
        "payment method",
        (request) => request.methodData
      )
    );
  }

  /**
   * Validate PaymentRequest structure and content
   */
  async validate(paymentRequest: AP2PaymentRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate basic rules
    const basicValidation = await this.validateWithRules(paymentRequest);
    errors.push(...basicValidation.errors);

    // Validate total amount if present
    if (paymentRequest.details.total) {
      const totalValidation = await this.validatePaymentItem(paymentRequest.details.total, "total");
      errors.push(...totalValidation.errors);
    }

    // Validate display items if present
    if (paymentRequest.details.displayItems) {
      for (let i = 0; i < paymentRequest.details.displayItems.length; i++) {
        const item = paymentRequest.details.displayItems[i];
        const itemValidation = await this.validateDisplayItem(item, i);
        errors.push(...itemValidation.errors);
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate a payment item (total or display item)
   */
  private async validatePaymentItem(item: any, itemType: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate currency
    const currencyValidator = new CurrencyValidationRule(
      `${itemType} currency`,
      () => item.amount.currency,
      this.config
    );
    const currencyResult = await currencyValidator.validate(item);
    errors.push(...currencyResult.errors);

    // Validate amount is positive
    const amountValidator = new PositiveAmountRule(
      `${itemType} amount`,
      () => item.amount.value
    );
    const amountResult = await amountValidator.validate(item);
    errors.push(...amountResult.errors);

    // Validate refund period if present
    if (typeof item.refund_period === 'number') {
      const refundValidator = new NumericRangeRule(
        `${itemType} refund period`,
        () => item.refund_period,
        this.config.payment.minRefundPeriodDays,
        this.config.payment.maxRefundPeriodDays
      );
      const refundResult = await refundValidator.validate(item);

      // Transform generic range error to specific refund period error
      if (!refundResult.isValid) {
        errors.push(ValidationMessageFormatter.formatRefundPeriodError(
          this.config.payment.minRefundPeriodDays,
          this.config.payment.maxRefundPeriodDays
        ));
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate a display item with proper error messaging
   */
  private async validateDisplayItem(item: any, index: number): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate amount
    const amount = parseFloat(item.amount.value);
    if (isNaN(amount)) {
      errors.push(ValidationMessageFormatter.formatDisplayItemError(PAYMENT_MESSAGES.DISPLAY_ITEM_INVALID_AMOUNT, index));
    }

    // Validate currency
    const isValidCurrency = this.config.payment.supportedCurrencyProvider.isValidCurrency(item.amount.currency);
    if (!isValidCurrency) {
      errors.push(ValidationMessageFormatter.formatDisplayItemError(PAYMENT_MESSAGES.DISPLAY_ITEM_INVALID_CURRENCY, index));
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate the integrity of PaymentRequest by checking required fields
   */
  async validateIntegrity(paymentRequest: AP2PaymentRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required field existence
    if (!paymentRequest.methodData) {
      errors.push(PAYMENT_MESSAGES.MISSING_METHOD_DATA);
    }

    if (!paymentRequest.details) {
      errors.push(PAYMENT_MESSAGES.MISSING_DETAILS);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * PaymentRequest doesn't have expiry, so always return false
   */
  async checkExpiry(_paymentRequest: AP2PaymentRequest, _currentDate: Date = new Date()): Promise<boolean> {
    return false;
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): PaymentRequestValidator {
    return new PaymentRequestValidator(config);
  }

  /**
   * Static method to validate PaymentRequest with default config
   */
  static async validate(paymentRequest: AP2PaymentRequest): Promise<ValidationResult> {
    return await PaymentRequestValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validate(paymentRequest);
  }

  /**
   * Static method to validate PaymentRequest integrity with default config
   */
  static async validateIntegrity(paymentRequest: AP2PaymentRequest): Promise<ValidationResult> {
    return await PaymentRequestValidator.withConfig(DEFAULT_VALIDATION_CONFIG).validateIntegrity(paymentRequest);
  }

  /**
   * Static method to check PaymentRequest expiry with default config
   */
  static async checkExpiry(paymentRequest: AP2PaymentRequest, currentDate: Date = new Date()): Promise<boolean> {
    return await PaymentRequestValidator.withConfig(DEFAULT_VALIDATION_CONFIG).checkExpiry(paymentRequest, currentDate);
  }
}