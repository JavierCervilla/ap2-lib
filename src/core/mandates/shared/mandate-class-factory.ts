/**
 * Mandate Class Factory
 *
 * Factory functions for creating mandate class instances.
 */

import type { IntentMandate, CartMandate, Mandate } from "../../../types/mod.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { IntentMandateClass } from "../intent/intent-mandate-class.ts";
import { CartMandateClass } from "../cart/cart-mandate-class.ts";
import { MandateType, defaultMandateTypeDetector } from "./mandate-type-detector.ts";

// Re-export MandateStatus from BaseMandate
export type { MandateStatus } from "./base-mandate.ts";

/**
 * Factory function to create mandate classes from generic mandate data
 */
export async function createMandateClass(
  mandate: Mandate,
  options?: { privateKey?: string; publicKey?: string; validateSignature?: boolean }
): Promise<IntentMandateClass | CartMandateClass> {
  const mandateType = defaultMandateTypeDetector.detectType(mandate);

  switch (mandateType) {
    case MandateType.INTENT:
      // IntentMandates are never signed according to AP2 specification
      return IntentMandateClass.createNew(mandate as IntentMandate);

    case MandateType.CART:
      if ('merchant_authorization' in (mandate as any)) {
        return CartMandateClass.fromSigned(
          mandate as CartMandate & { merchant_authorization?: string },
          options?.publicKey,
          options?.validateSignature
        );
      } else {
        return CartMandateClass.createNew(mandate as CartMandate);
      }

    default:
      throw new MandateValidationError(`Unknown mandate type: ${mandateType}`);
  }
}