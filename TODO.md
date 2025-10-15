# AP2-lib TODO: 100% Specification Compliance

> **Generated**: 2025-10-15
> **Source**: Combined from /ap2-lib/TODO.md and /context/TODO.md
> **Target**: 100% AP2 V0.1 Specification Compliance
> **Current Compliance**: ~75%
> **Current Test Coverage**: 91.0% lines, 89.9% branches

---

## Priority Legend
- 🔴 **CRÍTICA** - Production blockers, must be implemented for spec compliance
- 🟠 **ALTA** - Required for full compliance, important for production use
- 🟡 **MEDIA** - Nice to have, improves robustness and usability
- 🟢 **BAJA** - Future enhancements, optimization

## Effort Estimation
- **S** (Small): 1-2 days
- **M** (Medium): 3-5 days
- **L** (Large): 1-2 weeks
- **XL** (Extra Large): 3+ weeks

---

## 🔴 CRÍTICA: Security & Cryptography

### C1. Implement SD-JWT-VC User Authorization for PaymentMandate | Effort: **XL** | Status: ❌

**Description**:
Implement full SD-JWT-VC (Selective Disclosure JWT Verifiable Credential) support for the `user_authorization` field in PaymentMandate as specified in Section 4.1.3 and 7.2 of the specification. This is the cornerstone of cryptographic trust binding between mandates and user authorization.

**Specification References**:
- Section 4.1.3: The Payment Mandate for AI Agent Visibility
- Section 7.2: Code Samples - PaymentMandate structure
- Glossary: Verifiable digital credential (VDC), Verifiable presentation (VP)

**Files Affected**:
- `src/types/payment-mandate.ts`
- `src/core/mandates/payment/payment-mandate-class.ts`
- `src/core/mandates/payment/payment-mandate-validator.ts`
- `src/core/jwt/sd-jwt-vc-service.ts` (new)
- `src/types/verifiable-credential.ts` (new)
- `__test__/core/jwt/sd-jwt-vc-service_test.ts` (new)
- `__test__/core/mandates/payment/payment-mandate-sd-jwt_test.ts` (new)

**Dependencies**: None (but C3 should be implemented alongside for hash validation)

**Subtasks**:
- [ ] Create comprehensive SD-JWT-VC types in `src/types/verifiable-credential.ts`
- [ ] Define interfaces for `IssuerSignedJWT`, `KeyBindingJWT`, and `VerifiablePresentation`
- [ ] Create `SDJWTVCService` class in `src/core/jwt/sd-jwt-vc-service.ts`
- [ ] Implement `.parseVerifiablePresentation()` to decode base64_url-encoded VP
- [ ] Implement `.extractIssuerJWT()` to parse issuer-signed JWT
- [ ] Implement `.verifyIssuerSignature()` using issuer public key
- [ ] Implement `.extractConfirmationClaim()` to verify `cnf` claim structure
- [ ] Implement `.extractKeyBindingJWT()` to parse key-binding JWT
- [ ] Implement `.verifyKeyBindingJWT()` to check `aud`, `nonce`, and `sd_hash` claims
- [ ] Implement `.extractTransactionData()` to retrieve `transaction_data` array from issuer JWT
- [ ] Add `.validateTransactionHashes()` to verify CartMandate + PaymentMandateContents hashes
- [ ] Update `PaymentMandateClass` with `.verifyUserAuthorization()` method
- [ ] Update `PaymentMandateValidator` to call SD-JWT-VC verification during validation
- [ ] Add comprehensive unit tests for `SDJWTVCService` (100% coverage required)
- [ ] Add integration tests for full PaymentMandate verification flow
- [ ] Add security edge case tests (expired JWT, replay attacks, hash mismatches, invalid signatures)
- [ ] Document SD-JWT-VC structure with diagrams
- [ ] Create examples demonstrating SD-JWT-VC creation and verification
- [ ] Add JSDoc documentation for all public APIs

**Acceptance Criteria**:
- [ ] SD-JWT-VC parsing and verification fully implemented
- [ ] Issuer-signed JWT verified with proper signature validation
- [ ] Key-binding JWT verified with all required claims (`aud`, `nonce`, `sd_hash`)
- [ ] Transaction hashes validated against CartMandate and PaymentMandateContents
- [ ] All security edge cases handled (JWT expiry, replay attacks, signature tampering, hash mismatches)
- [ ] 100% test coverage for `SDJWTVCService` and verification logic
- [ ] Integration tests demonstrate end-to-end PaymentMandate verification
- [ ] Documentation includes sequence diagrams and code examples
- [ ] JSDoc complete for all public methods

---

### C2. Add AI Agent Presence Signals to PaymentMandate | Effort: **M** | Status: ❌

**Description**:
Add mandatory AI agent presence and transaction modality signals to `PaymentMandateContents` as required by Section 4.1.3. These signals are critical for network/issuer visibility and risk assessment in agentic transactions.

**Specification References**:
- Section 4.1.3: The Payment Mandate for AI Agent Visibility to Payments Ecosystem
- Section 5.1: Human Present Transaction
- Section 5.2: Human Not Present Transaction
- Glossary: User Agent (UA), Shopping Agent (SA)

