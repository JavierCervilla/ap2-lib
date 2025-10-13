/**
 * Comprehensive Checksum Validator (Final Corrected Version)
 *
 * Implements multi-level checksum validation for JWT tokens and cart contents.
 * Provides enhanced integrity verification beyond basic signature checking.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { MerchantAuthorizationPayload } from './interfaces.ts';

// --- Interfaces (sin cambios) ---
export interface ChecksumValidationResult {
  valid: boolean;
  components: { header: boolean; payload: boolean; cartHash: boolean; structure: boolean; };
  errors: string[];
  checksums?: { expectedCartHash: string; actualCartHash: string; payloadChecksum: string; headerChecksum: string; };
}
export interface JWTComponentValidation {
  valid: boolean;
  type: 'header' | 'payload' | 'signature';
  checksum: string;
  error?: string;
}
export interface IChecksumValidator {
  validateJWTChecksums(jwt: string, expectedCartContents: unknown, payload?: MerchantAuthorizationPayload): Promise<ChecksumValidationResult>;
  validateJWTComponents(jwt: string): Promise<JWTComponentValidation[]>;
  computeRobustCartHash(cartContents: unknown): string;
  validatePayloadStructure(payload: MerchantAuthorizationPayload): boolean;
}
export interface CartCanonicalizationOptions {
  sortKeys?: boolean;
  removeUndefined?: boolean;
  normalizeWhitespace?: boolean;
  sortArrays?: boolean;
}

/**
 * Valida recursivamente un objeto contra los límites de profundidad y número de propiedades.
 * @returns Un array de strings de error. Vacío si es válido.
 */
function validateObjectLimits(
  obj: unknown,
  options: { maxDepth: number; maxProperties: number },
  currentDepth = 1
): string[] {
  if (obj === null || typeof obj !== 'object') {
    return [];
  }
  if (currentDepth > options.maxDepth) {
    return [`Object exceeds max depth of ${options.maxDepth}`];
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const errors = validateObjectLimits(item, options, currentDepth + 1);
      if (errors.length > 0) return errors;
    }
  } else {
    const keys = Object.keys(obj);
    if (keys.length > options.maxProperties) {
      return [`Object exceeds property limit of ${options.maxProperties}`];
    }
    for (const key of keys) {
      const errors = validateObjectLimits((obj as Record<string, unknown>)[key], options, currentDepth + 1);
      if (errors.length > 0) return errors;
    }
  }
  return [];
}

export class ChecksumValidator implements IChecksumValidator {
  private config: {
    strictMode: boolean;
    maxObjectDepth: number;
    maxObjectProperties: number;
    canonicalization: Required<CartCanonicalizationOptions>;
  };

  constructor(
    options: {
      strictMode?: boolean;
      maxObjectDepth?: number;
      maxObjectProperties?: number;
      canonicalization?: CartCanonicalizationOptions;
    } = {}
  ) {
    this.config = {
      strictMode: options.strictMode ?? true,
      maxObjectDepth: options.maxObjectDepth ?? 10,
      maxObjectProperties: options.maxObjectProperties ?? 100,
      canonicalization: {
        sortKeys: options.canonicalization?.sortKeys ?? true,
        removeUndefined: options.canonicalization?.removeUndefined ?? true,
        normalizeWhitespace: options.canonicalization?.normalizeWhitespace ?? true,
        sortArrays: options.canonicalization?.sortArrays ?? false,
      }
    };
  }

