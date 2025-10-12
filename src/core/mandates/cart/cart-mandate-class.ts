/**
 * CartMandate Class
 *
 * Object-oriented implementation for CartMandate following SOLID principles.
 * Uses JWT for merchant_authorization as per AP2 specification.
 */

import type { CartMandate } from "../../../types/mod.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { jwtService, type JWTKeyConfig, type JWTAlgorithm } from "../../jwt/mod.ts";
import { CartMandateValidator } from "./cart-mandate-validator.ts";
import { CartMandateSerializer } from "./cart-mandate-serializer.ts";
import { BaseMandate, type MandateStatus } from "../shared/base-mandate.ts";

/**
 * Class for CartMandate with specific functionality
 * Uses JWT for merchant_authorization as per AP2 specification
 */
export class CartMandateClass extends BaseMandate<CartMandate> {
  private validator: CartMandateValidator;
  private serializer: CartMandateSerializer;
  private _merchantAuthorization?: string; // JWT token

  private constructor(data: CartMandate, options?: {
    id?: string;
    createdAt?: Date;
    status?: MandateStatus;
    signature?: string;
    merchantAuthorization?: string;
  }) {
    super(data, options);
    this.validator = new CartMandateValidator();
    this.serializer = CartMandateSerializer.create();
    this._merchantAuthorization = options?.merchantAuthorization;
  }

  protected async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`CartMandate validation failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Sign mandate using JWT with merchant authorization
   * Creates a JWT with cart hash for integrity verification
   */
  override async sign(
    privateKey: string,
    keyConfig: Partial<JWTKeyConfig> = {},
    merchantInfo: { merchantId: string }
  ): Promise<void> {
    try {
      const payload = {
        iss: merchantInfo.merchantId,
        sub: merchantInfo.merchantId,
        aud: "payment-processor",
        cart_hash: await jwtService.computeCartHash(this._data.contents),
      };

      // Create key config with defaults
      const fullKeyConfig: JWTKeyConfig = {
        privateKey,
        publicKey: '', // Will be derived from private key if needed
        algorithm: keyConfig.algorithm || 'RS256',
        keyId: keyConfig.keyId,
      };

      // Sign with JWT service
      const jwt = await jwtService.signMerchantAuthorization(payload, {
        keyConfig: fullKeyConfig,
        expiresIn: 900, // 15 minutes
      });

      this._merchantAuthorization = jwt;
      this._signature = jwt;
      this._status = 'authorized';
    } catch (error) {
      throw new MandateValidationError(`Failed to sign CartMandate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify mandate signature using JWT
   */
  override async verify(
    publicKey: string,
    keyConfig?: Partial<JWTKeyConfig>,
    expectedMerchantId?: string,
    expectedAudience?: string
  ): Promise<boolean> {
    if (!this._merchantAuthorization && !this._signature) {
      return false;
    }

    try {
      const jwt = this._merchantAuthorization || this._signature;
      if (!jwt) return false;

      // Default key configuration
      const defaultKeyConfig: JWTKeyConfig = {
        privateKey: '', // Not needed for verification
        publicKey,
        algorithm: 'RS256' as JWTAlgorithm,
        keyId: keyConfig?.keyId
      };

      // Use standard JWT verification with enhanced validation
      const verificationResult = await jwtService.verifyMerchantAuthorization(jwt, {
        keyConfig: { ...defaultKeyConfig, ...keyConfig },
        audience: expectedAudience,
        issuer: expectedMerchantId,
        verifyExp: true
      });

      if (!verificationResult.valid || !verificationResult.payload) {
        // Log detailed validation errors for debugging
        if (verificationResult.validationErrors?.length) {
          console.warn('JWT validation failed:', verificationResult.validationErrors);
        }
        return false;
      }

      // Verify cart hash integrity using the same method as used during signing
      const expectedCartHash = await jwtService.computeCartHash(this._data.contents);
      const actualCartHash = verificationResult.payload.cart_hash;

      if (expectedCartHash !== actualCartHash) {
        console.warn('Cart hash mismatch:', { expected: expectedCartHash, actual: actualCartHash });
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get merchant authorization JWT token
   */
  getMerchantAuthorization(): string | undefined {
    return this._merchantAuthorization;
  }

  /**
   * Check if mandate is signed (overrides base class for JWT support)
   */
  override isSigned(): boolean {
    return !!this._signature || !!this._merchantAuthorization;
  }

  toString(): string {
    const data = this._data;
    const contents = data.contents;

    let description = `Cart Mandate (ID: ${this._id})\n`;
    description += `Status: ${this._status}\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Cart ID: ${contents.id}\n`;
    description += `Merchant: ${contents.merchant_name}\n`;
    description += `Cart Expires: ${new Date(contents.cart_expiry).toLocaleString()}\n`;
    description += `User Confirmation Required: ${contents.user_cart_confirmation_required}\n`;

    // Payment request details
    const paymentRequest = contents.payment_request;
    if (paymentRequest.details) {
      description += `Total: ${paymentRequest.details.total?.amount?.value} ${paymentRequest.details.total?.amount?.currency}\n`;

      if (paymentRequest.details.displayItems && paymentRequest.details.displayItems.length > 0) {
        description += `Items:\n`;
        paymentRequest.details.displayItems.forEach(item => {
          description += `  - ${item.label}: ${item.amount.value} ${item.amount.currency}\n`;
        });
      }
    }

    description += `Signed: ${this.isSigned() ? 'Yes' : 'No'}`;

    return description;
  }

  /**
   * Create a new CartMandate
   */
  static async createNew(
    data: CartMandate,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: MandateStatus;
      signature?: string;
      merchantAuthorization?: string;
    },
    signingOptions?: {
      privateKey: string;
      algorithm: JWTAlgorithm;
      merchantId: string;
    }
  ): Promise<CartMandateClass> {
    const mandate = new CartMandateClass(data, options);

    // Validate the data
    await mandate.validate();

    // Sign if signing options provided
    if (signingOptions) {
      await mandate.sign(signingOptions.privateKey, {
        algorithm: signingOptions.algorithm
      }, {
        merchantId: signingOptions.merchantId
      });
    }

    return mandate;
  }

  /**
   * Create from existing signed mandate
   */
  static async fromSigned(
    signedMandate: CartMandate & { merchant_authorization?: string },
    publicKey?: string,
    validateSignature = true,
    keyConfig?: Partial<JWTKeyConfig>,
    expectedMerchantId?: string,
    expectedAudience?: string
  ): Promise<CartMandateClass> {
    const mandate = new CartMandateClass(signedMandate, {
      signature: signedMandate.merchant_authorization,
      merchantAuthorization: signedMandate.merchant_authorization
    });

    // Validate the data
    await mandate.validate();

    // Verify signature if required
    if (publicKey && validateSignature) {
      const isValid = await mandate.verify(publicKey, keyConfig, expectedMerchantId, expectedAudience);
      if (!isValid) {
        throw new MandateValidationError("Invalid JWT signature or cart hash mismatch");
      }
    }

    return mandate;
  }
}