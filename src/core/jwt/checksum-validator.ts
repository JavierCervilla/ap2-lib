/**
 * Comprehensive Checksum Validator
 *
 * Implements multi-level checksum validation for JWT tokens and cart contents.
 * Provides enhanced integrity verification beyond basic signature checking.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { MerchantAuthorizationPayload } from './interfaces.ts';

/**
 * Checksum validation result with detailed information
 */
export interface ChecksumValidationResult {
  /** Overall validation result */
  valid: boolean;
  /** Specific validation results for different components */
  components: {
    /** JWT header checksum validation */
    header: boolean;
    /** JWT payload checksum validation */
    payload: boolean;
    /** Cart hash integrity validation */
    cartHash: boolean;
    /** Payload structure validation */
    structure: boolean;
  };
  /** Detailed error messages */
  errors: string[];
  /** Computed checksums for debugging */
  checksums?: {
    expectedCartHash: string;
    actualCartHash: string;
    payloadChecksum: string;
    headerChecksum: string;
  };
}

/**
 * JWT component validation result
 */
export interface JWTComponentValidation {
  /** Whether the component is valid */
  valid: boolean;
  /** Component type */
  type: 'header' | 'payload' | 'signature';
  /** Checksum of the component */
  checksum: string;
  /** Error message if invalid */
  error?: string;
}

/**
 * Interface for comprehensive checksum validation
 */
export interface IChecksumValidator {
  /**
   * Validate complete JWT checksum integrity
   */
  validateJWTChecksums(
    jwt: string,
    expectedCartContents: unknown,
    payload?: MerchantAuthorizationPayload
  ): Promise<ChecksumValidationResult>;

  /**
   * Validate individual JWT components
   */
  validateJWTComponents(jwt: string): Promise<JWTComponentValidation[]>;

  /**
   * Compute comprehensive cart hash with canonicalization
   */
  computeRobustCartHash(cartContents: unknown): Promise<string>;

  /**
   * Validate payload structure and required fields
   */
  validatePayloadStructure(payload: MerchantAuthorizationPayload): Promise<boolean>;
}

/**
 * Enhanced cart canonicalization options
 */
export interface CartCanonicalizationOptions {
  /** Sort object keys recursively */
  sortKeys?: boolean;
  /** Remove undefined values */
  removeUndefined?: boolean;
  /** Normalize whitespace in strings */
  normalizeWhitespace?: boolean;
  /** Sort arrays consistently */
  sortArrays?: boolean;
}

/**
 * Comprehensive Checksum Validator implementation
 * Provides multi-level integrity verification for JWT tokens
 */
export class ChecksumValidator implements IChecksumValidator {
  constructor(
    private options: {
      /** Enable strict mode for enhanced validation */
      strictMode?: boolean;
      /** Cart canonicalization options */
      canonicalization?: CartCanonicalizationOptions;
    } = {}
  ) {
    this.options = {
      strictMode: true,
      canonicalization: {
        sortKeys: true,
        removeUndefined: true,
        normalizeWhitespace: true,
        sortArrays: false
      },
      ...options
    };
  }

