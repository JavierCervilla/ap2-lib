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

