/// <reference types="../src/types/deno.d.ts" />
/**
 * Date Utils Test Suite
 *
 * Tests for date utility functions used throughout the AP2 library.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  isValidISO8601,
  parseISO8601,
  isExpired,
  createFutureISO8601,
  TIME_CONSTANTS,
  DateParseError,
} from "../src/utils/mod.ts";

Deno.test("isValidISO8601 - Valid dates", () => {
  const validDates = [
    "2024-12-31T23:59:59Z",
    "2024-03-15T10:30:00-05:00",
    "2024-01-01T00:00:00+00:00",
    "2024-06-15T14:22:33.123Z",
  ];

  validDates.forEach(date => {
    assert(isValidISO8601(date), `Should be valid: ${date}`);
  });
});

Deno.test("isValidISO8601 - Invalid dates", () => {
  const invalidDates = [
    "invalid-date",
    "2024-13-01T00:00:00Z", // Invalid month
    "2024-01-32T00:00:00Z", // Invalid day
    "2024-01-01T25:00:00Z", // Invalid hour
    "2024-01-01 12:00:00",  // Missing T separator
    "",
    "null",
  ];

  invalidDates.forEach(date => {
    assert(!isValidISO8601(date), `Should be invalid: ${date}`);
  });
});

Deno.test("parseISO8601 - Valid parsing", () => {
  const dateString = "2024-12-31T23:59:59Z";
  const parsed = parseISO8601(dateString);

  assert(parsed instanceof Date);
  assertEquals(parsed.getUTCFullYear(), 2024);
  assertEquals(parsed.getUTCMonth(), 11); // December = 11
  assertEquals(parsed.getUTCDate(), 31);
});

Deno.test("parseISO8601 - Invalid date throws error", () => {
  assertThrows(
    () => parseISO8601("invalid-date"),
    DateParseError,
    "Invalid ISO 8601 date format"
  );
});

Deno.test("isExpired - Past date is expired", () => {
  const pastDate = "2020-01-01T00:00:00Z";
  assert(isExpired(pastDate));
});

Deno.test("isExpired - Future date is not expired", () => {
  const futureDate = "2030-12-31T23:59:59Z";
  assert(!isExpired(futureDate));
});

Deno.test("isExpired - With custom current date", () => {
  const testDate = "2024-06-15T12:00:00Z";
  const currentDate = new Date("2024-06-15T11:00:00Z"); // 1 hour before

  assert(!isExpired(testDate, currentDate)); // Not expired yet

  const laterDate = new Date("2024-06-15T13:00:00Z"); // 1 hour after
  assert(isExpired(testDate, laterDate)); // Now expired
});

Deno.test("createFutureISO8601 - Creates valid future date", () => {
  const futureDate = createFutureISO8601(TIME_CONSTANTS.DAY); // 24 hours from now

  assert(isValidISO8601(futureDate));
  assert(!isExpired(futureDate));

  // Should be approximately 24 hours from now (with some tolerance for test execution time)
  const parsed = parseISO8601(futureDate);
  const now = new Date();
  const diffSeconds = (parsed.getTime() - now.getTime()) / 1000;

  assert(diffSeconds > TIME_CONSTANTS.DAY - 10 && diffSeconds < TIME_CONSTANTS.DAY + 10,
         `Expected ~${TIME_CONSTANTS.DAY} seconds, got ${diffSeconds}`);
});

Deno.test("createFutureISO8601 - Zero seconds returns current time", () => {
  const currentISO = createFutureISO8601(0);
  const now = new Date();
  const parsed = parseISO8601(currentISO);

  // Should be very close to current time (within 1 second)
  const diffMs = Math.abs(parsed.getTime() - now.getTime());
  assert(diffMs < 1000, `Time difference too large: ${diffMs}ms`);
});

Deno.test("TIME_CONSTANTS - Verify time constant values", () => {
  assertEquals(TIME_CONSTANTS.MINUTE, 60);
  assertEquals(TIME_CONSTANTS.HOUR, 3600);
  assertEquals(TIME_CONSTANTS.DAY, 86400);
  assertEquals(TIME_CONSTANTS.WEEK, 604800);
  assertEquals(TIME_CONSTANTS.MONTH, 2592000);
  assertEquals(TIME_CONSTANTS.YEAR, 31536000);
});