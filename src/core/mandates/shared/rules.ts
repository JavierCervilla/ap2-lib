/**
 * Common validation rules
 *
 * Reusable validation rules that can be applied to different entity types,
 * following the Open/Closed principle for extensibility.
 */

import type { ValidationRule, ValidationResult } from "./interfaces.ts";
import { createValidationResult } from "./interfaces.ts";
import { FieldValidator } from "../../utils/field-validator.ts";
import { ValidationConfig } from "../../config/validation-config.ts";

/**
 * Abstract base class for validation rules
 */
export abstract class BaseValidationRule<T> implements ValidationRule<T> {
  abstract readonly name: string;
  abstract validate(item: T): Promise<ValidationResult>;
}

/**
 * Rule for validating required string fields
 */
export class RequiredStringRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => string | undefined | null,
    private config: ValidationConfig
  ) {
    super();
    this.name = `required-string-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateRequiredString(value, this.fieldName, this.config.strings);

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating date fields
 */
export class DateValidationRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => string | undefined | null,
    private config: ValidationConfig
  ) {
    super();
    this.name = `date-validation-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateDateField(
      value,
      this.fieldName,
      this.config.dates.allowPastDates
    );

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating required fields exist
 */
export class RequiredFieldRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => any
  ) {
    super();
    this.name = `required-field-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateFieldExists(value, this.fieldName);

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating boolean fields exist
 */
export class RequiredBooleanRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => boolean | undefined
  ) {
    super();
    this.name = `required-boolean-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateBooleanExists(value, this.fieldName);

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating non-empty arrays
 */
export class NonEmptyArrayRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => readonly any[] | any[] | undefined
  ) {
    super();
    this.name = `non-empty-array-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateNonEmptyArray(value, this.fieldName);

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating numeric ranges
 */
export class NumericRangeRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => number,
    private min: number,
    private max: number
  ) {
    super();
    this.name = `numeric-range-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const value = this.fieldExtractor(item);
    const result = FieldValidator.validateNumericRange(value, this.fieldName, this.min, this.max);

    return createValidationResult(result.isValid, result.error ? [result.error] : []);
  }
}

/**
 * Rule for validating currency codes
 */
export class CurrencyValidationRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => string,
    private config: ValidationConfig
  ) {
    super();
    this.name = `currency-validation-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const currencyCode = this.fieldExtractor(item);
    const isValid = this.config.payment.supportedCurrencyProvider.isValidCurrency(currencyCode);

    return createValidationResult(
      isValid,
      isValid ? [] : ["Invalid currency code - not found in ISO 4217 standard"]
    );
  }
}

/**
 * Rule for validating positive amounts
 */
export class PositiveAmountRule<T> extends BaseValidationRule<T> {
  readonly name: string;

  constructor(
    private fieldName: string,
    private fieldExtractor: (item: T) => string
  ) {
    super();
    this.name = `positive-amount-${fieldName}`;
  }

  async validate(item: T): Promise<ValidationResult> {
    const amountStr = this.fieldExtractor(item);
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount < 0) {
      return createValidationResult(false, ["Invalid amount - must be a positive number"]);
    }

    return createValidationResult(true, []);
  }
}