// core/mandates/shared/mandate-class-factory.ts

import type { Mandate } from "../../../types/mod.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { IntentMandateClass } from "../intent/intent-mandate-class.ts";
import { CartMandateClass } from "../cart/cart-mandate-class.ts";
import { isIntentMandate, isCartMandate, getMandateType } from "../../../types/guards.ts";

export type { MandateStatus } from "./base-mandate.ts";

export function createMandateClass(
  mandate: Mandate,
  options?: { privateKey?: string; publicKey?: string; validateSignature?: boolean }
): Promise<IntentMandateClass | CartMandateClass> {
  if (isIntentMandate(mandate)) {
    return IntentMandateClass.createNew(mandate);
  }

  if (isCartMandate(mandate)) {
    if (mandate.merchant_authorization) {
      return CartMandateClass.fromSigned(
        mandate,
        options?.publicKey,
        options?.validateSignature
      );
    }
    return CartMandateClass.createNew(mandate);
  }

  const type = getMandateType(mandate);
  throw new MandateValidationError(`Unknown mandate type: ${type}`);
}
