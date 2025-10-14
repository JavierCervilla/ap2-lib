/**
 * Mandate Serialization Strategy
 *
 * Implements strategy pattern for mandate serialization using the type detection system.
 */

import type { Mandate, IntentMandate, CartMandate } from "../../../types/mod.ts";
import { SerializerDeserializer } from "./interfaces.ts";
import { IntentMandateSerializer } from "../intent/intent-mandate-serializer.ts";
import { CartMandateSerializer } from "../cart/cart-mandate-serializer.ts";
import { MandateType, MandateTypeDetectorRegistry, defaultMandateTypeDetector } from "./mandate-type-detector.ts";
import { SERIALIZATION_MESSAGES } from "../../config/validation-messages.ts";

/**
 * Interface for mandate serialization strategies
 */
export interface MandateSerializationStrategy<T extends Mandate = Mandate> {
  serialize(mandate: T): Promise<string>;
  deserialize(json: string): Promise<T>;
  canHandle(mandateType: MandateType): boolean;
}

/**
 * Abstract base class for serialization strategies
 */
export abstract class BaseMandateSerializationStrategy<T extends Mandate> implements MandateSerializationStrategy<T> {
  protected readonly serializer: SerializerDeserializer<T>;

  constructor(serializer: SerializerDeserializer<T>) {
    this.serializer = serializer;
  }

  async serialize(mandate: T): Promise<string> {
    return await this.serializer.serialize(mandate);
  }

  async deserialize(json: string): Promise<T> {
    return await this.serializer.deserialize(json);
  }

  abstract canHandle(mandateType: MandateType): boolean;
}

/**
 * Serialization strategy for IntentMandate
 */
export class IntentMandateSerializationStrategy extends BaseMandateSerializationStrategy<IntentMandate> {
  constructor() {
    super(IntentMandateSerializer.create());
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.INTENT;
  }
}

/**
 * Serialization strategy for CartMandate
 */
export class CartMandateSerializationStrategy extends BaseMandateSerializationStrategy<CartMandate> {
  constructor() {
    super(CartMandateSerializer.create());
  }

  canHandle(mandateType: MandateType): boolean {
    return mandateType === MandateType.CART;
  }
}

/**
 * Registry for mandate serialization strategies
 */
export class MandateSerializationStrategyRegistry {
  private readonly strategies: Map<MandateType, MandateSerializationStrategy> = new Map();
  private readonly typeDetector: MandateTypeDetectorRegistry;

  constructor(typeDetector: MandateTypeDetectorRegistry = defaultMandateTypeDetector) {
    this.typeDetector = typeDetector;

    // Register default strategies
    this.registerStrategy(new IntentMandateSerializationStrategy());
    this.registerStrategy(new CartMandateSerializationStrategy());
  }

  /**
   * Register a serialization strategy
   */
  registerStrategy(strategy: MandateSerializationStrategy): void {
    for (const type of Object.values(MandateType)) {
      if (type !== MandateType.UNKNOWN && strategy.canHandle(type)) {
        this.strategies.set(type, strategy);
      }
    }
  }

  /**
   * Get strategy for a specific mandate type
   */
  getStrategy(mandateType: MandateType): MandateSerializationStrategy | undefined {
    return this.strategies.get(mandateType);
  }

  /**
   * Serialize mandate by detecting type and using appropriate strategy
   */
  async serializeMandate(mandate: Mandate): Promise<string> {
    const mandateType = this.typeDetector.detectType(mandate);

    if (mandateType === MandateType.UNKNOWN) {
      throw new Error("Unknown mandate type");
    }

    const strategy = this.getStrategy(mandateType);
    if (!strategy) {
      throw new Error(`No serialization strategy found for mandate type: ${mandateType}`);
    }

    return await strategy.serialize(mandate);
  }

  /**
   * Deserialize mandate by detecting type from JSON and using appropriate strategy
   */
  async deserializeMandate(json: string): Promise<Mandate> {
    // Parse JSON to detect type
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error(SERIALIZATION_MESSAGES.INVALID_JSON);
    }

    const mandateType = this.typeDetector.detectType(parsed);

    if (mandateType === MandateType.UNKNOWN) {
      throw new Error(SERIALIZATION_MESSAGES.UNKNOWN_MANDATE_TYPE);
    }

    const strategy = this.getStrategy(mandateType);
    if (!strategy) {
      throw new Error(`No serialization strategy found for mandate type: ${mandateType}`);
    }

    return await strategy.deserialize(json);
  }

  /**
   * Static method to serialize a mandate using the default registry
   */
  static async serialize(mandate: Mandate): Promise<string> {
    return await defaultMandateSerializationRegistry.serializeMandate(mandate);
  }

  /**
   * Static method to deserialize a mandate using the default registry
   */
  static async deserialize(json: string): Promise<Mandate> {
    return await defaultMandateSerializationRegistry.deserializeMandate(json);
  }
}

/**
 * Default singleton instance
 */
export const defaultMandateSerializationRegistry: MandateSerializationStrategyRegistry = new MandateSerializationStrategyRegistry();