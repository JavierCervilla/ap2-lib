# REQUIREMENTS.MD: AP2 Agent Payments Infrastructure (MVP)

## STRATEGIC OBJECTIVE

Implement the foundational infrastructure for the **Agent Payments Protocol (AP2)**, the open and universal protocol backed by Google and 60+ organizations, in order to build the best **SDKs and APIs** and **Management Platforms** for autonomous commerce.

## CORE TECHNOLOGY STACK

*   **Language:** TypeScript (TS)
*   **Runtime:** Deno (Chosen for integrated typing and code reusability between *backend* and *frontend*)
*   **Database:** PostgreSQL
*   **Design Principles:** **SOLID** (Strict compliance with SOLID principles is required to ensure code maintainability and scalability).

## MVP SCOPE: Key Modules and Services

---

### 1. `ap2-lib` (Logic and Security Module)

This is the central TypeScript/Deno module that encapsulates all security logic and strong typing for the AP2 protocol.

| Requirement | Detail and Implementation | AP2 / Security Justification |
| :--- | :--- | :--- |
| **Strong Typing** | Define **TypeScript interfaces** for core AP2 protocol objects, including `Intent Mandate`, `Cart Mandate`, and structures like `contact_picker`. | Essential for **data security** and standard compliance. |
| **Mandate Generation** | Class-based API allowing **creation** of `Intent Mandate` and `Cart Mandate` in serializable format (JSON). Implemented as `IntentMandateClass.createNew()`, `CartMandateClass.createNew()`. | Mandates are the **verifiable and unalterable proof** of user intentions. |
| **Cryptographic Signatures (JWT/JOSE)** | Functions to generate and digitally sign the **`merchant_authorization`** object as a **JSON Web Token (JWT)**. Signatures must use **asymmetric algorithms** (e.g. **RS256**, **ES256**) with the **merchant's private key**. | Implements **authenticity and integrity** of cart contents, mitigating **T1 Spoofing** and **T2 Tampering**. |
| **Mandate Validation** | Functions implementing **JWT verification** logic, including: 1. **Digital signature verification**. 2. **Expiration** (`exp`) validation. 3. **Unique identifier (`jti`)** verification to **prevent replay attacks**. 4. Recalculation and verification of **`cart_hash`**. | These validations are critical for financial security and traceability. |
| **Universal Compatibility (Web-Friendly)** | Module must be built exclusively using **standard JavaScript and Deno/Web APIs** (e.g., Web Crypto API). **Strictly prohibits use of any Node.js-specific libraries or APIs**. | Ensures **code reusability** in REST Server and **Management Dashboard**, creating **universal SDKs**. |
| **SOLID Principles** | Internal module design must adhere to SOLID principles to ensure **maintainability, extensibility, and cohesion**. Implemented with class-based OOP architecture. | Fundamental for infrastructure scalability. |
| **Test Coverage** | Module must achieve **85%+** test coverage for all security and cryptography logic. Must use **Deno testing tools** and perform exhaustive testing of signing and validation utilities. | This high level is mandatory to ensure AP2 protocol reliability, supporting payments and requiring **Compliance and Regulatory** alignment. |

---

### 2. MCP Servidor (API Gateway para Agentes)

Este es el **Servidor REST** (*headless*) desarrollado en TypeScript/Deno que utiliza `ap2-lib` e implementa la **Lógica Interna de AP2**.

| Requisito | Detalle e Implementación Requerida | Lógica Interna del Servidor |
| :--- | :--- | :--- |
| **Base de Datos** | PostgreSQL para el almacenamiento de Mandatos firmados, el registro de auditoría (`audit.log`) y datos de usuario/comerciante. | El almacenamiento debe priorizar la **inmutabilidad** para el manejo de disputas. |
| **Autenticación** | Gestión de usuarios y autenticación segura mediante **API Keys** (Claves API). | Soporte para modelos de monetización API. |
| **Endpoint: Creación/Firma** | API para que los agentes soliciten la creación y firma de Mandatos, delegando la seguridad a `ap2-lib`. | Permite la generación de **Cart Mandates** para transacciones. |
| **Endpoint: Validación** | Endpoint dedicado (`/verify_mandate`) para verificar criptográficamente la integridad de un Mandato. | Fundamental para la mitigación del riesgo en tiempo real [Conversación Histórica]. |
| **Endpoint: Auditoría** | Endpoint (`/log_dispute`) para registrar transacciones y gestionar el registro de disputas. | Implementa la mitigación de **T6 Repudiation** (No Repudiación) y cumple con la necesidad de rastros de auditoría. |
| **Endpoint: Límite de Gasto** | Endpoint (`/check_rate_limit`) para verificar y aplicar límites de gasto configurados por el *merchant* al agente. | Mitiga las amenazas de **Denegación de Servicio (T4 DoS)**. |
| **Principios SOLID** | La arquitectura del servidor (manejo de rutas, lógica de base de datos y *business logic*) debe seguir los principios SOLID, especialmente la **Separación de Interfaces (ISP)** y la **Inversión de Dependencias (DIP)**. | Garantiza un diseño modular y la capacidad de manejar altos volúmenes y baja latencia. |

---

### 3. Documentación OpenAPI y Dashboard de Gestión

#### 3.1 Documentación OpenAPI (Para Agentes/Desarrolladores)

*   **Generación Automática:** Se requiere la generación de una especificación **OpenAPI (Swagger)** completa a partir del Servidor REST (MCP Servidor).
*   **Propósito:** Servirá como la base para que los agentes puedan generar automáticamente clientes (SDKs/Bibliotecas) y para que otros desarrolladores se integren.

#### 3.2 Dashboard de Gestión para Merchants (Plataforma de Gestión)

*   **Interfaz de Usuario:** Un *frontend* que se comunica con el MCP Servidor, utilizando TypeScript/Deno para la reutilización del código.
*   **Funcionalidades Esenciales:**
    *   **Monitoreo y Auditoría:** Interfaz para que los *merchants* puedan **monitorear agentes** y acceder al **Sistema de facturación y analytics** que muestre el registro de auditoría.
    *   **Configuración de Límites:** Capacidad de **configurar límites de gasto** por agente o por tipo de transacción.

---

### CONSIDERACIONES CRÍTICAS (No Funcionales)

1.  **Compliance y Regulación:** El diseño debe alinearse con la necesidad de **PCI-DSS**, leyes de residencia de datos y monitoreo de crímenes financieros.
2.  **Escalabilidad:** La infraestructura debe ser capaz de manejar **volúmenes altos** mientras mantiene **latencia baja** para transacciones en tiempo real.
3.  **Monetización:** La API debe diseñarse para ser monetizable, utilizando modelos **freemium** que permitan altas tasas de conversión.