/**
 * Date Utilities for AP2
 *
 * Utilities for working with ISO 8601 date strings in the AP2 protocol.
 */

import { DateParseError } from "./errors.ts";

/**
 * Validates if a string is a valid ISO 8601 date
 *
 * @param dateString - The date string to validate
 * @returns True if valid ISO 8601 format
 */
export function isValidISO8601(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString ||
           /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/.test(dateString);
  } catch {
    return false;
  }
}

/**
 * Parses an ISO 8601 date string and returns a Date object
 *
 * @param dateString - The ISO 8601 date string
 * @returns Date object
 * @throws DateParseError if the date string is invalid
 */
export function parseISO8601(dateString: string): Date {
  if (!isValidISO8601(dateString)) {
    throw new DateParseError(`Invalid ISO 8601 date format: ${dateString}`);
  }

  return new Date(dateString);
}

/**
 * Checks if a mandate has expired based on its expiry date
 *
 * @param expiryDateString - ISO 8601 expiry date string
 * @param currentDate - Current date (defaults to now)
 * @returns True if the mandate has expired
 */
export function isExpired(expiryDateString: string, currentDate = new Date()): boolean {
  const expiryDate = parseISO8601(expiryDateString);
  return currentDate > expiryDate;
}

/**
 * Creates an ISO 8601 date string for a future date
 *
 * @param secondsFromNow - Seconds in the future
 * @returns ISO 8601 date string
 *
 * @example
 * createFutureISO8601(3600)    // 1 hour from now
 * createFutureISO8601(86400)   // 24 hours from now
 * createFutureISO8601(604800)  // 1 week from now
 */
export function createFutureISO8601(secondsFromNow: number): string {
  const future = new Date();
  future.setTime(future.getTime() + (secondsFromNow * 1000));
  return future.toISOString();
}

/**
 * Convenience constants for common time periods in seconds
 */
export const TIME_CONSTANTS = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 60 * 60 * 24,
  WEEK: 60 * 60 * 24 * 7,
  MONTH: 60 * 60 * 24 * 30,
  YEAR: 60 * 60 * 24 * 365,
} as const;