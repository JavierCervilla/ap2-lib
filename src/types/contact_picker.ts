/**
 * Contact Picker and W3C Payment API Types
 *
 * TypeScript implementations of the W3C Contact Picker API and Payment Request API types
 * as used by the Agent Payments Protocol (AP2).
 */

/**
 * Represents a physical address from the W3C Contact Picker API.
 *
 * This interface is used throughout the payment flow to capture
 * shipping and billing address information.
 */
export interface ContactAddress {
  /** The city or locality */
  readonly city?: string;

  /** The country code (ISO 3166-1 alpha-2) */
  readonly country?: string;

  /**
   * The dependent locality or sublocality.
   * For example, used in some countries to represent districts.
   */
  readonly dependent_locality?: string;

  /** The organization name */
  readonly organization?: string;

  /** The phone number */
  readonly phone_number?: string;

  /** The postal code or ZIP code */
  readonly postal_code?: string;

  /** The recipient name */
  readonly recipient?: string;

  /** The region, state, or province */
  readonly region?: string;

  /** The sorting code (used in some countries) */
  readonly sorting_code?: string;

  /** Array of address lines (street address) */
  readonly address_line?: readonly string[];
}