**Files Affected**:
- `src/types/payment-mandate.ts`
- `src/core/mandates/payment/payment-mandate-contents-class.ts`
- `src/core/mandates/payment/payment-mandate-contents-validator.ts`
- `src/core/mandates/payment/payment-mandate-contents-serializer.ts`
- `__test__/core/mandates/payment/payment-mandate-ai-signals_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Add `ai_agent_present: boolean` field to `PaymentMandateContents` interface
- [ ] Add `transaction_modality: "human_present" | "human_not_present"` field to `PaymentMandateContents`
- [ ] Add optional `user_agent_id?: string` field (VDC reference for user agent)
- [ ] Add optional `shopping_agent_id?: string` field (VDC reference for shopping agent)
- [ ] Add optional `agent_session_id?: string` field for session tracking
- [ ] Update `PaymentMandateContentsClass` constructor to accept new fields
- [ ] Add getter methods: `isAIAgentPresent()`, `getTransactionModality()`, `getUserAgentId()`, `getShoppingAgentId()`, `getAgentSessionId()`
- [ ] Add validation method to ensure `ai_agent_present` and `transaction_modality` are always present
- [ ] Update `PaymentMandateContentsValidator` with required field validation rules
- [ ] Add validation rule: if `ai_agent_present` is true, at least one agent ID should be present
- [ ] Add validation for `transaction_modality` enum values
- [ ] Update `PaymentMandateContentsSerializer` to include new fields in JSON output
- [ ] Ensure serialization uses snake_case for new fields
- [ ] Add unit tests for human-present scenario (`transaction_modality: "human_present"`)
- [ ] Add unit tests for human-not-present scenario (`transaction_modality: "human_not_present"`)
- [ ] Add tests for all optional field combinations
- [ ] Add validation tests for missing required fields
- [ ] Update documentation with field descriptions and usage examples
- [ ] Create example PaymentMandates showing both transaction modalities

**Acceptance Criteria**:
- [ ] All five new fields added to `PaymentMandateContents` interface
- [ ] `ai_agent_present` and `transaction_modality` enforced as required fields
- [ ] Optional agent ID fields properly implemented
- [ ] Validation rules enforce data integrity
- [ ] Serialization outputs correct snake_case field names
- [ ] Tests cover all scenarios: human-present, human-not-present, with/without optional fields
- [ ] Tests verify validation failures for missing required fields
- [ ] Documentation includes examples for both transaction modalities
- [ ] Backward compatibility maintained (old PaymentMandates can still be validated with warnings)

---

### C3. Implement Transaction Hash Validation | Effort: **L** | Status: ⚠️

**Description**:
Implement secure, deterministic hash computation for CartMandate and PaymentMandateContents to cryptographically bind them in `user_authorization`. Current implementation has basic cart hashing but needs enhancement for security and specification compliance.

**Specification References**:
- Section 4.1.3: Transaction hashes in `transaction_data` array
- Section 6: Enabling Dispute Resolution - cryptographic chain of evidence
- Section 7.2: Code Samples showing hash integration

**Files Affected**:
- `src/core/jwt/hash-service.ts` (new)
- `src/core/utils/canonical-json.ts` (new)
- `src/core/mandates/cart/cart-mandate-class.ts`
- `src/core/mandates/payment/payment-mandate-contents-class.ts`
- `src/core/mandates/payment/payment-mandate-validator.ts`
- `__test__/core/jwt/hash-service_test.ts` (new)
- `__test__/core/utils/canonical-json_test.ts` (new)
- `__test__/integration/transaction-hash-validation_test.ts` (new)

**Dependencies**: Should be implemented alongside C1 for SD-JWT-VC integration

**Subtasks**:
- [ ] Create canonical JSON utilities in `src/core/utils/canonical-json.ts`
- [ ] Implement `canonicalize()` function with RFC 8785 compliance (sorted keys, no whitespace)
- [ ] Add tests for canonical JSON determinism (same input always produces same output)
- [ ] Create `HashService` class in `src/core/jwt/hash-service.ts`
- [ ] Implement `computeHash(data: unknown): string` using SHA-256
- [ ] Implement `computeMandateHash(mandate: BaseMandate): string` for any mandate type
- [ ] Add support for selective field hashing (exclude signatures before hashing)
- [ ] Add `computeHash(): string` method to `CartMandateClass`
- [ ] Ensure CartMandate hash excludes `merchant_signature` and `timestamp` fields
- [ ] Add `computeHash(): string` method to `PaymentMandateContentsClass`
- [ ] Ensure PaymentMandateContents hash includes all relevant transaction fields
- [ ] Update `PaymentMandateValidator` to verify hash matches in `user_authorization`
- [ ] Implement hash verification in `.validateUserAuthorization()` method
- [ ] Add comprehensive hash computation tests (deterministic output, field exclusion)
- [ ] Add hash verification tests (valid hash, mismatched hash, tampered data)
- [ ] Add performance tests to ensure hashing completes in <10ms per mandate
- [ ] Add integration tests for full CartMandate -> PaymentMandate hash chain
- [ ] Document hash computation algorithm with pseudocode
- [ ] Document security considerations (canonical JSON prevents tampering)
- [ ] Add examples showing hash computation for disputes

**Acceptance Criteria**:
- [ ] Canonical JSON serialization implemented per RFC 8785
- [ ] SHA-256 hashing produces deterministic, consistent outputs
- [ ] CartMandate hash excludes signature and timestamp fields
- [ ] PaymentMandateContents hash includes all transaction-critical fields
- [ ] Hash verification integrated into PaymentMandateValidator
- [ ] 100% test coverage for HashService and canonical JSON utilities
- [ ] Performance benchmarks show <10ms per hash computation
- [ ] Integration tests demonstrate full hash chain validation
- [ ] Documentation explains hash algorithm and security properties
- [ ] Examples show hash usage in dispute resolution scenarios

---

### C4. Implement User Signature for IntentMandate | Effort: **XL** | Status: ❌

**Description**:
According to specification section 4.1.2, IntentMandate MUST be "cryptographically signed by the user, typically using a hardware-backed key on their device." Current implementation has NO signing functionality for IntentMandate, which is a CRITICAL SPEC VIOLATION. This is essential for human-not-present transactions.

**Specification References**:
- Section 4.1.2: The Intent Mandate
- Section 5.2: Human Not Present Transaction
- Section 2.3: Verifiable Intent, Not Inferred Action
- Section 9: Issuance of Trusted Public Keys

**Files Affected**:
- `src/types/mandates.ts`
- `src/core/mandates/intent/intent-mandate-class.ts`
- `src/core/mandates/intent/intent-mandate-validator.ts`
- `src/core/jwt/user-authorization-service.ts` (new)
- `src/core/jwt/device-key-manager.ts` (new)
- `src/types/user-signature.ts` (new)
- `__test__/core/jwt/user-authorization-service_test.ts` (new)
- `__test__/core/mandates/intent/intent-mandate-signature_test.ts` (new)
- `__test__/integration/intent-mandate-signing-flow_test.ts` (new)

**Dependencies**: None (foundational requirement)

**Subtasks**:
- [ ] Add `user_signature?: string` field to `IntentMandate` interface
- [ ] Add `user_public_key?: string` field to `IntentMandate` for signature verification
- [ ] Create `UserSignature` type in `src/types/user-signature.ts` with signature metadata
- [ ] Create `DeviceKeyManager` interface for hardware-backed key operations
- [ ] Implement `WebCryptoDeviceKeyManager` using Web Crypto API
- [ ] Add `.generateKeyPair()` method for creating user device keys (ES256/RS256)
- [ ] Add `.exportPublicKey()` method to get public key in JWK format
- [ ] Add `.signWithDeviceKey()` method for signing data
- [ ] Create `UserAuthorizationService` class in `src/core/jwt/user-authorization-service.ts`
- [ ] Implement `.signIntentMandate(mandate: IntentMandate, privateKey: CryptoKey): Promise<string>`
- [ ] Implement `.verifyIntentMandateSignature(mandate: IntentMandate, publicKey: CryptoKey): Promise<boolean>`
- [ ] Ensure signature computation uses canonical JSON (from C3)
- [ ] Add `.sign(deviceKey: CryptoKey): Promise<void>` method to `IntentMandateClass`
- [ ] Add `.verify(publicKey: CryptoKey): Promise<boolean>` method to `IntentMandateClass`
- [ ] Add `.isSigned(): boolean` getter to check if signature exists
- [ ] Update `IntentMandateValidator` to check for user signature when required
- [ ] Add validation rule: if `user_signature_required` is true, signature must be present
- [ ] Add validation to verify signature matches mandate contents
- [ ] Add unit tests for key generation and signing operations
- [ ] Add unit tests for signature verification (valid signature, invalid signature, tampered data)
- [ ] Add tests for unsigned IntentMandates (optional signature scenarios)
- [ ] Add integration tests for full signing flow: create mandate -> sign -> verify
- [ ] Add hardware-backed key pattern documentation (WebAuthn, Secure Enclave)
- [ ] Document signature algorithm selection (ES256 recommended)
- [ ] Create examples for both signed and unsigned IntentMandates
- [ ] Add sequence diagram showing user signature flow in human-not-present scenario

**Acceptance Criteria**:
- [ ] `user_signature` and `user_public_key` fields added to IntentMandate
- [ ] DeviceKeyManager interface supports ES256 and RS256 algorithms
- [ ] IntentMandate can be signed with user device key
- [ ] Signature verification works with public key
- [ ] Signature computation uses canonical JSON for determinism
- [ ] Validation enforces signature presence when required
- [ ] Tests cover signing, verification, and tampering detection
- [ ] Tests verify unsigned IntentMandates are supported
- [ ] Documentation includes hardware-backed key integration patterns
- [ ] Examples demonstrate human-not-present transaction flow with signatures
- [ ] Sequence diagrams show signature creation and verification steps

---

### C5. Implement JTI (JWT ID) Replay Prevention | Effort: **M** | Status: ❌

**Description**:
Implement JWT ID (JTI) validation to prevent replay attacks on signed mandates. Each signed mandate should have a unique identifier that is tracked to ensure mandates cannot be reused maliciously.

**Specification References**:
- Section 2.3: Verifiable Intent, Not Inferred Action
- Section 6: Enabling Dispute Resolution - non-repudiable audit trail
- Section 7.4: Risk Signals - temporal gaps and payment method token misuse

**Files Affected**:
- `src/core/jwt/jti-validator.ts` (new)
- `src/core/jwt/jwt-service.ts`
- `src/types/jwt-options.ts`
- `__test__/core/jwt/jti-validator_test.ts` (new)
- `__test__/security/replay-attack_test.ts` (new)

**Dependencies**: C4 (IntentMandate signing must be implemented first)

**Subtasks**:
- [ ] Create `JTIValidator` interface in `src/core/jwt/jti-validator.ts`
- [ ] Define `.isJTIUsed(jti: string): Promise<boolean>` method
- [ ] Define `.markJTIAsUsed(jti: string, expiryTime: Date): Promise<void>` method
- [ ] Implement in-memory `JTICache` for development/testing
- [ ] Add time-based expiry for cached JTIs (cleanup after JWT expiration)
- [ ] Update `JWTService` to generate unique JTI for each JWT
- [ ] Update `JWTService.sign()` to include `jti` claim automatically
- [ ] Update `JWTService.verify()` to extract and validate JTI
- [ ] Integrate JTI validation into mandate verification flow
- [ ] Add JTI validation to `IntentMandateValidator`
- [ ] Add JTI validation to `CartMandateValidator`
- [ ] Add JTI validation to `PaymentMandateValidator`
- [ ] Add unit tests for JTI generation (uniqueness, format)
- [ ] Add unit tests for JTI validation (first use passes, second use fails)
- [ ] Add tests for JTI expiry and cache cleanup
- [ ] Add security tests for replay attack scenarios
- [ ] Document JTI validation mechanism
- [ ] Add configuration options for JTI cache size and expiry
- [ ] Provide implementation notes for persistent JTI storage (Redis, PostgreSQL)

**Acceptance Criteria**:
- [ ] JTI automatically generated for all signed JWTs
- [ ] JTI validation prevents mandate reuse
- [ ] In-memory cache implementation for testing
- [ ] Time-based expiry for JTI cache entries
- [ ] Integration with all mandate validators
- [ ] Tests verify replay attack prevention
- [ ] Tests verify JTI expiry and cleanup
- [ ] Documentation explains JTI mechanism and storage options
- [ ] Configuration options for cache tuning

---

## 🟠 ALTA: Data Model Compliance

### H1. Add Risk Payload to All Mandate Types | Effort: **M** | Status: ❌

**Description**:
Add comprehensive risk payload structures to IntentMandate, CartContents, and PaymentMandateContents as required by Section 7.4. Risk signals are essential for fraud prevention and compliance with payment ecosystem requirements.

**Specification References**:
- Section 7.4: Risk Signals
- Section 4.1.1: The Cart Mandate - Risk Payload container
- Section 4.1.2: The Intent Mandate - Risk Payload container

**Files Affected**:
- `src/types/risk.ts` (new)
- `src/types/mandates.ts`
- `src/types/payment-mandate.ts`
- `src/core/mandates/intent/intent-mandate-validator.ts`
- `src/core/mandates/cart/cart-mandate-validator.ts`
- `src/core/mandates/payment/payment-mandate-contents-validator.ts`
- `src/core/mandates/shared/risk-serializer.ts` (new)
- `__test__/types/risk-payload_test.ts` (new)
- `__test__/core/mandates/shared/risk-validation_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Create comprehensive `RiskPayload` interface in `src/types/risk.ts`
- [ ] Add `device_fingerprint?: string` field for device identification
- [ ] Add `ip_address?: string` field for network location
- [ ] Add `user_agent?: string` field for browser/client identification
- [ ] Add `session_id?: string` field for session tracking
- [ ] Add `authentication_method?: string` field (biometric, password, etc.)
- [ ] Add `authentication_timestamp?: string` field for when user authenticated
- [ ] Add `previous_transaction_count?: number` field for user transaction history
- [ ] Add `account_age_days?: number` field for user account age
- [ ] Add `shipping_address_verified?: boolean` field
- [ ] Add `billing_address_verified?: boolean` field
- [ ] Add `velocity_check_score?: number` field for transaction velocity analysis
- [ ] Add `fraud_score?: number` field from external fraud detection services
- [ ] Add `custom_risk_signals?: Record<string, unknown>` for extensibility
- [ ] Add `risk?: RiskPayload` field to `IntentMandate` interface
- [ ] Add `risk?: RiskPayload` field to `CartContents` interface
- [ ] Add `risk?: RiskPayload` field to `PaymentMandateContents` interface
- [ ] Create validation rules for risk payload structure in each validator
- [ ] Add format validation for IP addresses, timestamps, URLs
- [ ] Add range validation for numeric risk scores (0-100)
- [ ] Create `RiskSerializer` for consistent risk payload serialization
- [ ] Update all mandate serializers to include risk payload
- [ ] Add unit tests for RiskPayload validation (valid fields, invalid formats)
- [ ] Add tests for optional risk payload (mandates without risk data)
- [ ] Add serialization/deserialization tests for risk payload
- [ ] Document each risk field with description and usage guidelines
- [ ] Add privacy considerations documentation (PII handling in risk data)
- [ ] Create examples showing risk payload in different scenarios

