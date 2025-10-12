/**
 * Field validation utilities
 *
 * Common field validation helpers that can be reused across different validators,
 * following the DRY principle and Single Responsibility Principle.
 */

import { StringValidationConfig } from "../config/validation-config.ts";
import { isValidISO8601, isExpired } from "../../utils/mod.ts";

/**
 * Result of field validation
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Utility class for common field validation operations
 */
export class FieldValidator {
  /**
   * Validate that a string field is not empty or whitespace-only
   *
   * @param value - Value to validate
   * @param fieldName - Name of the field for error messages
   * @param config - String validation configuration
   * @returns Validation result
   */
  static validateRequiredString(
    value: string | undefined | null,
    fieldName: string,
    config: StringValidationConfig
  ): FieldValidationResult {
    if (!value) {
      return {
        isValid: false,
        error: `${fieldName} cannot be empty`,
      };
    }

    if (!config.allowWhitespaceOnly && value.trim() === "") {
      return {
        isValid: false,
        error: `${fieldName} cannot be empty`,
      };
    }

    if (config.maxDescriptionLength && value.length > config.maxDescriptionLength) {
      return {
        isValid: false,
        error: `${fieldName} cannot exceed ${config.maxDescriptionLength} characters`,
      };
    }

    if (config.minDescriptionLength && value.length < config.minDescriptionLength) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${config.minDescriptionLength} characters`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate that a field exists (not null or undefined)
   *
   * @param value - Value to check
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  static validateFieldExists(value: any, fieldName: string): FieldValidationResult {
    if (value === undefined || value === null) {
      return {
        isValid: false,
        error: `required field '${fieldName}' is missing`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate boolean field exists (not undefined)
   *
   * @param value - Boolean value to check
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  static validateBooleanExists(value: boolean | undefined, fieldName: string): FieldValidationResult {
    if (value === undefined) {
      return {
        isValid: false,
        error: `required field '${fieldName}' is missing`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate ISO 8601 date format and expiry
   *
   * @param dateString - Date string to validate
   * @param fieldName - Name of the field for error messages
   * @param allowPastDates - Whether past dates are allowed
   * @param currentDate - Current date for comparison (defaults to now)
   * @returns Validation result
   */
  static validateDateField(
    dateString: string | undefined | null,
    fieldName: string,
    allowPastDates: boolean = false,
    currentDate: Date = new Date()
  ): FieldValidationResult {
    if (!dateString) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }

    if (!isValidISO8601(dateString)) {
      return {
        isValid: false,
        error: `Invalid date format for ${fieldName}`,
      };
    }

    if (!allowPastDates && isExpired(dateString, currentDate)) {
      const entityType = fieldName.includes('intent') ? 'Intent mandate' : 'Cart';
      return {
        isValid: false,
        error: `${entityType} has expired`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate numeric value within range
   *
   * @param value - Numeric value to validate
   * @param fieldName - Name of the field for error messages
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validation result
   */
  static validateNumericRange(
    value: number,
    fieldName: string,
    min: number,
    max: number
  ): FieldValidationResult {
    if (isNaN(value)) {
      return {
        isValid: false,
        error: `${fieldName} must be a valid number`,
      };
    }

    if (value < min || value > max) {
      return {
        isValid: false,
        error: `${fieldName} must be between ${min} and ${max}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate array is not empty
   *
   * @param array - Array to validate
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  static validateNonEmptyArray(array: readonly any[] | any[] | undefined, fieldName: string): FieldValidationResult {
    if (!array || array.length === 0) {
      return {
        isValid: false,
        error: `At least one ${fieldName} must be specified`,
      };
    }

    return { isValid: true };
  }
}