  async validateJWTChecksums(
    jwt: string,
    expectedCartContents: unknown,
    payload?: MerchantAuthorizationPayload
  ): Promise<ChecksumValidationResult> {
    const result: ChecksumValidationResult = {
      valid: false,
      components: {
        header: false,
        payload: false,
        cartHash: false,
        structure: false
      },
      errors: [],
      checksums: {
        expectedCartHash: '',
        actualCartHash: '',
        payloadChecksum: '',
        headerChecksum: ''
      }
    };

    try {
      // Validate JWT format
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        result.errors.push('Invalid JWT format - must have 3 parts');
        return result;
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Validate JWT components
      const componentValidations = await this.validateJWTComponents(jwt);
      const headerValidation = componentValidations.find(v => v.type === 'header');
      const payloadValidation = componentValidations.find(v => v.type === 'payload');

      if (headerValidation) {
        result.components.header = headerValidation.valid;
        result.checksums!.headerChecksum = headerValidation.checksum;
        if (!headerValidation.valid) {
          result.errors.push(headerValidation.error || 'Header validation failed');
        }
      }

      if (payloadValidation) {
        result.components.payload = payloadValidation.valid;
        result.checksums!.payloadChecksum = payloadValidation.checksum;
        if (!payloadValidation.valid) {
          result.errors.push(payloadValidation.error || 'Payload validation failed');
        }
      }

      // Decode and validate payload if not provided
      let actualPayload = payload;
      if (!actualPayload) {
        try {
          const decodedPayload = JSON.parse(atob(payloadB64));
          actualPayload = decodedPayload as MerchantAuthorizationPayload;
        } catch (error) {
          result.errors.push('Failed to decode JWT payload');
          return result;
        }
      }

      // Validate payload structure
      result.components.structure = await this.validatePayloadStructure(actualPayload);
      if (!result.components.structure) {
        result.errors.push('Invalid payload structure - missing required fields');
      }

      // Validate cart hash integrity
      if (actualPayload.cart_hash && expectedCartContents) {
        const expectedCartHash = await this.computeRobustCartHash(expectedCartContents);
        const actualCartHash = actualPayload.cart_hash;

        result.checksums!.expectedCartHash = expectedCartHash;
        result.checksums!.actualCartHash = actualCartHash;

        result.components.cartHash = expectedCartHash === actualCartHash;
        if (!result.components.cartHash) {
          result.errors.push(`Cart hash mismatch - expected: ${expectedCartHash}, actual: ${actualCartHash}`);

          // In strict mode, perform additional integrity checks
          if (this.options.strictMode) {
            await this.performStrictIntegrityChecks(expectedCartContents, actualPayload, result);
          }
        }
      } else if (this.options.strictMode) {
        result.errors.push('Missing cart hash or expected cart contents for validation');
      }

      // Overall validation result
      result.valid = result.components.header &&
                    result.components.payload &&
                    result.components.cartHash &&
                    result.components.structure;

    } catch (error) {
      result.errors.push(`Checksum validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  async validateJWTComponents(jwt: string): Promise<JWTComponentValidation[]> {
    const results: JWTComponentValidation[] = [];

    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        return [{
          valid: false,
          type: 'header',
          checksum: '',
          error: 'Invalid JWT format'
        }];
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Validate header component
      try {
        const headerJson = atob(headerB64);
        const header = JSON.parse(headerJson);
        const headerChecksum = bytesToHex(sha256(new TextEncoder().encode(headerJson)));

        results.push({
          valid: this.isValidJWTHeader(header),
          type: 'header',
          checksum: headerChecksum,
          error: this.isValidJWTHeader(header) ? undefined : 'Invalid JWT header structure'
        });
      } catch (error) {
        results.push({
          valid: false,
          type: 'header',
          checksum: '',
          error: `Header validation failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }

      // Validate payload component
      try {
        const payloadJson = atob(payloadB64);
        const payload = JSON.parse(payloadJson);
        const payloadChecksum = bytesToHex(sha256(new TextEncoder().encode(payloadJson)));

        results.push({
          valid: await this.validatePayloadStructure(payload),
          type: 'payload',
          checksum: payloadChecksum,
          error: await this.validatePayloadStructure(payload) ? undefined : 'Invalid JWT payload structure'
        });
      } catch (error) {
        results.push({
          valid: false,
          type: 'payload',
          checksum: '',
          error: `Payload validation failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }

      // Validate signature component (basic format check)
      try {
        // Basic signature format validation
        const signatureValid = this.isValidBase64Url(signatureB64);
        const signatureChecksum = bytesToHex(sha256(new TextEncoder().encode(signatureB64)));

        results.push({
          valid: signatureValid,
          type: 'signature',
          checksum: signatureChecksum,
          error: signatureValid ? undefined : 'Invalid signature format'
        });
      } catch (error) {
        results.push({
          valid: false,
          type: 'signature',
          checksum: '',
          error: `Signature validation failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }

    } catch (error) {
      results.push({
        valid: false,
        type: 'header',
        checksum: '',
        error: `JWT component validation failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    return results;
  }

  async computeRobustCartHash(cartContents: unknown): Promise<string> {
    try {
      // Create canonical representation with enhanced options
      const canonicalContents = this.canonicalizeCartContents(cartContents);

      // Convert to JSON string with sorted keys
      const canonicalJson = JSON.stringify(canonicalContents, this.getSortedKeysReplacer());

      // Compute SHA-256 hash
      const hash = sha256(new TextEncoder().encode(canonicalJson));

      return bytesToHex(hash);
    } catch (error) {
      throw new Error(`Failed to compute robust cart hash: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validatePayloadStructure(payload: MerchantAuthorizationPayload): Promise<boolean> {
    try {
      // Basic required fields - more lenient check for compatibility
      const basicFields = ['iss', 'sub', 'aud'];

      for (const field of basicFields) {
        if (!(field in payload)) {
          return false;
        }
      }

      // Validate basic field types
      if (typeof payload.iss !== 'string' || payload.iss.length === 0) return false;
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) return false;
      if (typeof payload.aud !== 'string' || payload.aud.length === 0) return false;

      // Optional but recommended fields - check if present
      if (payload.iat !== undefined) {
        if (typeof payload.iat !== 'number' || payload.iat <= 0) return false;
      }

      if (payload.exp !== undefined) {
        if (typeof payload.exp !== 'number' || payload.exp <= 0) return false;
        // Only validate timestamp relationship if both are present
        if (payload.iat !== undefined && payload.exp <= payload.iat) return false;
      }

      if (payload.jti !== undefined) {
        if (typeof payload.jti !== 'string' || !/^[0-9a-f]{32}$/i.test(payload.jti)) return false;
      }

      if (payload.cart_hash !== undefined) {
        if (typeof payload.cart_hash !== 'string' || payload.cart_hash.length !== 64) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private canonicalizeCartContents(contents: unknown): unknown {
    const options = this.options.canonicalization!;

    if (contents === null || typeof contents !== 'object') {
      return contents;
    }

    if (Array.isArray(contents)) {
      const canonicalized = contents.map(item => this.canonicalizeCartContents(item));
      return options.sortArrays ? canonicalized.sort() : canonicalized;
    }

    const obj = contents as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    // Get keys and optionally sort them
    const keys = options.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];

      // Remove undefined values if requested
      if (value === undefined && options.removeUndefined) {
        continue;
      }

      // Normalize whitespace in strings if requested
      if (typeof value === 'string' && options.normalizeWhitespace) {
        result[key] = value.trim().replace(/\s+/g, ' ');
      } else {
        result[key] = this.canonicalizeCartContents(value);
      }
    }

    return result;
  }

  private getSortedKeysReplacer() {
    return (key: string, value: unknown) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sortedObj: Record<string, unknown> = {};
        Object.keys(value).sort().forEach(sortedKey => {
          sortedObj[sortedKey] = (value as Record<string, unknown>)[sortedKey];
        });
        return sortedObj;
      }
      return value;
    };
  }

  private isValidJWTHeader(header: unknown): boolean {
    if (!header || typeof header !== 'object') return false;

    const h = header as Record<string, unknown>;

    // Must have alg field
    if (!h.alg || typeof h.alg !== 'string') return false;

    // Optional typ field should be 'JWT' if present
    if (h.typ && h.typ !== 'JWT') return false;

    // Algorithm should be one of the supported ones
    const supportedAlgs = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
    return supportedAlgs.includes(h.alg);
  }

  private isValidBase64Url(str: string): boolean {
    // Base64URL should only contain URL-safe characters
    return /^[A-Za-z0-9_-]+$/.test(str) && str.length > 0;
  }

  private async performStrictIntegrityChecks(
    expectedContents: unknown,
    payload: MerchantAuthorizationPayload,
    result: ChecksumValidationResult
  ): Promise<void> {
    // Additional integrity checks in strict mode

    // Check if cart contents have been tampered with structurally
    try {
      const expectedSerialized = JSON.stringify(expectedContents);
      const expectedLength = expectedSerialized.length;

      if (expectedLength === 0) {
        result.errors.push('Strict mode: Empty cart contents detected');
      }

      // Check for suspicious modifications
      if (typeof expectedContents === 'object' && expectedContents !== null) {
        const obj = expectedContents as Record<string, unknown>;

        // Check for suspicious large objects that might indicate injection
        if (Object.keys(obj).length > 1000) {
          result.errors.push('Strict mode: Unusually large cart object detected');
        }

        // Check for nested depth that might indicate attack
        const depth = this.getObjectDepth(obj);
        if (depth > 10) {
          result.errors.push('Strict mode: Excessive object nesting detected');
        }
      }

    } catch (error) {
      result.errors.push(`Strict mode integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getObjectDepth(obj: unknown, currentDepth = 0): number {
    if (obj === null || typeof obj !== 'object') return currentDepth;

    if (Array.isArray(obj)) {
      return Math.max(...obj.map(item => this.getObjectDepth(item, currentDepth + 1)));
    }

    const depths = Object.values(obj as Record<string, unknown>)
      .map(value => this.getObjectDepth(value, currentDepth + 1));

    return depths.length === 0 ? currentDepth : Math.max(...depths);
  }
}

// Export default instance
export const defaultChecksumValidator = new ChecksumValidator();