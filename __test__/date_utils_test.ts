/**
 * Date Utils Test Suite (Refactored)
 *
 * Tests for date utility functions, grouped by function for clarity.
 * Uses FakeTime for deterministic time-based tests.
 */

import { assert, assertEquals, assertThrows } from "./test_helper.ts";
import { FakeTime } from "@std/testing/time";
import {
  isValidISO8601,
  parseISO8601,
  isExpired,
  createFutureISO8601,
  TIME_CONSTANTS,
  DateParseError,
} from "../src/utils/mod.ts";

Deno.test("isValidISO8601()", async (t) => {
  await t.step("should return true for valid ISO 8601 strings", () => {
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

  await t.step("should return false for invalid date strings", () => {
    const invalidDates = [
      "invalid-date", "2024-13-01T00:00:00Z", "2024-01-32T00:00:00Z",
      "2024-01-01T25:00:00Z", "2024-01-01 12:00:00", "", "null",
    ];
    invalidDates.forEach(date => {
      assert(!isValidISO8601(date), `Should be invalid: ${date}`);
    });
  });
});

Deno.test("parseISO8601()", async (t) => {
  await t.step("should correctly parse a valid ISO 8601 string", () => {
    const dateString = "2024-12-31T23:59:59Z";
    const parsed = parseISO8601(dateString);
    assert(parsed instanceof Date);
    assertEquals(parsed.getUTCFullYear(), 2024);
    assertEquals(parsed.getUTCMonth(), 11); // December = 11
    assertEquals(parsed.getUTCDate(), 31);
  });

  await t.step("should throw DateParseError for an invalid date string", () => {
    assertThrows(
      () => parseISO8601("invalid-date"),
      DateParseError,
      "Invalid ISO 8601 date format"
    );
  });
});

Deno.test("isExpired()", async (t) => {
  const now = new Date("2024-06-15T12:00:00Z");

  await t.step("should return true for a date in the past", () => {
    const pastDate = "2020-01-01T00:00:00Z";
    assert(isExpired(pastDate, now));
  });

  await t.step("should return false for a date in the future", () => {
    const futureDate = "2030-12-31T23:59:59Z";
    assert(!isExpired(futureDate, now));
  });

  await t.step("should return true if the date is exactly now or in the past", () => {
    const testDate = "2024-06-15T12:00:00Z";
    const laterDate = new Date("2024-06-15T13:00:00Z");
    assert(isExpired(testDate, laterDate));
  });
});

Deno.test("createFutureISO8601()", async (t) => {
  // Using FakeTime to make these tests deterministic and instant
  using _time = new FakeTime();

  await t.step("should create a valid ISO string exactly in the future", () => {
    const now = new Date();
    const futureISO = createFutureISO8601(TIME_CONSTANTS.DAY);
    const expectedISO = new Date(now.getTime() + TIME_CONSTANTS.DAY * 1000).toISOString();
    
    assertEquals(futureISO, expectedISO);
    assert(isValidISO8601(futureISO));
    assert(!isExpired(futureISO));
  });

  await t.step("should return the current time ISO string for zero seconds", () => {
    const now = new Date();
    const currentISO = createFutureISO8601(0);
    
    assertEquals(currentISO, now.toISOString());
  });
});

Deno.test("TIME_CONSTANTS", async (t) => {
  await t.step("should have correct values in seconds", () => {
    assertEquals(TIME_CONSTANTS.MINUTE, 60);
    assertEquals(TIME_CONSTANTS.HOUR, 3600);
    assertEquals(TIME_CONSTANTS.DAY, 86400);
    assertEquals(TIME_CONSTANTS.WEEK, 604800);
    assertEquals(TIME_CONSTANTS.MONTH, 2592000); // 30 days
    assertEquals(TIME_CONSTANTS.YEAR, 31536000); // 365 days
  });
});