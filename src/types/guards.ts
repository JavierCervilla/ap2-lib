/**
 * Type Guards for AP2 Mandate Types
 *
 * TypeScript type guard functions to safely identify mandate types
 * using the existing MandateTypeDetectorRegistry infrastructure.
 */

import type { Mandate, IntentMandate, CartMandate } from "./mandates.ts";
import { MandateType, defaultMandateTypeDetector } from "../core/strategies/mandate-type-detector.ts";

/**
 * Type guard to check if a mandate is an IntentMandate
 *
 * Uses the existing MandateTypeDetectorRegistry for consistent and
 * extensible type detection across the entire codebase.
 *
 * @param mandate - The mandate to check
 * @returns True if the mandate is an IntentMandate
 */
export function isIntentMandate(mandate: Mandate): mandate is IntentMandate {
  return defaultMandateTypeDetector.detectType(mandate) === MandateType.INTENT;
}

/**
 * Type guard to check if a mandate is a CartMandate
 *
 * Uses the existing MandateTypeDetectorRegistry for consistent and
 * extensible type detection across the entire codebase.
 *
 * @param mandate - The mandate to check
 * @returns True if the mandate is a CartMandate
 */
export function isCartMandate(mandate: Mandate): mandate is CartMandate {
  return defaultMandateTypeDetector.detectType(mandate) === MandateType.CART;
}

/**
 * Get the mandate type using the detector registry
 *
 * @param mandate - The mandate to analyze
 * @returns The detected MandateType
 */
export function getMandateType(mandate: Mandate): MandateType {
  return defaultMandateTypeDetector.detectType(mandate);
}