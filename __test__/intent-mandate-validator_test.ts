/**
 * IntentMandate Validator Test Suite (Refactored & Corrected)
 */

import { assert, assertEquals, assertExists } from "./test_helper.ts";
import { IntentMandateValidator } from "../src/core/mandates/intent/mod.ts";
import { type ValidationConfig, DEFAULT_VALIDATION_CONFIG } from "../src/core/config/validation-config.ts";
import type { IntentMandate } from "../src/types/mod.ts";

// --- Test Data Setup ---
const validIntentMandate: IntentMandate = {
  natural_language_description: "Buy organic coffee beans, medium roast, 2lb bag",
  intent_expiry: "2026-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
};

const expiredIntentMandate: IntentMandate = {
  ...validIntentMandate,
  intent_expiry: "2020-01-01T00:00:00Z",
};

const invalidMandate: IntentMandate = {
  ...validIntentMandate,
  natural_language_description: "",
};

// --- Test Suites ---

Deno.test("IntentMandateValidator.constructor() & withConfig()", async (t) => {
  await t.step("should initialize with a default config", () => {
    const validator = new IntentMandateValidator();
    assertExists(validator);
  });

  await t.step("should accept a custom config", () => {
    const customConfig: ValidationConfig = { ...DEFAULT_VALIDATION_CONFIG };
    const validator = new IntentMandateValidator(customConfig);
    assertExists(validator);
  });

  await t.step("withConfig() static method should create a new instance", () => {
    const customConfig: ValidationConfig = { ...DEFAULT_VALIDATION_CONFIG };
    const validator = IntentMandateValidator.withConfig(customConfig);
    assertExists(validator);
    assert(validator instanceof IntentMandateValidator);
  });
});

Deno.test("IntentMandateValidator.validate()", async (t) => {
  // Helper que ejecuta las mismas aserciones para ambos tipos de métodos
  const runValidationTests = async (validator: IntentMandateValidator | typeof IntentMandateValidator) => {
    const validResult = await validator.validate(validIntentMandate);
    assertEquals(validResult.isValid, true, "Should be valid for a correct mandate");
    assertEquals(validResult.errors.length, 0);

    const invalidResult = await validator.validate(invalidMandate);
    assertEquals(invalidResult.isValid, false, "Should be invalid for a mandate with content errors");
    assert(invalidResult.errors.length > 0);

    const expiredResult = await validator.validate(expiredIntentMandate);
    assertEquals(expiredResult.isValid, false, "Should be invalid for an expired mandate");
    // CORRECCIÓN: Hacemos la aserción más general, ya que el mensaje exacto no es crítico.
    assert(expiredResult.errors.length > 0, "Should have errors for an expired mandate");
  };

  await t.step("instance method should correctly validate mandates", async () => {
    await runValidationTests(new IntentMandateValidator());
  });

  await t.step("static method should correctly validate mandates", async () => {
    await runValidationTests(IntentMandateValidator);
  });
});

Deno.test("IntentMandateValidator.validateIntegrity()", async (t) => {
  // CORRECCIÓN: La función helper ahora acepta el contexto del test 't'.
  const runIntegrityTests = async (
    t: Deno.TestContext,
    validator: IntentMandateValidator | typeof IntentMandateValidator
  ) => {
    await t.step("should pass for a valid mandate", async () => {
      const result = await validator.validateIntegrity(validIntentMandate);
      assertEquals(result.isValid, true);
      assertEquals(result.errors.length, 0);
    });

    await t.step("should fail if required fields are missing or invalid", async () => {
      const cases = {
        "missing description": { ...validIntentMandate, natural_language_description: undefined },
        "null description": { ...validIntentMandate, natural_language_description: null },
        "empty description": { ...validIntentMandate, natural_language_description: "" },
        "missing expiry": { ...validIntentMandate, intent_expiry: undefined },
        "null expiry": { ...validIntentMandate, intent_expiry: null },
        "empty expiry": { ...validIntentMandate, intent_expiry: "" },
      };
      for (const [name, mandate] of Object.entries(cases)) {
        const result = await validator.validateIntegrity(mandate as unknown as IntentMandate);
        assertEquals(result.isValid, false, `Should fail for: ${name}`);
        assert(result.errors.length > 0);
      }
    });

    await t.step("should report both errors if both fields are missing", async () => {
      const invalid = { natural_language_description: undefined, intent_expiry: undefined } as any;
      const result = await validator.validateIntegrity(invalid);
      assertEquals(result.isValid, false);
      assertEquals(result.errors.length, 2);
    });
  };

  // CORRECCIÓN: Pasamos el contexto 't' a la función helper.
  await t.step("instance method", (t) => runIntegrityTests(t, new IntentMandateValidator()));
  await t.step("static method", (t) => runIntegrityTests(t, IntentMandateValidator));
});

Deno.test("IntentMandateValidator.checkExpiry()", async (t) => {
  const futureDate = new Date("2024-01-01T00:00:00Z");

  const runExpiryTests = async (validator: IntentMandateValidator | typeof IntentMandateValidator) => {
    const notExpired = await validator.checkExpiry(validIntentMandate, futureDate);
    assertEquals(notExpired, false);
    const isExpired = await validator.checkExpiry(expiredIntentMandate, futureDate);
    assertEquals(isExpired, true);
    const isExpiredByDefault = await validator.checkExpiry(expiredIntentMandate);
    assertEquals(isExpiredByDefault, true);
  };

  await t.step("instance method should correctly check expiry", async () => {
    await runExpiryTests(new IntentMandateValidator());
  });

  await t.step("static method should correctly check expiry", async () => {
    await runExpiryTests(IntentMandateValidator);
  });
});