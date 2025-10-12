/**
 * Serialization interfaces
 *
 * Defines contracts for serialization operations following the Interface Segregation Principle.
 */

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