**Acceptance Criteria**:
- [ ] RiskPayload interface defined with 14+ comprehensive fields
- [ ] All three mandate types include optional `risk` field
- [ ] Validation rules enforce proper data types and formats
- [ ] Validation allows mandates without risk payload (optional field)
- [ ] Serialization/deserialization maintains data integrity
- [ ] Tests cover all risk fields and validation scenarios
- [ ] Tests verify optional nature of risk payload
- [ ] Documentation explains each field and when to use it
- [ ] Privacy considerations documented (GDPR, PCI-DSS compliance notes)
- [ ] Examples show risk payload usage in fraud prevention scenarios

---

### H2. Add Payer/Payee Identity Fields to All Mandates | Effort: **M** | Status: ❌

**Description**:
Add verifiable identity structures for user, merchant, and credential providers as specified in Section 4.1.1 and 4.1.2. These fields enable proper identity verification and trust establishment in the agentic ecosystem.

**Specification References**:
- Section 4.1.1: The Cart Mandate - Payer and Payee Information
- Section 4.1.2: The Intent Mandate - Payer and Payee Information
- Section 3.2: The Flow of Trust
- Glossary: Verifiable digital credential (VDC), Payer, Payee

**Files Affected**:
- `src/types/identity.ts` (new)
- `src/types/mandates.ts`
- `src/types/payment-mandate.ts`
- `src/core/mandates/intent/intent-mandate-validator.ts`
- `src/core/mandates/cart/cart-mandate-validator.ts`
- `src/core/mandates/payment/payment-mandate-contents-validator.ts`
- `src/core/mandates/shared/identity-serializer.ts` (new)
- `__test__/types/identity_test.ts` (new)
- `__test__/core/mandates/shared/identity-validation_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Create `VerifiableIdentity` interface in `src/types/identity.ts`
- [ ] Add `id: string` field for unique identifier (DID, VDC reference, or URI)
- [ ] Add `type: "user" | "merchant" | "credential_provider" | "shopping_agent"` enum field
- [ ] Add `vdc_reference?: string` field for verifiable credential reference
- [ ] Add `public_key?: string` field for cryptographic verification
- [ ] Add `display_name?: string` field for human-readable name
- [ ] Add `verification_method?: string` field describing how identity was verified
- [ ] Create `PayerInfo` interface extending `VerifiableIdentity`
- [ ] Add payer-specific fields: `email?: string`, `phone?: string`
- [ ] Create `PayeeInfo` interface extending `VerifiableIdentity`
- [ ] Add payee-specific fields: `merchant_id?: string`, `merchant_category_code?: string`
- [ ] Add `payer?: PayerInfo` field to `IntentMandate` interface
- [ ] Add `payee?: PayeeInfo` field to `IntentMandate` interface
- [ ] Add `credential_provider?: VerifiableIdentity` field to `IntentMandate`
- [ ] Add `payer?: PayerInfo` field to `CartContents` interface
- [ ] Add `payee?: PayeeInfo` field to `CartContents` interface
- [ ] Add `credential_provider?: VerifiableIdentity` field to `CartContents`
- [ ] Add `payer?: PayerInfo` field to `PaymentMandateContents` interface
- [ ] Add `payee?: PayeeInfo` field to `PaymentMandateContents` interface
- [ ] Add `credential_provider?: VerifiableIdentity` field to `PaymentMandateContents`
- [ ] Add validation rules for identity structure in all validators
- [ ] Add validation for DID format (did:method:identifier)
- [ ] Add validation for VDC reference format
- [ ] Add validation for email and phone formats in PayerInfo
- [ ] Create `IdentitySerializer` for consistent identity serialization
- [ ] Update all mandate serializers to include identity fields
- [ ] Add unit tests for identity validation (valid/invalid formats)
- [ ] Add tests for optional identity fields (mandates without full identity data)
- [ ] Add tests for backward compatibility with existing mandates
- [ ] Document identity structures with VDC integration examples
- [ ] Document DID (Decentralized Identifier) format and usage
- [ ] Create examples showing trust establishment with verifiable identities

**Acceptance Criteria**:
- [ ] VerifiableIdentity, PayerInfo, and PayeeInfo types fully defined
- [ ] All three mandate types include payer, payee, and credential_provider fields
- [ ] Validation rules enforce proper identity structure
- [ ] DID and VDC reference formats properly validated
- [ ] Serialization maintains identity data integrity
- [ ] Tests cover all identity scenarios and validation rules
- [ ] Backward compatibility maintained with existing mandates
- [ ] Documentation explains identity verification patterns
- [ ] Examples show trust establishment flows with VDC integration

---

### H3. Fix Field Naming Convention (snake_case Serialization) | Effort: **M** | Status: ⚠️

**Description**:
Standardize field naming to match specification examples which use snake_case in JSON (as shown in Section 7.2), while maintaining camelCase in TypeScript code. Current implementation is inconsistent.

**Specification References**:
- Section 7.2: Code Samples (all JSON examples use snake_case)
- W3C Payment Request API standards (uses snake_case for some fields)

**Files Affected**:
- `src/core/utils/case-converter.ts` (new)
- `src/core/mandates/shared/mandate-serialization-strategy.ts`
- `src/core/mandates/shared/base-json-serializer.ts`
- `src/core/mandates/intent/intent-mandate-serializer.ts`
- `src/core/mandates/cart/cart-mandate-serializer.ts`
- `src/core/mandates/payment/payment-mandate-contents-serializer.ts`
- `src/types/payment_request.ts`
- `__test__/core/utils/case-converter_test.ts` (new)
- `__test__/core/mandates/shared/serialization-naming_test.ts` (new)

**Dependencies**: None (but should be done early to avoid breaking changes)

**Subtasks**:
- [ ] Create `CaseConverter` utility in `src/core/utils/case-converter.ts`
- [ ] Implement `toSnakeCase(str: string): string` function
- [ ] Implement `toCamelCase(str: string): string` function
- [ ] Implement `convertObjectKeysToSnakeCase(obj: Record<string, unknown>): Record<string, unknown>` deep converter
- [ ] Implement `convertObjectKeysToCamelCase(obj: Record<string, unknown>): Record<string, unknown>` deep converter
- [ ] Add tests for case conversion edge cases (nested objects, arrays, null values)
- [ ] Update `BaseJsonSerializer` to support field transformation
- [ ] Add `fieldNamingStrategy?: "camelCase" | "snake_case"` option to serializer constructor
- [ ] Implement automatic field transformation in `.serialize()` method
- [ ] Implement automatic field transformation in `.deserialize()` method
- [ ] Update `IntentMandateSerializer` to use snake_case by default
- [ ] Update `CartMandateSerializer` to use snake_case by default
- [ ] Update `PaymentMandateContentsSerializer` to use snake_case by default
- [ ] Change `AP2PaymentRequest` internal fields from snake_case to camelCase (breaking change in TypeScript)
- [ ] Update all mandate classes to use camelCase internally
- [ ] Add backward compatibility option to support old camelCase JSON
- [ ] Add serialization tests verifying snake_case output
- [ ] Add deserialization tests for both snake_case and camelCase input (compatibility)
- [ ] Add round-trip tests (serialize -> deserialize -> verify equality)
- [ ] Update all examples in documentation to use snake_case JSON
- [ ] Document field naming conventions in README
- [ ] Add migration guide for consumers using camelCase JSON
- [ ] Update all test fixtures to use snake_case

**Acceptance Criteria**:
- [ ] All JSON serialization output uses snake_case
- [ ] All TypeScript code uses camelCase
- [ ] CaseConverter utility handles nested objects and arrays correctly
- [ ] Serializers automatically transform field names
- [ ] Deserializers accept both snake_case and camelCase (backward compatibility)
- [ ] Round-trip serialization maintains data integrity
- [ ] All tests pass with new naming convention
- [ ] Documentation updated with snake_case examples
- [ ] Migration guide provided for breaking changes
- [ ] Backward compatibility option available for transition period

---

### H4. Add Missing CartMandate Timestamp Field | Effort: **S** | Status: ❌

**Description**:
Add `timestamp` field to `CartMandate` as shown in specification example (Section 7.2). This field is critical for temporal validation and dispute resolution.

**Specification References**:
- Section 7.2: Code Samples - Sample CartMandate (includes timestamp field)
- Section 6: Enabling Dispute Resolution - temporal evidence

**Files Affected**:
- `src/types/mandates.ts`
- `src/core/mandates/cart/cart-mandate-class.ts`
- `src/core/mandates/cart/cart-mandate-validator.ts`
- `src/core/mandates/cart/cart-mandate-serializer.ts`
- `__test__/core/mandates/cart/cart-mandate-timestamp_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Add `timestamp: string` field to `CartMandate` interface
- [ ] Update `CartMandateClass` constructor to accept optional timestamp parameter
- [ ] Auto-generate ISO 8601 timestamp in constructor if not provided
- [ ] Add `getTimestamp(): string` getter method
- [ ] Add `getTimestampAsDate(): Date` helper method
- [ ] Update `toString()` method to include timestamp
- [ ] Update `CartMandateValidator` with timestamp validation
- [ ] Add validation rule: timestamp must be valid ISO 8601 format
- [ ] Add validation rule: timestamp must not be in the future
- [ ] Add validation rule: timestamp should be within reasonable past range (e.g., 24 hours)
- [ ] Update `CartMandateSerializer` to include timestamp in JSON output
- [ ] Ensure timestamp serialization uses snake_case format
- [ ] Add unit tests for auto-generation of timestamp
- [ ] Add tests for explicit timestamp setting
- [ ] Add validation tests (valid ISO 8601, invalid format, future timestamp)
- [ ] Add tests for timestamp in serialization/deserialization
- [ ] Update all existing CartMandate tests to handle new timestamp field
- [ ] Update CartMandate examples in documentation
- [ ] Document timestamp field usage and validation rules

