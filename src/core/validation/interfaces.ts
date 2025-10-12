/**
 * Validation interfaces and base types
 *
 * Defines contracts for validation operations following the Interface Segregation
 * and Open/Closed principles.
 */

/**
 * Result of validation operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Base validator interface
 */
export interface Validator<T> {
  validate(item: T): Promise<ValidationResult>;
}

/**
 * Interface for validation rules that can be applied to entities
 */
export interface ValidationRule<T> {
  readonly name: string;
  validate(item: T): Promise<ValidationResult>;
}

/**
 * Interface for integrity validators that check required fields
 */
export interface IntegrityValidator<T> {
  validateIntegrity(item: T): Promise<ValidationResult>;
}

/**
 * Interface for expiry validators
 */
export interface ExpiryValidator<T> {
  checkExpiry(item: T, currentDate?: Date): Promise<boolean>;
}

/**
 * Combined validator interface for entities that need all types of validation
 */
export interface EntityValidator<T> extends Validator<T>, IntegrityValidator<T>, ExpiryValidator<T> {
  validateWithRules(item: T, rules?: ValidationRule<T>[]): Promise<ValidationResult>;
}

/**
 * Base abstract validator class that implements common functionality
 */
export abstract class BaseValidator<T> implements EntityValidator<T> {
  protected readonly rules: ValidationRule<T>[] = [];

  constructor(rules?: ValidationRule<T>[]) {
    if (rules) {
      this.rules = [...rules];
    }
  }

  /**
   * Add a validation rule to this validator
   */
  addRule(rule: ValidationRule<T>): void {
    this.rules.push(rule);
  }

  /**
   * Remove a validation rule by name
   */
  removeRule(ruleName: string): void {
    const index = this.rules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.rules.splice(index, 1);
    }
  }

  /**
   * Validate with custom rules
   */
  async validateWithRules(item: T, customRules?: ValidationRule<T>[]): Promise<ValidationResult> {
    const rulesToApply = customRules || this.rules;
    const errors: string[] = [];

    for (const rule of rulesToApply) {
      const result = await rule.validate(item);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Abstract methods to be implemented by concrete validators
  abstract validate(item: T): Promise<ValidationResult>;
  abstract validateIntegrity(item: T): Promise<ValidationResult>;
  abstract checkExpiry(item: T, currentDate?: Date): Promise<boolean>;
}

/**
 * Utility function to create a simple validation result
 */
export function createValidationResult(isValid: boolean, errors: string[] = []): ValidationResult {
  return { isValid, errors };
}

/**
 * Utility function to combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: string[] = [];
  let isValid = true;

  for (const result of results) {
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid,
    errors: allErrors,
  };
}