/**
 * IntentMandate Validator
 *
 * Specialized validator for IntentMandate entities following the Single Responsibility Principle.
 */

import type { IntentMandate } from "../../types/mod.ts";
import { isExpired } from "../../utils/mod.ts";
import { BaseValidator, ValidationResult, createValidationResult } from "./interfaces.ts";
import {
  RequiredStringRule,
  DateValidationRule,
  RequiredFieldRule,
} from "./rules.ts";
import { ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../config/validation-config.ts";
import {
  MANDATE_MESSAGES,
} from "../config/validation-messages.ts";

/**
 * Validator for IntentMandate entities
 */
export class IntentMandateValidator extends BaseValidator<IntentMandate> {
  private readonly config: ValidationConfig;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    super();
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules for IntentMandate
   */
  private initializeDefaultRules(): void {
    // Required string validation for natural_language_description
    this.addRule(
      new RequiredStringRule(
        "natural_language_description",
        (mandate) => mandate.natural_language_description,
        this.config
      )
    );

    // Date validation for intent_expiry
    this.addRule(
      new DateValidationRule(
        "intent_expiry",
        (mandate) => mandate.intent_expiry,
        this.config
      )
    );
  }

  /**
   * Validate IntentMandate structure and content
   */
  async validate(intentMandate: IntentMandate): Promise<ValidationResult> {
    return await this.validateWithRules(intentMandate);
  }

  /**
   * Validate the integrity of IntentMandate by checking required fields
   */
  async validateIntegrity(intentMandate: IntentMandate): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required field existence
    if (!intentMandate.natural_language_description) {
      errors.push(MANDATE_MESSAGES.MISSING_NATURAL_LANGUAGE_DESCRIPTION);
    }

    if (!intentMandate.intent_expiry) {
      errors.push(MANDATE_MESSAGES.MISSING_INTENT_EXPIRY);
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Check if IntentMandate has expired
   */
  async checkExpiry(intentMandate: IntentMandate, currentDate = new Date()): Promise<boolean> {
    return isExpired(intentMandate.intent_expiry, currentDate);
  }

  /**
   * Create a validator with custom configuration
   */
  static withConfig(config: ValidationConfig): IntentMandateValidator {
    return new IntentMandateValidator(config);
  }
}