**Acceptance Criteria**:
- [ ] `timestamp` field added to CartMandate interface
- [ ] Timestamp auto-generated in ISO 8601 format when not provided
- [ ] Getter methods for both string and Date formats
- [ ] Validation enforces ISO 8601 format
- [ ] Validation prevents future timestamps
- [ ] Validation checks for reasonable past range
- [ ] Serialization includes timestamp in snake_case
- [ ] All tests pass with new field
- [ ] Documentation updated with timestamp examples
- [ ] Backward compatibility: old CartMandates without timestamp can be validated with warnings

---

### H5. Add Payment Method Token Structure | Effort: **M** | Status: ⚠️

**Description**:
According to Section 4.1.1, CartMandate must contain "A tokenized representation of the single, specific payment method to be charged." Need to ensure proper tokenization structure and PCI compliance.

**Specification References**:
- Section 4.1.1: The Cart Mandate - Payment Method field
- Section 5.4: Payment Method Selection
- Section 5.3: Payment Method Addition - tokenization requirements

**Files Affected**:
- `src/types/payment-token.ts` (new)
- `src/types/payment_request.ts`
- `src/core/mandates/cart/cart-mandate-validator.ts`
- `src/core/validation/payment-token-validator.ts` (new)
- `__test__/types/payment-token_test.ts` (new)
- `__test__/core/validation/payment-token-validation_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Create `PaymentToken` interface in `src/types/payment-token.ts`
- [ ] Add `token: string` field for tokenized payment method
- [ ] Add `token_type: "network" | "merchant" | "gateway"` enum field
- [ ] Add `payment_method: string` field (CARD, BANK_TRANSFER, etc.)
- [ ] Add `last_four_digits?: string` field for display purposes
- [ ] Add `expiry_date?: string` field for card tokens (format: YYYY-MM)
- [ ] Add `network?: string` field (Visa, Mastercard, etc.)
- [ ] Add `token_provider?: string` field for token issuer identification
- [ ] Add `token_reference_id?: string` field for tracking
- [ ] Add `cryptogram?: string` field for tokenized card transactions
- [ ] Create `PaymentTokenValidator` class
- [ ] Add validation for token format (PCI-compliant: no full PANs)
- [ ] Add validation for token_type enum
- [ ] Add validation for expiry_date format (YYYY-MM)
- [ ] Add validation for last_four_digits (4 digits only)
- [ ] Update `PaymentMethodData` in `payment_request.ts` to use PaymentToken structure
- [ ] Update `CartMandateValidator` to validate payment token presence
- [ ] Add validation rule: CartMandate must include valid payment token
- [ ] Add validation rule: token must not contain full PAN (security check)
- [ ] Add unit tests for PaymentToken structure
- [ ] Add tests for each token type (network, merchant, gateway)
- [ ] Add validation tests (valid tokens, invalid formats, security violations)
- [ ] Add tests for optional fields
- [ ] Document tokenization standards and PCI compliance requirements
- [ ] Add examples for different token types (Visa network token, merchant token, gateway token)
- [ ] Document integration with payment processors

**Acceptance Criteria**:
- [ ] PaymentToken interface fully defined with 10 fields
- [ ] Support for network tokens, merchant tokens, and gateway tokens
- [ ] Validation ensures PCI compliance (no full PANs)
- [ ] Token format validation for each token type
- [ ] Integration with CartMandate validation
- [ ] Tests cover all token types and validation scenarios
- [ ] Tests verify security requirements (PAN detection)
- [ ] Documentation explains tokenization standards
- [ ] Examples demonstrate integration with payment networks

---

## 🟡 MEDIA: Transaction Flows & Validation

### M1. Implement Payment Method Extensions Framework | Effort: **M** | Status: ⚠️

**Description**:
Implement payment method extension framework as referenced in Section 7.2 (Visa/Mastercard extensions) and Agent Card examples. This enables network-specific features and requirements.

**Specification References**:
- Section 7.2: Code Samples - Sample Merchant Agent Card (Visa extension)
- Section 7.2: Code Samples - Sample Credential Provider Agent Card
- Section 5.4: Payment Method Selection

**Files Affected**:
- `src/types/payment-method-extensions.ts` (new)
- `src/types/payment_request.ts`
- `src/core/mandates/shared/payment-request-validator.ts`
- `src/core/validation/extension-validator.ts` (new)
- `__test__/types/payment-method-extensions_test.ts` (new)
- `__test__/core/validation/extension-validation_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Create `PaymentMethodExtension` interface in `src/types/payment-method-extensions.ts`
- [ ] Add `uri: string` field for extension identifier (e.g., https://visa.github.io/paymentmethod/types/v1)
- [ ] Add `required: boolean` field to indicate if extension is mandatory
- [ ] Add `data?: Record<string, unknown>` field for extension-specific data
- [ ] Create `VisaExtension` interface extending `PaymentMethodExtension`
- [ ] Add Visa-specific fields (cardholder verification method, wallet integration)
- [ ] Create `MastercardExtension` interface extending `PaymentMethodExtension`
- [ ] Add Mastercard-specific fields (digital enablement, tokenization)
- [ ] Add `extensions?: PaymentMethodExtension[]` field to `AP2PaymentRequest`
- [ ] Create `ExtensionValidator` class for validating extensions
- [ ] Add validation for extension URI format
- [ ] Add validation for required extensions (must be supported)
- [ ] Add validation for extension data structure
- [ ] Update `PaymentRequestValidator` to validate extensions
- [ ] Add registry pattern for extension validators (extensible design)
- [ ] Add unit tests for PaymentMethodExtension structure
- [ ] Add tests for Visa extension validation
- [ ] Add tests for Mastercard extension validation
- [ ] Add tests for unknown extensions (should be allowed but logged)
- [ ] Add tests for required vs optional extensions
- [ ] Document extension framework architecture
- [ ] Add examples for Visa extension usage
- [ ] Add examples for Mastercard extension usage
- [ ] Document how to create custom extensions
- [ ] Provide extension registration guide

**Acceptance Criteria**:
- [ ] PaymentMethodExtension interface defined with URI and data fields
- [ ] Visa and Mastercard extension interfaces implemented
- [ ] Extensions field added to AP2PaymentRequest
- [ ] Validation supports required and optional extensions
- [ ] Registry pattern allows adding custom extensions
- [ ] Tests cover Visa and Mastercard extensions
- [ ] Tests verify required extension enforcement
- [ ] Documentation explains extension framework
- [ ] Examples demonstrate network-specific extensions

---

### M2. Add Comprehensive Integration Tests | Effort: **L** | Status: ⚠️

**Description**:
Add comprehensive integration tests for complete transaction flows matching specification sections 5.1, 5.2, 5.5, and 6. Current tests are mostly unit tests; integration coverage is limited.

**Specification References**:
- Section 5.1: Human Present Transaction
- Section 5.2: Human Not Present Transaction
- Section 5.5: Transaction Challenges
- Section 6: Enabling Dispute Resolution
- Section 7.1: Illustrative Transaction Flow

**Files Affected**:
- `__test__/integration/human-present-flow_test.ts` (new)
- `__test__/integration/human-not-present-flow_test.ts` (new)
- `__test__/integration/challenge-flow_test.ts` (new)
- `__test__/integration/dispute-flow_test.ts` (new)
- `__test__/integration/payment-method-selection_test.ts` (new)
- `__test__/integration/performance_test.ts` (new)
- `__test__/integration/concurrent-access_test.ts` (new)

**Dependencies**: C1, C2, C3, C4 (requires core features to be implemented)

**Subtasks**:
- [ ] Create test fixtures for realistic transaction scenarios
- [ ] Create mock Credential Provider for integration tests
- [ ] Create mock Merchant Agent for integration tests
- [ ] Create mock User Agent for integration tests
- [ ] Implement human-present transaction flow test (Section 5.1)
- [ ] Test flow: Shopping Prompts -> IntentMandate -> CartMandate -> Payment
- [ ] Verify merchant signature on CartMandate
- [ ] Verify user authorization on PaymentMandate
- [ ] Test payment method selection and tokenization
- [ ] Implement human-not-present transaction flow test (Section 5.2)
- [ ] Test flow: Intent Mandate signing -> Asynchronous execution -> Payment
- [ ] Verify Intent Mandate signature with user device key
- [ ] Test merchant-forced user confirmation scenario
- [ ] Implement challenge flow test (Section 5.5)
- [ ] Test 3DS2 challenge initiation
- [ ] Test OTP challenge flow
- [ ] Test challenge resolution and transaction completion
- [ ] Implement dispute flow test (Section 6)
- [ ] Test first-party misuse scenario (user-signed Cart Mandate as evidence)
- [ ] Test mispick scenario (compare Intent vs Cart Mandate)
- [ ] Test merchant non-fulfillment scenario
- [ ] Test account takeover detection
- [ ] Implement payment method selection flow test (Section 5.4)
- [ ] Test Credential Provider payment method retrieval
- [ ] Test payment method compatibility checking
- [ ] Test "on file" payment method scenario
- [ ] Add performance benchmarks for full transaction flows
- [ ] Measure end-to-end latency (IntentMandate creation to Payment completion)
- [ ] Measure signature verification performance
- [ ] Measure hash computation performance
- [ ] Add concurrent access tests (multiple transactions simultaneously)
- [ ] Test thread safety of mandate creation
- [ ] Test JTI validation under concurrent load
- [ ] Test cache performance under load
- [ ] Add memory leak detection tests
- [ ] Create sequence diagrams documenting test flows
- [ ] Document test scenarios and expected outcomes
- [ ] Add CI/CD integration for running integration tests

**Acceptance Criteria**:
- [ ] Human-present flow integration test matches Section 5.1 specification
- [ ] Human-not-present flow integration test matches Section 5.2 specification
- [ ] Challenge flow test covers 3DS2 and OTP scenarios
- [ ] Dispute flow tests cover all scenarios from Section 6
- [ ] Payment method selection tests validate compatibility checking
- [ ] Performance benchmarks establish baseline metrics
- [ ] Concurrent access tests verify thread safety
- [ ] Memory leak tests ensure no resource leaks
- [ ] Tests run automatically in CI/CD pipeline
- [ ] Documentation explains each test scenario
- [ ] Sequence diagrams illustrate test flows

---

### M3. Improve W3C Payment Request Integration | Effort: **S** | Status: ⚠️

**Description**:
Ensure full W3C Payment Request API compliance and add missing fields. Current implementation has basic W3C structure but may be missing some fields.

**Specification References**:
- Section 7.2: Code Samples - CartMandate uses W3C Payment Request structure
- W3C Payment Request API specification
- Section 5.4: Payment Method Selection

**Files Affected**:
- `src/types/payment_request.ts`
- `src/core/mandates/shared/payment-request-validator.ts`
- `src/core/validation/w3c-compliance-validator.ts` (new)
- `__test__/types/payment-request-w3c_test.ts` (new)
- `__test__/core/validation/w3c-compliance_test.ts` (new)

**Dependencies**: H3 (field naming convention should be fixed first)

**Subtasks**:
- [ ] Review W3C Payment Request API specification for required fields
- [ ] Add `payment_processor_url?: string` to `PaymentMethodData` interface
- [ ] Add `supported_networks?: string[]` to PaymentMethodData for card payments
- [ ] Add `supported_types?: string[]` to PaymentMethodData (credit, debit, prepaid)
- [ ] Verify `PaymentDetailsInit` includes all W3C required fields
- [ ] Add `error?: string` field to PaymentDetailsInit for error scenarios
- [ ] Verify `PaymentOptions` matches W3C specification
- [ ] Add `requestBillingAddress?: boolean` to PaymentOptions
- [ ] Create `W3CComplianceValidator` class
- [ ] Add validation for required W3C fields
- [ ] Add validation for W3C field formats and data types
- [ ] Add validation for payment method data structure
- [ ] Update `PaymentRequestValidator` to use W3C compliance validation
- [ ] Add unit tests for W3C required fields
- [ ] Add tests for payment method data validation
- [ ] Add tests for PaymentOptions validation
- [ ] Add tests for PaymentDetailsInit validation
- [ ] Compare ap2-lib types with W3C spec and document differences
- [ ] Update documentation with W3C Payment Request API references
- [ ] Add examples matching W3C patterns
- [ ] Document deviations from W3C spec (if any) with justification

**Acceptance Criteria**:
- [ ] All W3C Payment Request API required fields present
- [ ] Payment method data structure matches W3C specification
- [ ] PaymentOptions includes all W3C fields
- [ ] W3C compliance validator enforces specification requirements
- [ ] Tests verify W3C compliance
- [ ] Tests cover all payment method types
- [ ] Documentation references W3C specification
- [ ] Examples demonstrate W3C-compliant payment requests
- [ ] Deviations documented with justification

---

### M4. Add Identity Verification Helpers | Effort: **M** | Status: ❌

**Description**:
Create helper utilities for VDC verification and allowlist management as discussed in Section 3.2. These utilities are critical for establishing trust in the agentic ecosystem.

**Specification References**:
- Section 3.2: The Flow of Trust
- Section 3.2.1: Short Term - manually curated allow lists
- Section 3.2.2: Long Term - real-time trust establishment
- Glossary: Verifiable digital credential (VDC)

**Files Affected**:
- `src/core/identity/vdc-verifier.ts` (new)
- `src/core/identity/allowlist-manager.ts` (new)
- `src/types/allowlist.ts` (new)
- `src/types/trust-registry.ts` (new)
- `__test__/core/identity/vdc-verifier_test.ts` (new)
- `__test__/core/identity/allowlist-manager_test.ts` (new)

**Dependencies**: H2 (payer/payee identity fields must be implemented first)

**Subtasks**:
- [ ] Create `VDCVerifier` interface in `src/core/identity/vdc-verifier.ts`
- [ ] Add `.verifyCredential(vdc: VerifiableCredential): Promise<VerificationResult>` method
- [ ] Add `.verifyPresentation(vp: VerifiablePresentation): Promise<VerificationResult>` method
- [ ] Add `.verifyIssuerSignature(vdc: VerifiableCredential, issuerPublicKey: string): Promise<boolean>` method
- [ ] Add `.checkRevocationStatus(vdc: VerifiableCredential): Promise<boolean>` method
- [ ] Implement basic VDC verification using JWT signature validation
- [ ] Create `AllowlistManager` class in `src/core/identity/allowlist-manager.ts`
- [ ] Create `TrustRegistry` interface in `src/types/trust-registry.ts`
- [ ] Add `.isAgentAllowed(agentId: string, category: "shopping_agent" | "credential_provider" | "merchant"): boolean` method
- [ ] Add `.addToAllowlist(agentId: string, category: string, metadata?: Record<string, unknown>): void` method
- [ ] Add `.removeFromAllowlist(agentId: string, category: string): void` method
- [ ] Add `.getAgentMetadata(agentId: string): AllowlistEntry | null` method
- [ ] Add `.loadAllowlistFromFile(filePath: string): Promise<void>` method
- [ ] Add `.saveAllowlistToFile(filePath: string): Promise<void>` method
- [ ] Create `Allowlist` type with agent entries and categories
- [ ] Support JSON format for allowlist storage
- [ ] Add integration with validators to check allowlist during mandate validation
- [ ] Update `IntentMandateValidator` to check shopping agent allowlist
- [ ] Update `CartMandateValidator` to check merchant allowlist
- [ ] Update `PaymentMandateValidator` to check credential provider allowlist
- [ ] Add unit tests for VDC verification (valid VDC, invalid signature, expired VDC)
- [ ] Add tests for allowlist management (add, remove, check)
- [ ] Add tests for allowlist persistence (save/load)
- [ ] Add integration tests for validator + allowlist checks
- [ ] Document VDC verification process with sequence diagram
- [ ] Document allowlist format and management procedures
- [ ] Add examples for trust establishment with VDCs
- [ ] Document short-term vs long-term trust models

**Acceptance Criteria**:
- [ ] VDCVerifier interface supports credential and presentation verification
- [ ] VDC signature verification implemented using JWT/JOSE
- [ ] Revocation status checking supported
- [ ] AllowlistManager supports CRUD operations on allowlists
- [ ] Allowlist persistence (JSON file format)
- [ ] Integration with all mandate validators
- [ ] Tests cover VDC verification scenarios
- [ ] Tests verify allowlist management functionality
- [ ] Documentation explains trust establishment flows
- [ ] Examples demonstrate allowlist usage in production

---

### M5. Implement Transaction Flow Orchestration | Effort: **L** | Status: ❌

**Description**:
Implement flow orchestration classes for Human-Present and Human-Not-Present flows as described in Sections 5.1 and 5.2. These orchestrator classes will guide developers through correct transaction flows.

**Specification References**:
- Section 5.1: Human Present Transaction
- Section 5.2: Human Not Present Transaction
- Section 7.1: Illustrative Transaction Flow (sequence diagram)

**Files Affected**:
- `src/core/flows/transaction-flow.ts` (new)
- `src/core/flows/human-present-flow.ts` (new)
- `src/core/flows/human-not-present-flow.ts` (new)
- `src/types/flow-state.ts` (new)
- `__test__/core/flows/human-present-flow_test.ts` (new)
- `__test__/core/flows/human-not-present-flow_test.ts` (new)

**Dependencies**: C4 (IntentMandate signing), H1 (risk payload), H2 (identity fields)

**Subtasks**:
- [ ] Create `TransactionFlow` abstract base class in `src/core/flows/transaction-flow.ts`
- [ ] Add `currentState: FlowState` property for tracking flow progress
- [ ] Add `validateState(): ValidationResult` method for state validation
- [ ] Add `transitionTo(newState: FlowState): void` method for state transitions
- [ ] Add `getCurrentStep(): FlowStep` method for progress tracking
- [ ] Add `canProceed(): boolean` method to check if flow can advance
- [ ] Create `FlowState` enum with states (INIT, INTENT_CREATED, CART_SIGNED, PAYMENT_AUTHORIZED, COMPLETED, ERROR)
- [ ] Create `HumanPresentFlow` class extending `TransactionFlow`
- [ ] Implement `.createIntentMandate(params: IntentMandateParams): IntentMandate` step
- [ ] Implement `.requestPaymentMethods(cp: CredentialProvider): PaymentMethod[]` step
- [ ] Implement `.createCartMandate(merchant: Merchant, intent: IntentMandate): CartMandate` step
- [ ] Implement `.signCartMandateByMerchant(cart: CartMandate, merchantKey: CryptoKey): Promise<void>` step
- [ ] Implement `.presentCartToUser(cart: CartMandate, paymentMethods: PaymentMethod[]): void` step
- [ ] Implement `.getUserConfirmation(): Promise<boolean>` step
- [ ] Implement `.createPaymentMandate(cart: CartMandate, response: PaymentResponse): PaymentMandate` step
- [ ] Implement `.authorizePayment(payment: PaymentMandate): Promise<AuthorizationResult>` step
- [ ] Add state validation at each step (e.g., can't sign cart before creating intent)
- [ ] Create `HumanNotPresentFlow` class extending `TransactionFlow`
- [ ] Implement `.createSignedIntentMandate(params: IntentMandateParams, userKey: CryptoKey): Promise<IntentMandate>` step
- [ ] Implement `.executeAsynchronously(intent: IntentMandate): Promise<ExecutionResult>` step
- [ ] Implement `.handleMerchantConfirmationRequest(merchant: Merchant): Promise<boolean>` step
- [ ] Implement `.forceUserConfirmation(): Promise<boolean>` step (when merchant requires it)
- [ ] Add state transition logic for asynchronous execution
- [ ] Add error handling for each flow step
- [ ] Implement rollback/compensation logic for failed steps
- [ ] Add flow event emitters for progress tracking
- [ ] Add unit tests for HumanPresentFlow (all steps, state transitions)
- [ ] Add unit tests for HumanNotPresentFlow (all steps, async execution)
- [ ] Add tests for error scenarios (failed steps, invalid state transitions)
- [ ] Add tests for rollback/compensation logic
- [ ] Create sequence diagrams for both flows
- [ ] Document flow state machine with state transition diagram
- [ ] Add examples demonstrating flow usage
- [ ] Document error handling and recovery patterns

**Acceptance Criteria**:
- [ ] TransactionFlow base class provides state management
- [ ] HumanPresentFlow implements all steps from Section 5.1
- [ ] HumanNotPresentFlow implements all steps from Section 5.2
- [ ] State transitions validated at each step
- [ ] Error handling and rollback logic implemented
- [ ] Flow progress tracking with events
- [ ] Tests verify all flow scenarios
- [ ] Tests cover error and rollback cases
- [ ] Documentation includes sequence diagrams
- [ ] Examples demonstrate production usage

---

### M6. Add Challenge Flow Support | Effort: **L** | Status: ❌

**Description**:
Implement transaction challenge handling as described in Section 5.5 (3DS2, OTP, etc.). Challenge support is critical for fraud prevention and regulatory compliance.

**Specification References**:
- Section 5.5: Transaction Challenges
- Section 5.1: Human Present Transaction - Challenge step
- Section 7.4: Risk Signals

**Files Affected**:
- `src/core/challenges/challenge-handler.ts` (new)
- `src/types/challenge.ts` (new)
- `src/types/challenge-result.ts` (new)
- `__test__/core/challenges/challenge-handler_test.ts` (new)
- `__test__/integration/challenge-flow_test.ts` (new)

**Dependencies**: M5 (transaction flow orchestration)

**Subtasks**:
- [ ] Create `Challenge` interface in `src/types/challenge.ts`
- [ ] Add `challenge_id: string` field for unique identification
- [ ] Add `challenge_type: "3DS2" | "OTP" | "BIOMETRIC" | "REDIRECT"` enum field
- [ ] Add `challenge_url?: string` field for redirect challenges
- [ ] Add `challenge_data?: Record<string, unknown>` field for challenge-specific data
- [ ] Add `initiated_by: "issuer" | "merchant" | "credential_provider"` field
- [ ] Add `created_at: string` timestamp field
- [ ] Add `expires_at: string` expiration timestamp field
- [ ] Create `ChallengeResult` interface in `src/types/challenge-result.ts`
- [ ] Add `challenge_id: string` reference field
- [ ] Add `status: "success" | "failed" | "cancelled" | "expired"` enum field
- [ ] Add `completed_at: string` timestamp field
- [ ] Add `authentication_value?: string` field for 3DS2 authentication value
- [ ] Create `ChallengeHandler` class in `src/core/challenges/challenge-handler.ts`
- [ ] Implement `.initiateChallenge(type: ChallengeType, params: ChallengeParams): Challenge` method
- [ ] Implement `.presentChallengeToUser(challenge: Challenge): Promise<void>` method
- [ ] Implement `.waitForChallengeCompletion(challengeId: string, timeout: number): Promise<ChallengeResult>` method
- [ ] Implement `.resolveChallenge(challengeId: string, result: ChallengeResult): void` method
- [ ] Implement `.cancelChallenge(challengeId: string): void` method
- [ ] Add 3DS2 challenge support with redirect URL handling
- [ ] Add OTP challenge support with code validation
- [ ] Add biometric challenge support (WebAuthn integration pattern)
- [ ] Add challenge timeout handling
- [ ] Add challenge expiry validation
- [ ] Integrate challenge flow with transaction orchestration
- [ ] Update `HumanPresentFlow` to support challenge step
- [ ] Update `HumanNotPresentFlow` to force user into session for challenges
- [ ] Add challenge state tracking in flow state machine
- [ ] Add unit tests for challenge initiation (all types)
- [ ] Add tests for challenge completion (success, failure, cancellation)
- [ ] Add tests for challenge timeout and expiry
- [ ] Add integration tests for 3DS2 flow
- [ ] Add integration tests for OTP flow
- [ ] Add tests for challenge forcing user into session (human-not-present)
- [ ] Document challenge framework architecture
- [ ] Add examples for each challenge type (3DS2, OTP, biometric)
- [ ] Document integration with existing risk systems
- [ ] Add sequence diagrams for challenge flows

**Acceptance Criteria**:
- [ ] Challenge interface supports 3DS2, OTP, biometric, and redirect types
- [ ] ChallengeHandler manages challenge lifecycle
- [ ] Challenge timeout and expiry handled correctly
- [ ] Integration with transaction flow orchestration
- [ ] 3DS2 redirect challenges supported
- [ ] OTP challenges supported
- [ ] Tests cover all challenge types and scenarios
- [ ] Tests verify timeout and expiry handling
- [ ] Documentation explains challenge integration
- [ ] Examples demonstrate production usage

---

## 🟢 BAJA: Testing & Quality

### L1. Hardware-Backed Key Integration | Effort: **XL** | Status: ❌

**Description**:
Implement full hardware-backed key integration using WebAuthn and device attestation. This is the gold standard for user signature security.

**Specification References**:
- Section 4.1.2: Intent Mandate - "cryptographically signed by the user, typically using a hardware-backed key"
- Section 9: Issuance of Trusted Public Keys
- Section 2.2: User Control and Privacy by Design

**Files Affected**:
- `src/core/jwt/webauthn-service.ts` (new)
- `src/core/jwt/device-attestation.ts` (new)
- `src/core/jwt/secure-enclave-adapter.ts` (new)
- `src/types/webauthn.ts` (new)
- `__test__/core/jwt/webauthn-service_test.ts` (new)
- `__test__/integration/hardware-keys_test.ts` (new)
- `__test__/browser/webauthn_test.ts` (new)

**Dependencies**: C4 (IntentMandate signing must be implemented first)

**Subtasks**:
- [ ] Create WebAuthn service wrapper in `src/core/jwt/webauthn-service.ts`
- [ ] Implement `.registerDevice(userId: string): Promise<WebAuthnCredential>` for device registration
- [ ] Implement `.authenticateWithDevice(userId: string): Promise<AuthenticationResult>` for signature
- [ ] Implement `.signWithWebAuthn(data: ArrayBuffer): Promise<ArrayBuffer>` for hardware signing
- [ ] Add support for platform authenticators (Touch ID, Face ID, Windows Hello)
- [ ] Add support for roaming authenticators (FIDO2 security keys)
- [ ] Create device attestation service in `src/core/jwt/device-attestation.ts`
- [ ] Implement `.verifyAttestation(attestation: AttestationObject): Promise<boolean>` method
- [ ] Implement `.extractPublicKey(attestation: AttestationObject): CryptoKey` method
- [ ] Add support for packed attestation format
- [ ] Add support for tpm attestation format (Trusted Platform Module)
- [ ] Add support for android-safetynet attestation format
- [ ] Create Secure Enclave adapter for iOS devices
- [ ] Implement iOS Keychain integration patterns
- [ ] Add Android Keystore integration patterns
- [ ] Create cross-platform key storage abstraction
- [ ] Update `DeviceKeyManager` to use hardware-backed keys when available
- [ ] Add fallback to software keys when hardware not available
- [ ] Add device capability detection (can hardware keys be used?)
- [ ] Integrate WebAuthn with IntentMandate signing
- [ ] Add metadata to signed mandates indicating hardware-backed key usage
- [ ] Add unit tests for WebAuthn service (mocked authenticator)
- [ ] Add tests for device attestation verification
- [ ] Add cross-platform tests (iOS, Android, Desktop browsers)
- [ ] Test on Safari (iOS), Chrome (Android), Edge (Windows Hello)
- [ ] Add tests for fallback to software keys
- [ ] Document WebAuthn integration architecture
- [ ] Add platform-specific setup guides (iOS, Android, Desktop)
- [ ] Document device registration and authentication flows
- [ ] Add examples for each platform

**Acceptance Criteria**:
- [ ] WebAuthn integration working on major platforms
- [ ] Device attestation verification implemented
- [ ] Support for platform authenticators (Touch ID, Face ID, Windows Hello)
- [ ] Support for roaming authenticators (FIDO2 keys)
- [ ] Secure Enclave integration patterns for iOS
- [ ] Android Keystore integration patterns
- [ ] Cross-platform testing completed
- [ ] Fallback to software keys when hardware unavailable
- [ ] Tests on Safari, Chrome, Edge, Firefox
- [ ] Documentation with platform-specific guides
- [ ] Examples for each platform

---

### L2. Key Rotation Utilities | Effort: **M** | Status: ❌

**Description**:
Add utilities for cryptographic key rotation and version management. Essential for operational security and long-term key lifecycle management.

**Specification References**:
- Section 9: Issuance of Trusted Public Keys - key distribution and trust
- Operational best practices for cryptographic systems

**Files Affected**:
- `src/core/jwt/key-rotation-manager.ts` (new)
- `src/types/key-version.ts` (new)
- `src/types/key-metadata.ts` (new)
- `__test__/core/jwt/key-rotation_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Create `KeyVersion` interface in `src/types/key-version.ts`
- [ ] Add `key_id: string` field for unique key identification
- [ ] Add `version: number` field for version tracking
- [ ] Add `algorithm: string` field (RS256, ES256, etc.)
- [ ] Add `created_at: string` timestamp field
- [ ] Add `expires_at?: string` expiration timestamp field
- [ ] Add `status: "active" | "rotating" | "deprecated" | "revoked"` enum field
- [ ] Create `KeyMetadata` interface for additional key information
- [ ] Create `KeyRotationManager` class in `src/core/jwt/key-rotation-manager.ts`
- [ ] Implement `.rotateKey(currentKeyId: string): Promise<KeyVersion>` method
- [ ] Implement `.getActiveKey(): KeyVersion` method
- [ ] Implement `.getKeyByVersion(version: number): KeyVersion | null` method
- [ ] Implement `.deprecateKey(keyId: string): Promise<void>` method
- [ ] Implement `.revokeKey(keyId: string): Promise<void>` method
- [ ] Add graceful key transition logic (old keys remain valid during rotation)
- [ ] Add configurable grace period for deprecated keys
- [ ] Implement key version tracking in JWTs (kid header)
- [ ] Update JWTService to use KeyRotationManager
- [ ] Add support for multiple active keys during rotation
- [ ] Add key expiry enforcement
- [ ] Add notification hooks for key rotation events
- [ ] Add unit tests for key rotation (create new key, deprecate old)
- [ ] Add tests for graceful transitions (both keys valid)
- [ ] Add tests for key expiry and revocation
- [ ] Add tests for version tracking and retrieval
- [ ] Document key rotation procedures
- [ ] Document recommended rotation schedules (e.g., annually)
- [ ] Add operational runbook for key rotation
- [ ] Add examples for production key management

**Acceptance Criteria**:
- [ ] KeyRotationManager supports full key lifecycle
- [ ] Graceful transitions during rotation (no downtime)
- [ ] Multiple active keys supported during transition
- [ ] Key version tracking in JWT headers
- [ ] Configurable grace period for deprecated keys
- [ ] Key expiry and revocation enforced
- [ ] Tests cover all rotation scenarios
- [ ] Tests verify graceful transitions
- [ ] Documentation includes operational runbook
- [ ] Examples demonstrate production key management

---

### L3. Fuzzing Tests | Effort: **M** | Status: ❌

**Description**:
Add fuzzing tests for validators and parsers to discover edge cases and potential security vulnerabilities. Fuzzing is essential for robust security testing.

**Specification References**:
- Security best practices for payment systems
- OWASP testing guidelines

**Files Affected**:
- `__test__/fuzz/validator-fuzz_test.ts` (new)
- `__test__/fuzz/serializer-fuzz_test.ts` (new)
- `__test__/fuzz/parser-fuzz_test.ts` (new)
- `fuzz/fuzzing-framework.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Set up fuzzing framework (integrate with Deno test)
- [ ] Create fuzzing utilities in `fuzz/fuzzing-framework.ts`
- [ ] Implement random data generators for each mandate type
- [ ] Implement mutation-based fuzzer (modify valid inputs)
- [ ] Implement generation-based fuzzer (create random inputs)
- [ ] Create validator fuzzing tests for IntentMandateValidator
- [ ] Fuzz all validation rules with random inputs
- [ ] Test boundary conditions (max/min values)
- [ ] Test malformed data structures
- [ ] Create validator fuzzing tests for CartMandateValidator
- [ ] Create validator fuzzing tests for PaymentMandateValidator
- [ ] Create serializer fuzzing tests
- [ ] Fuzz JSON serialization with malformed JSON
- [ ] Test with extremely large payloads
- [ ] Test with deeply nested objects
- [ ] Test with special characters and encoding issues
- [ ] Create parser fuzzing tests
- [ ] Fuzz JWT parsing with invalid tokens
- [ ] Test with tampered signatures
- [ ] Test with malformed base64 encoding
- [ ] Add crash detection and reporting
- [ ] Add timeout detection (hang detection)
- [ ] Add memory leak detection during fuzzing
- [ ] Run fuzzing tests for extended periods (hours)
- [ ] Collect and categorize discovered issues
- [ ] Fix all discovered vulnerabilities
- [ ] Add regression tests for fixed issues
- [ ] Document fuzzing approach and methodology
- [ ] Add fuzzing to CI/CD pipeline (limited runs)
- [ ] Create fuzzing report template

**Acceptance Criteria**:
- [ ] Fuzzing framework integrated with Deno test
- [ ] All validators fuzzed with random inputs
- [ ] All serializers fuzzed with malformed data
- [ ] All parsers fuzzed with invalid inputs
- [ ] Crash detection and reporting functional
- [ ] Extended fuzzing runs completed (8+ hours)
- [ ] All discovered vulnerabilities fixed
- [ ] Regression tests added for fixed issues
- [ ] Fuzzing runs in CI/CD (limited duration)
- [ ] Documentation explains fuzzing methodology

---

### L4. Performance Optimization | Effort: **L** | Status: ❌

**Description**:
Profile and optimize critical paths for high-volume transaction processing. Performance is crucial for production deployment at scale.

**Specification References**:
- Section 1.1: The Rise of Agent Commerce - hyper-personalized, frictionless experience
- Operational requirements for high-volume payments

**Files Affected**:
- `benchmarks/signing_bench.ts` (new)
- `benchmarks/validation_bench.ts` (new)
- `benchmarks/serialization_bench.ts` (new)
- `benchmarks/hashing_bench.ts` (new)
- Various optimization implementations in core modules

**Dependencies**: M2 (integration tests should be in place first)

**Subtasks**:
- [ ] Set up benchmarking framework using Deno.bench
- [ ] Create signing benchmarks in `benchmarks/signing_bench.ts`
- [ ] Benchmark JWT signing performance (ES256, RS256)
- [ ] Benchmark mandate signing performance
- [ ] Benchmark signature verification performance
- [ ] Create validation benchmarks in `benchmarks/validation_bench.ts`
- [ ] Benchmark IntentMandate validation
- [ ] Benchmark CartMandate validation
- [ ] Benchmark PaymentMandate validation
- [ ] Create serialization benchmarks in `benchmarks/serialization_bench.ts`
- [ ] Benchmark JSON serialization for each mandate type
- [ ] Benchmark deserialization performance
- [ ] Benchmark field transformation (camelCase <-> snake_case)
- [ ] Create hashing benchmarks in `benchmarks/hashing_bench.ts`
- [ ] Benchmark canonical JSON generation
- [ ] Benchmark SHA-256 hashing
- [ ] Benchmark transaction hash computation
- [ ] Profile critical paths using Deno profiler
- [ ] Identify bottlenecks in mandate creation
- [ ] Identify bottlenecks in validation pipeline
- [ ] Identify bottlenecks in cryptographic operations
- [ ] Optimize validation rules (cache compiled regex, reduce allocations)
- [ ] Optimize JSON serialization (avoid unnecessary cloning)
- [ ] Optimize canonical JSON generation (use iterative sorting)
- [ ] Optimize cryptographic operations (reuse key objects)
- [ ] Add caching for frequently accessed data (e.g., public keys)
- [ ] Add memoization for expensive computations
- [ ] Implement batch validation for multiple mandates
- [ ] Add performance regression tests
- [ ] Set performance targets (e.g., <10ms per mandate validation)
- [ ] Run benchmarks before/after optimizations
- [ ] Document performance characteristics
- [ ] Document optimization techniques used
- [ ] Add performance monitoring guide for production

**Acceptance Criteria**:
- [ ] Comprehensive benchmarks for all critical paths
- [ ] Profiling identifies performance bottlenecks
- [ ] Optimizations implemented for identified bottlenecks
- [ ] Performance targets met (<10ms validation, <50ms signing)
- [ ] Caching and memoization strategies implemented
- [ ] Batch validation supported
- [ ] Performance regression tests in place
- [ ] Before/after benchmark comparisons documented
- [ ] Performance monitoring guide for production
- [ ] Benchmarks run in CI/CD to detect regressions

---

### L5. Browser Compatibility Testing | Effort: **L** | Status: ❌

**Description**:
Verify and test library functionality across major browsers. Essential for frontend deployment and WebAuthn integration.

**Specification References**:
- Web platform compatibility for agentic commerce
- WebAuthn and Web Crypto API browser support

**Files Affected**:
- `__test__/browser/webcrypto_test.ts` (new)
- `__test__/browser/webauthn_test.ts` (new)
- `__test__/browser/serialization_test.ts` (new)
- Browser test infrastructure

**Dependencies**: L1 (WebAuthn integration should be completed first)

**Subtasks**:
- [ ] Set up browser testing infrastructure (Playwright or Puppeteer)
- [ ] Configure test runners for multiple browsers
- [ ] Create WebCrypto API browser tests in `__test__/browser/webcrypto_test.ts`
- [ ] Test ES256 key generation in all browsers
- [ ] Test RS256 key generation in all browsers
- [ ] Test signing operations in all browsers
- [ ] Test verification operations in all browsers
- [ ] Test SubtleCrypto API compatibility
- [ ] Create WebAuthn browser tests in `__test__/browser/webauthn_test.ts`
- [ ] Test WebAuthn registration flow
- [ ] Test WebAuthn authentication flow
- [ ] Test platform authenticator availability
- [ ] Create serialization browser tests
- [ ] Test JSON serialization/deserialization
- [ ] Test TextEncoder/TextDecoder compatibility
- [ ] Run tests on Chrome/Chromium
- [ ] Run tests on Firefox
- [ ] Run tests on Safari (macOS and iOS)
- [ ] Run tests on Edge
- [ ] Test on mobile browsers (Chrome Mobile, Safari Mobile)
- [ ] Create browser compatibility matrix documenting results
- [ ] Document minimum browser versions required
- [ ] Add polyfills for older browsers if needed
- [ ] Create browser-specific examples
- [ ] Add troubleshooting guide for browser issues
- [ ] Add CI/CD integration for browser tests

**Acceptance Criteria**:
- [ ] Browser testing infrastructure set up (Playwright/Puppeteer)
- [ ] WebCrypto API tests pass on all major browsers
- [ ] WebAuthn tests pass on supporting browsers
- [ ] Tests run on Chrome, Firefox, Safari, Edge
- [ ] Mobile browser testing completed
- [ ] Compatibility matrix documented
- [ ] Minimum browser versions documented
- [ ] Polyfills added where necessary
- [ ] Browser-specific examples provided
- [ ] CI/CD runs browser tests automatically

---

### L6. Node.js Compatibility Enhancement | Effort: **M** | Status: ⚠️

**Description**:
Enhance Node.js compatibility and add Node.js-specific optimizations. Current NPM build exists but needs comprehensive testing.

**Specification References**:
- Cross-platform deployment requirements
- npm distribution for Node.js ecosystem

**Files Affected**:
- `scripts/build_npm.ts`
- Node.js build configuration
- `__test__/node/compatibility_test.ts` (new)
- `__test__/node/crypto_test.ts` (new)

**Dependencies**: None

**Subtasks**:
- [ ] Review current npm build process in `scripts/build_npm.ts`
- [ ] Verify Node.js crypto polyfills work correctly
- [ ] Test Web Crypto API polyfill in Node.js
- [ ] Test that SubtleCrypto operations work in Node.js
- [ ] Create Node.js compatibility tests in `__test__/node/compatibility_test.ts`
- [ ] Test mandate creation in Node.js environment
- [ ] Test JWT signing/verification in Node.js
- [ ] Test serialization/deserialization in Node.js
- [ ] Create Node.js crypto tests in `__test__/node/crypto_test.ts`
- [ ] Test ES256 signing in Node.js
- [ ] Test RS256 signing in Node.js
- [ ] Test key import/export in Node.js
- [ ] Add Node.js version compatibility testing (v16, v18, v20)
- [ ] Test with Node.js native crypto module
- [ ] Test with Web Crypto API polyfill
- [ ] Optimize for Node.js when possible (use native crypto)
- [ ] Add Node.js-specific examples in documentation
- [ ] Document Node.js setup and installation
- [ ] Add troubleshooting guide for Node.js issues
- [ ] Add CI/CD Node.js tests (multiple versions)
- [ ] Publish to npm registry with updated compatibility notes

**Acceptance Criteria**:
- [ ] Full Node.js compatibility verified
- [ ] Web Crypto API polyfill working correctly
- [ ] Tests pass on Node.js v16, v18, v20
- [ ] Node.js-specific optimizations implemented
- [ ] Examples demonstrate Node.js usage
- [ ] Setup documentation for Node.js
- [ ] CI/CD tests Node.js compatibility
- [ ] npm package published with compatibility notes

---

## 📊 Summary

### Total Tasks by Priority
- 🔴 **CRÍTICA**: 5 tasks (C1-C5) - 9-12 weeks total
- 🟠 **ALTA**: 5 tasks (H1-H5) - 3-4 weeks total
- 🟡 **MEDIA**: 6 tasks (M1-M6) - 6-8 weeks total
- 🟢 **BAJA**: 6 tasks (L1-L6) - 9-11 weeks total

**Total**: 22 major tasks

### Current Status
- ❌ **NOT IMPLEMENTED**: 18 tasks
- ⚠️ **PARTIALLY IMPLEMENTED**: 4 tasks (C3, H3, H5, L6)
- ✅ **IMPLEMENTED**: 0 tasks (all need enhancement)

### Estimated Total Effort
- **Critical Path (Production Ready)**: 9-12 weeks
- **Full Compliance**: 15-18 weeks
- **Complete with Enhancements**: 27-35 weeks

---

## 📈 Recommended Implementation Order

### Phase 1: Production Critical (9-12 weeks)

**Weeks 1-2**: Foundation - Hashing & AI Signals
- [ ] C3 - Transaction Hash Validation (week 1-2, 1 week)
- [ ] C2 - AI Agent Presence Signals (week 2, 3-5 days)
- [ ] H4 - CartMandate Timestamp (week 2, 1 day)

**Weeks 3-5**: User Authorization Foundation
- [ ] C4 - IntentMandate User Signature (weeks 3-4, 2-3 weeks)
- [ ] C5 - JTI Replay Prevention (week 5, 3-5 days)

**Weeks 6-8**: Payment Authorization
- [ ] C1 - SD-JWT-VC User Authorization (weeks 6-8, 2-3 weeks)

**Weeks 9-11**: Data Model Compliance
- [ ] H1 - Risk Payload (week 9-10, 3-5 days)
- [ ] H2 - Payer/Payee Identity (week 10-11, 3-5 days)
- [ ] H5 - Payment Method Token Structure (week 11, 3-5 days)

---

### Phase 2: Full Compliance (3-4 weeks)

**Weeks 12-13**: Serialization & Standards
- [ ] H3 - Field Naming Convention (week 12-13, 3-5 days)
- [ ] M3 - W3C Payment Request Integration (week 13, 1-2 days)

**Weeks 14-15**: Extensions & Helpers
- [ ] M1 - Payment Method Extensions (week 14, 3-5 days)
- [ ] M4 - Identity Verification Helpers (week 15, 3-5 days)

**Week 16**: Integration Testing
- [ ] M2 - Comprehensive Integration Tests (week 16, 1-2 weeks)

---

### Phase 3: Business Logic & Flows (3-4 weeks)

**Weeks 17-18**: Transaction Flows
- [ ] M5 - Transaction Flow Orchestration (week 17-18, 1-2 weeks)

**Weeks 19-20**: Challenge Support
- [ ] M6 - Challenge Flow Support (week 19-20, 1-2 weeks)

---

### Phase 4: Future Enhancements (9-11 weeks)

**Weeks 21-24**: Security & Hardware
- [ ] L1 - Hardware-Backed Key Integration (weeks 21-24, 3-4 weeks)

**Weeks 25-26**: Operations & Testing
- [ ] L2 - Key Rotation Utilities (week 25, 3-5 days)
- [ ] L3 - Fuzzing Tests (week 26, 3-5 days)

**Weeks 27-29**: Performance & Compatibility
- [ ] L4 - Performance Optimization (week 27-28, 1-2 weeks)
- [ ] L5 - Browser Compatibility Testing (week 28-29, 1-2 weeks)
- [ ] L6 - Node.js Compatibility Enhancement (week 29, 3-5 days)

---

## 📈 Current Metrics

### Current Status
- **Tests**: 260+ passing
- **Coverage**: 91.0% lines, 89.9% branches
- **Spec Compliance**: ~75%
- **Architecture**: SOLID principles ✅
- **TypeScript**: Strict mode ✅

### Target for 100% Compliance
- **Total Effort**: 9-12 weeks for production-ready (Phase 1)
- **Critical Path**: SD-JWT-VC + IntentMandate Signing + Transaction Hashing + AI Signals + JTI Replay Prevention
- **Full Compliance**: 15-18 weeks (Phase 1 + Phase 2)
- **With Enhancements**: 27-35 weeks (All phases)

---

## 🎯 Top 5 Immediate Priorities

1. **C4 - IntentMandate User Signature** (XL) - CRITICAL spec violation, foundational for human-not-present
2. **C3 - Transaction Hash Validation** (L) - Cryptographic binding, security foundation
3. **C1 - SD-JWT-VC User Authorization** (XL) - Core security for PaymentMandate, network visibility
4. **C2 - AI Agent Presence Signals** (M) - Required visibility for payments ecosystem
5. **C5 - JTI Replay Prevention** (M) - Security critical, prevents mandate reuse

---

**Generated By**: Claude Code (AP2 Protocol Expert)
**Last Updated**: 2025-10-15
**Next Review**: After completion of Phase 1 critical tasks
**Source**: Combined analysis of:
- `/Users/javier/@PROJECTS/@AP2/ap2-lib/TODO.md`
- `/Users/javier/@PROJECTS/@AP2/context/TODO.md`
- `/Users/javier/@PROJECTS/@AP2/ap2-lib/SPECIFICATION.md`