  async validateJWTChecksums(
    jwt: string,
    expectedCartContents: unknown,
    payload?: MerchantAuthorizationPayload
  ): Promise<ChecksumValidationResult> {
    const result: ChecksumValidationResult = {
      valid: false,
      components: { header: false, payload: false, cartHash: false, structure: false },
      errors: [],
      checksums: { expectedCartHash: '', actualCartHash: '', payloadChecksum: '', headerChecksum: '' }
    };

    try {
      if (this.config.strictMode) {
        const limitErrors = validateObjectLimits(expectedCartContents, {
          maxDepth: this.config.maxObjectDepth,
          maxProperties: this.config.maxObjectProperties,
        });
        if (limitErrors.length > 0) {
          result.errors.push(...limitErrors);
          return result; // Falla inmediatamente
        }
      }

      const parts = jwt.split('.');
      if (parts.length !== 3) {
        result.errors.push('Invalid JWT format - must have 3 parts');
        return result;
      }
      const [, payloadB64, ] = parts;

      const componentValidations = await this.validateJWTComponents(jwt);
      const headerValidation = componentValidations.find(v => v.type === 'header')!;
      const payloadValidation = componentValidations.find(v => v.type === 'payload')!;

      result.components.header = headerValidation.valid;
      result.checksums!.headerChecksum = headerValidation.checksum;
      if (!headerValidation.valid) result.errors.push(headerValidation.error || 'Header validation failed');

      result.components.payload = payloadValidation.valid;
      result.checksums!.payloadChecksum = payloadValidation.checksum;
      if (!payloadValidation.valid) result.errors.push(payloadValidation.error || 'Payload validation failed');

      let actualPayload = payload;
      if (!actualPayload) {
        try {
          actualPayload = JSON.parse(atob(payloadB64)) as MerchantAuthorizationPayload;
        } catch (_error) {
          result.errors.push('Failed to decode JWT payload');
          return result;
        }
      }

      result.components.structure = await this.validatePayloadStructure(actualPayload);
      if (!result.components.structure) result.errors.push('Invalid payload structure');

      if (actualPayload.cart_hash) {
        const expectedCartHash = await this.computeRobustCartHash(expectedCartContents);
        const actualCartHash = actualPayload.cart_hash;
        result.checksums!.expectedCartHash = expectedCartHash;
        result.checksums!.actualCartHash = actualCartHash;
        result.components.cartHash = expectedCartHash === actualCartHash;
        if (!result.components.cartHash) {
          result.errors.push(`Cart hash mismatch`);
        }
      } else {
        result.errors.push('Missing cart_hash in JWT payload');
      }

      result.valid = result.components.header && result.components.payload && result.components.cartHash && result.components.structure;
    } catch (error) {
      result.errors.push(`Checksum validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
  }

  async validateJWTComponents(jwt: string): Promise<JWTComponentValidation[]> {
    const results: JWTComponentValidation[] = [];
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const [headerB64, payloadB64, signatureB64] = parts;

      try {
        const headerJson = atob(headerB64);
        const header = JSON.parse(headerJson);
        results.push({
          valid: this.isValidJWTHeader(header),
          type: 'header',
          checksum: bytesToHex(sha256(new TextEncoder().encode(headerJson))),
          error: this.isValidJWTHeader(header) ? undefined : 'Invalid JWT header structure'
        });
      } catch (e: unknown) { results.push({ valid: false, type: 'header', checksum: '', error: `Header validation failed: ${e instanceof Error ? e.message : String(e)}` }); }

      try {
        const payloadJson = atob(payloadB64);
        const payload = JSON.parse(payloadJson);
        results.push({
          valid: await this.validatePayloadStructure(payload),
          type: 'payload',
          checksum: bytesToHex(sha256(new TextEncoder().encode(payloadJson))),
          error: await this.validatePayloadStructure(payload) ? undefined : 'Invalid JWT payload structure'
        });
      } catch (e: unknown) { results.push({ valid: false, type: 'payload', checksum: '', error: `Payload validation failed: ${e instanceof Error ? e.message : String(e)}` }); }

      try {
        results.push({
          valid: this.isValidBase64Url(signatureB64),
          type: 'signature',
          checksum: bytesToHex(sha256(new TextEncoder().encode(signatureB64))),
          error: this.isValidBase64Url(signatureB64) ? undefined : 'Invalid signature format'
        });
      } catch (e: unknown) { results.push({ valid: false, type: 'signature', checksum: '', error: `Signature validation failed: ${e instanceof Error ? e.message : String(e)}` }); }

    } catch (e: unknown) { results.push({ valid: false, type: 'header', checksum: '', error: `JWT component validation failed: ${e instanceof Error ? e.message : String(e)}` }); }
    return results;
  }

  computeRobustCartHash(cartContents: unknown): string {
    try {
      const canonicalObject = this.canonicalizeCartContents(cartContents);
      const canonicalJson = JSON.stringify(canonicalObject);
      const hash = sha256(new TextEncoder().encode(canonicalJson));
      return bytesToHex(hash);
    } catch (error) {
      throw new Error(`Failed to compute robust cart hash: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validatePayloadStructure(payload: MerchantAuthorizationPayload): boolean {
    try {
      const requiredFields = ['iss', 'sub', 'aud', 'cart_hash'];
      for (const field of requiredFields) {
        if (typeof (payload as any)[field] !== 'string' || !(payload as any)[field]) return false;
      }
      if (payload.iat !== undefined && typeof payload.iat !== 'number') return false;
      if (payload.exp !== undefined && typeof payload.exp !== 'number') return false;
      if (payload.iat && payload.exp && payload.exp <= payload.iat) return false;
      return true;
    } catch { return false; }
  }

  private canonicalizeCartContents(contents: unknown): unknown {
    const options = this.config.canonicalization;
    if (contents === null || typeof contents !== 'object') {
      if (typeof contents === 'string' && options.normalizeWhitespace) {
        return contents.trim().replace(/\s+/g, ' ');
      }
      return contents;
    }
    if (Array.isArray(contents)) {
      const canonicalized = contents.map(item => this.canonicalizeCartContents(item));
      if (options.sortArrays) {
        canonicalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      }
      return canonicalized;
    }
    const obj = contents as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const keys = options.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);
    for (const key of keys) {
      const value = obj[key];
      if (value === undefined && options.removeUndefined) continue;
      result[key] = this.canonicalizeCartContents(value);
    }
    return result;
  }

  private isValidJWTHeader(header: unknown): boolean {
    if (!header || typeof header !== 'object') return false;
    const h = header as Record<string, unknown>;
    if (!h.alg || typeof h.alg !== 'string') return false;
    if (h.typ && h.typ !== 'JWT') return false;
    const supportedAlgs = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
    return supportedAlgs.includes(h.alg);
  }

  private isValidBase64Url(str: string): boolean {
    return /^[A-Za-z0-9_-]+$/.test(str) && str.length > 0;
  }
}

export const defaultChecksumValidator = new ChecksumValidator();