/**
 * Validation and Serialization interfaces
 *
 * Defines contracts for validation and serialization operations following the Interface Segregation Principle.
 */

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Generic validator interface
 */
export interface Validator<T> {
  validate(item: T): Promise<ValidationResult>;
}

/**
 * Interface for field validators used during validation
 */
export interface FieldValidator<T> {
  validateField(item: T, fieldName: string): Promise<ValidationResult>;
}

/**
 * Abstract base class for validators
 */
export abstract class BaseValidator<T> implements Validator<T> {
  protected rules: ValidationRule<T>[] = [];

  /**
   * Add a validation rule to this validator
   */
  addRule(rule: ValidationRule<T>): void {
    this.rules.push(rule);
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Apply all validation rules to an item
   */
  async validateWithRules(item: T): Promise<ValidationResult> {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const result = await rule.validate(item);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return createValidationResult(errors.length === 0, errors);
  }

  /**
   * Abstract method for specific validation logic
   */
  abstract validate(item: T): Promise<ValidationResult>;
}

/**
 * Interface for validation rules
 */
export interface ValidationRule<T> {
  validate(item: T): Promise<ValidationResult>;
}

/**
 * Create a ValidationResult object
 */
export function createValidationResult(isValid: boolean, errors: string[]): ValidationResult {
  return { isValid, errors };
}

/**
 * Combine multiple validation results into one
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: string[] = [];
  let allValid = true;

  for (const result of results) {
    if (!result.isValid) {
      allValid = false;
      allErrors.push(...result.errors);
    }
  }

  return createValidationResult(allValid, allErrors);
}

// Serialization interfaces

/**
 * Generic serializer interface
 */
export interface Serializer<T> {
  serialize(item: T): Promise<string>;
}

/**
 * Generic deserializer interface
 */
export interface Deserializer<T> {
  deserialize(data: string): Promise<T>;
}

/**
 * Combined serializer/deserializer interface
 */
export interface SerializerDeserializer<T> extends Serializer<T>, Deserializer<T> {
}

/**
 * Interface for field validators used during deserialization
 */
export interface DeserializationFieldValidator {
  validateRequiredFields(parsed: any, requiredFields: string[]): string[];
  validateBooleanFields(parsed: any, booleanFields: string[]): string[];
}

/**
 * Abstract base class for JSON serializers
 */
export abstract class BaseJsonSerializer<T> implements SerializerDeserializer<T> {
  /**
   * Serialize object to JSON string
   */
  async serialize(item: T): Promise<string> {
    return JSON.stringify(item);
  }

  /**
   * Deserialize JSON string to object with validation
   */
  async deserialize(json: string): Promise<T> {
    const parsed = this.parseJson(json);
    this.validateRequiredFields(parsed);
    return this.transformParsedObject(parsed);
  }

  /**
   * Parse JSON string safely
   */
  protected parseJson(json: string): any {
    try {
      return JSON.parse(json);
    } catch {
      throw new Error("Invalid JSON format");
    }
  }

  /**
   * Validate required fields exist in parsed object
   */
  protected abstract validateRequiredFields(parsed: any): void;

  /**
   * Transform parsed object if needed (default implementation returns as-is)
   */
  protected transformParsedObject(parsed: any): T {
    return parsed as T;
  }

  /**
   * Helper method to check if required fields exist
   */
  protected checkRequiredFields(parsed: any, fields: string[]): string[] {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!(field in parsed) || parsed[field] === null || parsed[field] === undefined) {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  /**
   * Helper method to check boolean fields
   */
  protected checkBooleanFields(parsed: any, fields: string[]): string[] {
    const invalidFields: string[] = [];

    for (const field of fields) {
      if (field in parsed && parsed[field] === undefined) {
        invalidFields.push(field);
      }
    }

    return invalidFields;
  }
}