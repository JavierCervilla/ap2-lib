/**
 * Configuration for validation rules
 *
 * This module contains configurable constants and settings for validation logic,
 * following the Dependency Inversion Principle by allowing external configuration.
 */

// Import currency-codes library normally
import currencyCodes from "currency-codes";

/**
 * Configuration for payment validation rules
 */
export interface PaymentValidationConfig {
  readonly maxRefundPeriodDays: number;
  readonly minRefundPeriodDays: number;
  readonly supportedCurrencyProvider: CurrencyProvider;
}

/**
 * Interface for currency validation providers
 * Allows dependency injection of currency validation logic
 */
export interface CurrencyProvider {
  isValidCurrency(currencyCode: string): boolean;
}

/**
 * Configuration for string validation rules
 */
export interface StringValidationConfig {
  readonly allowWhitespaceOnly: boolean;
  readonly maxDescriptionLength?: number;
  readonly minDescriptionLength?: number;
}

/**
 * Configuration for date validation rules
 */
export interface DateValidationConfig {
  readonly allowPastDates: boolean;
  readonly maxFutureDays?: number;
}

/**
 * Main validation configuration container
 */
export interface ValidationConfig {
  readonly payment: PaymentValidationConfig;
  readonly strings: StringValidationConfig;
  readonly dates: DateValidationConfig;
}

/**
 * Default currency provider implementation using currency-codes library
 */
class DefaultCurrencyProvider implements CurrencyProvider {
  isValidCurrency(currencyCode: string): boolean {
    // Basic format validation first
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      return false;
    }

    try {
      // Use the synchronous code() function from currency-codes
      return Boolean(currencyCodes.code(currencyCode));
    } catch (error) {
      console.warn("Error using currency-codes library:", error);
      // Fallback to basic validation with known currencies
      return this.isKnownCurrency(currencyCode);
    }
  }

  private isKnownCurrency(currencyCode: string): boolean {
    // Basic list of common currencies for fallback
    const commonCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW',
      'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL',
      'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'ZAR', 'EGP', 'MAD', 'NGN'
    ];
    return commonCurrencies.includes(currencyCode);
  }
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  payment: {
    maxRefundPeriodDays: 365,
    minRefundPeriodDays: 0,
    supportedCurrencyProvider: new DefaultCurrencyProvider(),
  },
  strings: {
    allowWhitespaceOnly: false,
    maxDescriptionLength: 1000,
    minDescriptionLength: 1,
  },
  dates: {
    allowPastDates: false,
    maxFutureDays: 365,
  },
};