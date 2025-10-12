/**
 * Cryptographic Functions for AP2
 *
 * ECDSA-based signing and verification functions for the Agent Payments Protocol.
 * Uses Web Crypto API for secure cryptographic operations.
 */

import type { IntentMandate, CartMandate, Mandate } from "../types/mod.ts";
import {
  CryptographicError,
  SignatureVerificationError,
} from "../utils/mod.ts";
import { MandateType, defaultMandateTypeDetector } from "./mandates/shared/mod.ts";

/**
 * Converts Uint8Array to hex string
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
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
 * ECDSA Key pair for signing and verification
 */
export interface ECDSAKeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * ECDSA signature components
 */
export interface ECDSASignature {
  r: string;
  s: string;
  v: number;
}

/**
 * Result of signature verification
 */
export interface VerificationResult {
  isValid: boolean;
  publicKey?: string;
  error?: string;
}

/**
 * Generates a new ECDSA key pair using secp256k1 curve
 *
 * @returns Promise resolving to a new key pair
 * @throws CryptographicError if key generation fails
 */
export async function generateKeyPair(): Promise<ECDSAKeyPair> {
  try {
    // Generate ECDSA key pair using P-256 curve (Web Crypto API standard)
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    // Export keys to raw format
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);

    // Convert to hex strings
    const privateKeyHex = Array.from(new Uint8Array(privateKeyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const publicKeyHex = Array.from(new Uint8Array(publicKeyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CryptographicError(`Key generation failed: ${message}`);
  }
}

/**
 * Signs data with a private key using ECDSA
 *
 * @param data - Data to sign
 * @param privateKeyHex - Private key in hex format
 * @returns Promise resolving to ECDSA signature
 * @throws CryptographicError if signing fails
 */
export async function signData(data: string, privateKeyHex: string): Promise<ECDSASignature> {
  try {
    // Validate private key format
    if (!/^[0-9a-fA-F]+$/.test(privateKeyHex)) {
      throw new CryptographicError("Invalid private key format");
    }

    // Convert hex string back to buffer
    const privateKeyBuffer = new Uint8Array(
      privateKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Import private key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"]
    );

    // Encode data as UTF-8
    const dataBuffer = new TextEncoder().encode(data);

    // Sign the data
    const signatureBuffer = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      privateKey,
      dataBuffer
    );

    // Parse signature to extract r, s components
    // Web Crypto API returns signatures in P1363 format (r||s concatenated), not DER format
    const signature = new Uint8Array(signatureBuffer);
    const halfLength = signature.length / 2;
    const rBytes = signature.slice(0, halfLength);
    const sBytes = signature.slice(halfLength);

    const r = uint8ArrayToHex(rBytes);
    const s = uint8ArrayToHex(sBytes);

    return {
      r: r,
      s: s,
      v: 0, // Recovery ID - simplified for this implementation
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CryptographicError(`Signing failed: ${message}`);
  }
}

/**
 * Verifies a signature against data and public key
 *
 * @param data - Original data that was signed
 * @param signature - ECDSA signature to verify
 * @param publicKeyHex - Public key in hex format
 * @returns Promise resolving to verification result
 * @throws CryptographicError if verification process fails
 */
export async function verifySignature(
  data: string,
  signature: ECDSASignature,
  publicKeyHex: string
): Promise<VerificationResult> {
  // Validate signature format - throw immediately for malformed signatures
  if (!/^[0-9a-fA-F]+$/.test(signature.r) || !/^[0-9a-fA-F]+$/.test(signature.s)) {
    throw new CryptographicError("Invalid signature format");
  }

  // Validate recovery ID - throw immediately for invalid recovery ID
  if (signature.v < 0 || signature.v > 3) {
    throw new CryptographicError("Invalid signature format");
  }

  try {

    // Convert hex string back to buffer
    const publicKeyBuffer = new Uint8Array(
      publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Import public key
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    // Reconstruct P1363 signature (r||s) from components for Web Crypto API
    const rBytes = hexToUint8Array(signature.r);
    const sBytes = hexToUint8Array(signature.s);
    const p1363Signature = new Uint8Array(rBytes.length + sBytes.length);
    p1363Signature.set(rBytes, 0);
    p1363Signature.set(sBytes, rBytes.length);

    // Encode data as UTF-8
    const dataBuffer = new TextEncoder().encode(data);

    // Verify signature
    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      publicKey,
      p1363Signature,
      dataBuffer
    );

    return {
      isValid,
      publicKey: isValid ? publicKeyHex : undefined,
      error: isValid ? undefined : "Signature verification failed",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      error: `Verification error: ${message}`,
    };
  }
}

/**
 * Signs data with a private key using ECDSA (legacy function)
 *
 * NOTE: This function is kept for backward compatibility but should not be used
 * for new mandate types. CartMandates use JWT signing, and IntentMandates are
 * never signed according to AP2 specification.
 *
 * @deprecated Use JWT signing for CartMandate via CartMandateClass.sign()
 */
export async function signMandate<T extends Mandate>(
  mandate: T,
  privateKeyHex: string
): Promise<T & { signature?: string; merchant_authorization?: string }> {
  throw new CryptographicError('signMandate is deprecated. Use CartMandateClass.sign() for JWT-based signing, and note that IntentMandates are never signed according to AP2 specification.');
}

/**
 * Verifies a signed mandate's signature (legacy function)
 *
 * NOTE: This function is kept for backward compatibility but should not be used
 * for new mandate types. CartMandates use JWT verification, and IntentMandates are
 * never signed according to AP2 specification.
 *
 * @deprecated Use CartMandateClass.verify() for JWT-based verification
 */
export async function verifyMandateSignature(
  mandate: Mandate & { signature?: string; merchant_authorization?: string },
  publicKeyHex: string
): Promise<VerificationResult> {
  throw new SignatureVerificationError('verifyMandateSignature is deprecated. Use CartMandateClass.verify() for JWT-based verification, and note that IntentMandates are never signed according to AP2 specification.');
}

