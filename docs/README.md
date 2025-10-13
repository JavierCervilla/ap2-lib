# 📚 AP2 Library - API Documentation

Welcome to the complete API documentation for **AP2 Library** - the TypeScript/Deno implementation of the Agent Payments Protocol.

## 🚀 Quick Navigation

### 📖 **[Main Module Documentation](./mod.html)**
Complete API reference for all exported classes, interfaces, and functions.

### 🔑 Key Components

- **[IntentMandateClass](./mod.html#IntentMandateClass)** - User purchase intent management
- **[CartMandateClass](./mod.html#CartMandateClass)** - Shopping cart mandate with JWT signing
- **[PaymentMandateClass](./mod.html#PaymentMandateClass)** - Payment authorization and processing
- **[JWT Services](./mod.html#JOSEJWTService)** - Cryptographic signature management
- **[Validation Framework](./mod.html#ValidationResult)** - Multi-layer mandate validation

## 🛠️ Developer Resources

### 🏗️ Core Architecture
- **[Base Classes](./mod.html#BaseMandate)** - Foundation classes and interfaces
- **[Type Definitions](./mod.html#MandateType)** - Complete TypeScript type system
- **[Error Handling](./mod.html#MandateValidationError)** - Comprehensive error classes

### 🔐 Security Features
- **[JWT/JOSE Implementation](./mod.html#IJWTService)** - Industry-standard cryptography
- **[Validation Strategies](./mod.html#ValidationResult)** - Multi-layer security validation
- **[Replay Attack Prevention](./mod.html#JTIValidator)** - Advanced security measures

## 📋 Usage Examples

### Basic Intent Mandate
```typescript
import { IntentMandateClass } from "@xja77/ap2-lib";

const intent = await IntentMandateClass.createNew({
  natural_language_description: "Wireless headphones under $200",
  intent_expiry: "2024-12-31T23:59:59Z",
  merchants: ["amazon.com", "bestbuy.com"]
});
```

### Cart Mandate with JWT Signing
```typescript
import { CartMandateClass } from "@xja77/ap2-lib";

const cart = await CartMandateClass.createNew({ contents: cartData });
await cart.sign(privateKey, keyConfig, { merchantId: "merchant-123" });
const isValid = await cart.verifySignature();
```

## 🔗 Additional Resources

- **[GitHub Repository](https://github.com/xja77/ap2-lib)** - Source code and issues
- **[JSR Package](https://jsr.io/@xja77/ap2-lib)** - Official package registry
- **[Deno.land](https://deno.land/x/ap2_lib)** - Deno package listing
- **[Main README](../README.md)** - Getting started guide

## 📊 Project Status

- **Test Coverage**: 91.0% lines / 89.9% branches
- **Total Tests**: 260+ passing
- **TypeScript Files**: 54+ modules
- **Architecture**: SOLID principles applied

---

> **Note**: This documentation is automatically generated from the source code using `deno doc`.
> It's updated with every commit to ensure accuracy and completeness.

*Last updated: October 13, 2025*