/**
 * Shared Mandate Module
 *
 * Exports all shared mandate functionality including base classes, detectors, validators, etc.
 */

// Base classes
export { BaseMandate, type MandateStatus } from "./base-mandate.ts";

// Interfaces and utilities
export * from "./interfaces.ts";
export * from "./rules.ts";

// Type detection
export {
  MandateType,
  type MandateTypeDetector,
  type MandateTypeDetectionResult,
  BaseMandateTypeDetector,
  MandateTypeDetectorRegistry,
  defaultMandateTypeDetector
} from "./mandate-type-detector.ts";

// Factories
export {
  createMandateClass,
  type MandateStatus as FactoryMandateStatus
} from "./mandate-class-factory.ts";

export {
  createIntentMandate,
  createCartMandate,
  createMandateFromData,
  type CreateIntentMandateParams,
  type CreateCartContentsParams,
  type CreateCartMandateParams
} from "./mandate-factory.ts";

// Shared validators and serializers
export { PaymentRequestValidator } from "./payment-request-validator.ts";
export { PaymentRequestSerializer } from "./payment-request-serializer.ts";

// Strategy patterns
export * from "./mandate-validator-strategy.ts";
export * from "./mandate-serialization-strategy.ts";