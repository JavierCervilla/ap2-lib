# 🤖 AP2-lib - Agent Payments Protocol Library

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](https://deno.land/x/ap2_lib)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Deno](https://img.shields.io/badge/deno-2.0+-black.svg)](https://deno.land)
[![JSR](https://img.shields.io/badge/JSR-@xja77/ap2--lib-yellow.svg)](https://jsr.io/@xja77/ap2-lib)
[![Test Coverage](https://img.shields.io/badge/coverage-85.2%25-brightgreen.svg)](#testing)

> **TypeScript/Deno implementation of the Agent Payments Protocol (AP2)** - The open, universal protocol backed by Google and 60+ organizations for autonomous commerce.

---

## 🚀 What is AP2?

The **Agent Payments Protocol (AP2)** enables AI agents to make secure, autonomous purchases on behalf of users. This library provides the core cryptographic primitives, mandate management, and validation logic needed to implement AP2-compliant payment systems.

### Key Features

- 🔒 **JWT/JOSE Security** - Industry-standard JWT signatures with RS256/ES256 algorithms
- 📝 **Strong TypeScript Typing** - Complete type safety for all AP2 structures
- 🏗️ **SOLID Architecture** - Clean OOP design with class-based API
- ✅ **High Test Coverage** - Comprehensive validation and error handling (85.2%+)
- 🌐 **Universal Compatibility** - Works in Deno, Node.js, and browsers
- 📊 **Advanced Validation** - Multi-layered mandate integrity checking

---

## 📦 Installation

### Via JSR (Recommended for Deno)

```bash
deno add @xja77/ap2-lib
```

### Via npm

```bash
npm install @xja77/ap2-lib
```

### Via Deno import

```typescript
import { IntentMandateClass, CartMandateClass } from "https://deno.land/x/ap2_lib/mod.ts";
```

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    User[👤 User Intent] --> Agent[🤖 AI Agent]
    Agent --> IntentMandate[📋 Intent Mandate]
    IntentMandate --> Shopping[🛍️ Shopping Process]
    Shopping --> CartMandate[🛒 Cart Mandate]
    CartMandate --> JWT[🔏 JWT Signature]
    JWT --> Payment[💳 Secure Payment]
    Payment --> Verification[✅ JWT Verification]

    style IntentMandate fill:#e1f5fe
    style CartMandate fill:#f3e5f5
    style JWT fill:#e8f5e8
    style Payment fill:#fff3e0
```

### Module Structure

```mermaid
graph LR
    A[ap2-lib] --> B[Types]
    A --> C[Core]
    A --> D[Utils]

    B --> B1[Mandates]
    B --> B2[Payment Request]
    B --> B3[Contact Picker]

    C --> C1[Mandates]
    C --> C2[JWT/Crypto]
    C --> C3[Validation]

    C1 --> C1a[Intent]
    C1 --> C1b[Cart]
    C1 --> C1c[Payment]
    C1 --> C1d[Shared]

    D --> D1[Errors]
    D --> D2[Date Utils]
```

---

## 🔥 Quick Start

### Creating an Intent Mandate

```typescript
import { IntentMandateClass } from "@xja77/ap2-lib";

// Create a user's purchase intent
const intent = await IntentMandateClass.createNew({
  natural_language_description: "Wireless noise-canceling headphones under $200",
  intent_expiry: "2024-12-31T23:59:59Z",
  user_cart_confirmation_required: false,
  merchants: ["amazon.com", "bestbuy.com"],
  requires_refundability: true
});

console.log(intent.toString());
// Output: "Intent Mandate (ID: abc123...)"

console.log(intent.getData());
// Output: Complete intent mandate data structure

// Check if intent is expired
const isExpired = await intent.checkExpiry();
console.log(`Intent expired: ${isExpired}`);
```

### Creating a Cart Mandate with JWT Signature

```typescript
import { CartMandateClass } from "@xja77/ap2-lib";

// Define cart contents
const cartContents = {
  id: "cart-12345",
  merchant_name: "TechStore",
  cart_expiry: "2024-12-31T23:59:59Z",
  payment_request: {
    id: "payment-67890",
    methodData: [{ supportedMethods: "basic-card" }],
    details: {
      total: {
        label: "Sony WH-1000XM4",
        amount: { currency: "USD", value: "299.99" },
        refund_period: 30
      }
    }
  },
  user_cart_confirmation_required: false
};

// Create cart mandate
const cartMandate = await CartMandateClass.createNew({
  contents: cartContents
});

// Sign with JWT
await cartMandate.sign(
  "-----BEGIN RSA PRIVATE KEY-----\n...", // Your RSA private key in PEM format
  { algorithm: "RS256", keyId: "key-1" },
  { merchantId: "merchant-123" }
);

// Verify the JWT signature
const isValid = await cartMandate.verifySignature();
console.log(`Cart mandate JWT signature valid: ${isValid}`);

console.log(cartMandate.getStatus()); // "authorized"
```

### Validation and Integrity Checking

```typescript
import { CartMandateValidator } from "@xja77/ap2-lib";

// Direct validation using class methods (recommended)
await cartMandate.validate(); // Throws if invalid

// Or use validator directly
const validator = new CartMandateValidator();

// Validate cart mandate structure
const validationResult = await validator.validate(cartMandate.getData());
if (!validationResult.isValid) {
  console.error("Validation errors:", validationResult.errors);
}

// Check mandate integrity
const integrityResult = await validator.validateIntegrity(cartMandate.getData());
if (!integrityResult.isValid) {
  console.error("Integrity check failed:", integrityResult.errors);
}

// Check expiry using class method
const isExpired = await cartMandate.checkExpiry();
console.log(`Mandate expired: ${isExpired}`);
```

---

## 📋 Mandate Types

| Type | Purpose | Signature Required | Methods Available |
|------|---------|-------------------|------------------|
| **Intent** | User's purchase intent in natural language | ❌ No | `.validate()`, `.checkExpiry()`, `.toString()` |
| **Cart** | Specific cart contents with pricing | ✅ Yes (JWT) | `.sign()`, `.verifySignature()`, `.validate()`, `.checkExpiry()` |
| **Payment** | Payment method and transaction details | ✅ Yes (JWT) | `.sign()`, `.verifySignature()`, `.validate()` |

### Mandate State Flow

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Authorized: validate()
    Authorized --> Captured: execute_payment()
    Authorized --> Failed: payment_error()
    Captured --> Refunded: process_refund()
    Pending --> Cancelled: user_cancel()
    Failed --> [*]
    Refunded --> [*]
    Cancelled --> [*]
```

---

## 🔐 Security Features

### JWT/JOSE Signatures

AP2-lib uses industry-standard JWT/JOSE signatures for cart mandate authentication:

```typescript
import { jwtService } from "@xja77/ap2-lib";

// Sign cart contents with JWT
const payload = {
  iss: "merchant-123",
  sub: "merchant-123",
  aud: "payment-processor",
  cart_hash: await jwtService.computeCartHash(cartContents),
};

const keyConfig = {
  privateKey: "-----BEGIN RSA PRIVATE KEY-----\n...",
  publicKey: "-----BEGIN RSA PUBLIC KEY-----\n...",
  algorithm: "RS256" as const, // or "ES256"
};

const jwt = await jwtService.signMerchantAuthorization(payload, {
  keyConfig,
  expiresIn: 900 // 15 minutes
});

// Verify JWT signature
const result = await jwtService.verifyMerchantAuthorization(jwt, {
  keyConfig,
  audience: "payment-processor",
  issuer: "merchant-123"
});

console.log(`JWT valid: ${result.valid}`);
```

### Validation Layers

1. **Schema Validation** - TypeScript interfaces and runtime checks
2. **Business Logic Validation** - AP2 protocol compliance
3. **Cryptographic Validation** - Signature verification and integrity
4. **Temporal Validation** - Expiry and timing checks

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
deno task test

# Generate coverage report
deno task coverage

# Detailed coverage with uncovered lines
deno task coverage:detailed
```

### Current Test Metrics

- **Total Tests**: 180+ passing
- **Line Coverage**: 85.2%+
- **Branch Coverage**: 85.2%+
- **Files**: 51 TypeScript modules

---

## 📚 API Documentation

Generate complete API documentation:

```bash
# Generate HTML documentation
deno doc --html --name="AP2 Library" --output=docs ./src/mod.ts

# View documentation in terminal
deno doc ./src/mod.ts
```

### Core API Reference

```typescript
// Mandate Classes (OOP API)
export class IntentMandateClass extends BaseMandate<IntentMandate> {
  static createNew(params: CreateIntentMandateParams): Promise<IntentMandateClass>
  validate(): Promise<void>
  checkExpiry(currentDate?: Date): Promise<boolean>
  toString(): string
  getData(): IntentMandate
  getStatus(): MandateStatus
}

export class CartMandateClass extends BaseMandate<CartMandate> {
  static createNew(params: CreateCartMandateParams): Promise<CartMandateClass>
  sign(privateKey: string, keyConfig: Partial<JWTKeyConfig>, merchantInfo: { merchantId: string }): Promise<void>
  verifySignature(): Promise<boolean>
  validate(): Promise<void>
  checkExpiry(currentDate?: Date): Promise<boolean>
}

// Validation Classes
export class IntentMandateValidator {
  validate(mandate: IntentMandate): Promise<ValidationResult>
  validateIntegrity(mandate: IntentMandate): Promise<ValidationResult>
  checkExpiry(mandate: IntentMandate, currentDate?: Date): Promise<boolean>
}

// JWT Service
export class JWTService implements IJWTService {
  signMerchantAuthorization(payload: MerchantAuthorizationPayload, options: JWTSignOptions): Promise<string>
  verifyMerchantAuthorization(jwt: string, options: JWTVerifyOptions): Promise<JWTVerificationResult>
  computeCartHash(cartContents: unknown): Promise<string>
  generateJTI(): string
}
```

---

## 🛠️ Development

### Available Scripts

```bash
deno task dev          # Watch mode development
deno task test         # Run test suite
deno task coverage     # Generate coverage report
deno task build        # Build for npm distribution
deno task publish      # Publish to JSR and npm
```

### Project Structure

```
src/
├── core/               # Core AP2 implementations
│   ├── mandates/       # Mandate management (Intent, Cart, Payment)
│   ├── jwt/            # JWT/JWS cryptographic services
│   ├── config/         # Validation configuration
│   └── utils/          # Internal utilities
├── types/              # TypeScript type definitions
│   ├── mandates.ts     # Mandate interfaces
│   ├── payment_request.ts  # W3C Payment Request types
│   └── contact_picker.ts   # Contact picker types
└── utils/              # Public utility functions
    ├── errors.ts       # Error definitions
    └── date.ts         # Date/time utilities
```

### Design Patterns

- **Factory Pattern** - Mandate creation (`IntentMandateClass.createNew()`, `CartMandateClass.createNew()`)
- **Strategy Pattern** - Validation strategies per mandate type
- **Template Method** - Base mandate class with common functionality
- **Command Pattern** - Validation and serialization operations
- **Interface Segregation** - Focused JWT service interfaces

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following SOLID principles
4. Ensure 100% test coverage: `deno task test`
5. Submit a pull request

### Code Style

- Follow TypeScript strict mode
- Use descriptive variable and function names
- Write comprehensive JSDoc comments
- Maintain SOLID design principles
- Achieve 100% test coverage for new features

---

## 🌟 Why AP2-lib?

### For Developers
- **Type Safety**: Complete TypeScript coverage prevents runtime errors
- **Standards Compliant**: Full AP2 protocol implementation
- **Universal**: Works across Deno, Node.js, and browsers
- **Well-Tested**: Comprehensive test suite with high coverage

### For Businesses
- **Security First**: Industry-standard cryptography
- **Regulatory Ready**: Built for PCI-DSS compliance
- **Scalable**: SOLID architecture supports high-volume transactions
- **Auditable**: Complete transaction trails and validation

### For the Ecosystem
- **Open Standard**: Google-backed, vendor-neutral protocol
- **Interoperable**: Works with any AP2-compliant system
- **Future-Proof**: Designed for the autonomous commerce era

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google** and the **AP2 Working Group** for the protocol specification
- **60+ Organizations** supporting the AP2 standard
- **Deno Team** for the excellent runtime and tooling
- **Web Standards Community** for Payment Request API and Web Crypto API

---

<div align="center">

**[Documentation](https://deno.land/x/ap2_lib) • [API Reference](#-api-documentation) • [Examples](#-quick-start) • [Contributing](#-contributing)**

Made with ❤️ for the autonomous commerce future

</div>