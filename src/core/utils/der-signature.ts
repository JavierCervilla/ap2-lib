/**
 * DER Signature Utilities
 *
 * Production-ready utilities for encoding and decoding DER signatures using the bip66 library.
 * Follows the Single Responsibility Principle by handling only DER signature operations.
 */

import * as bip66 from "bip66";

/**
 * Parsed DER signature components
 */
export interface DERSignatureComponents {
  r: string;
  s: string;
}

/**
 * Production-ready utility class for DER signature operations using bip66
 */
export class DERSignatureUtils {
  /**
   * Parses DER-encoded signature to extract r, s components
   *
   * Uses the battle-tested bip66 library for correct DER parsing.
   *
   * NOTE: This function is not currently used in the codebase as Web Crypto API
   * returns P1363 format signatures, not DER. Kept for future compatibility.
   *
   * @param signature - DER encoded signature as Uint8Array
   * @returns Object containing r and s components as hex strings
   * @throws Error if signature is invalid DER format
   */
  static parseDERSignature(signature: Uint8Array): DERSignatureComponents {
    try {
      const decoded = bip66.decode(signature);
      return {
        r: DERSignatureUtils.uint8ArrayToHex(decoded.r),
        s: DERSignatureUtils.uint8ArrayToHex(decoded.s),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid DER signature format: ${message}`);
    }
  }

  /**
   * Creates DER signature from r, s components
   *
   * Uses the bip66 library for correct DER encoding following BIP66 standards.
   *
   * NOTE: This function is not currently used in the codebase as Web Crypto API
   * expects P1363 format signatures, not DER. Kept for future compatibility.
   *
   * @param r - R component as hex string
   * @param s - S component as hex string
   * @returns DER encoded signature as Uint8Array
   * @throws Error if r or s components are invalid
   */
  static createDERSignature(r: string, s: string): Uint8Array {
    try {
      // Validate hex strings
      if (!/^[0-9a-fA-F]+$/.test(r) || !/^[0-9a-fA-F]+$/.test(s)) {
        throw new Error("Invalid hex string format for r or s components");
      }

      const rBytes = DERSignatureUtils.hexToUint8Array(r);
      const sBytes = DERSignatureUtils.hexToUint8Array(s);
      const encoded = bip66.encode(rBytes, sBytes);
      return encoded;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create DER signature: ${message}`);
    }
  }

  /**
   * Validates DER signature format
   *
   * Uses bip66 to validate the signature format according to BIP66 standards.
   *
   * NOTE: This function is not currently used in the codebase as Web Crypto API
   * uses P1363 format signatures, not DER. Kept for future compatibility.
   *
   * @param signature - DER signature as Uint8Array
   * @returns True if the signature is valid DER format
   */
  static isValidDERSignature(signature: Uint8Array): boolean {
    try {
      bip66.decode(signature);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Converts hex string to Uint8Array
   *
   * @param hex - Hex string
   * @returns Uint8Array representation
   * @throws Error if hex string is invalid
   */
  static hexToUint8Array(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string length - must be even");
    }

    if (!/^[0-9a-fA-F]*$/.test(hex)) {
      throw new Error("Invalid hex string - contains non-hex characters");
    }

    return new Uint8Array(
      hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
  }

  /**
   * Converts Uint8Array to hex string
   *
   * @param bytes - Uint8Array to convert
   * @returns Hex string representation (lowercase)
   */
  static uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Checks if a hex string represents a valid signature component
   *
   * NOTE: This function is not currently used in the codebase.
   * Kept for future compatibility.
   *
   * @param hex - Hex string to validate
   * @returns True if the hex string is valid for use as r or s component
   */
  static isValidSignatureComponent(hex: string): boolean {
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      return false;
    }

    if (hex.length % 2 !== 0) {
      return false;
    }

    // Check if it can be converted to a valid byte array for bip66
    try {
      const bytes = DERSignatureUtils.hexToUint8Array(hex);
      return bytes.length > 0 && bytes.length <= 33; // Max size for ECDSA components
    } catch {
      return false;
    }
  }
}