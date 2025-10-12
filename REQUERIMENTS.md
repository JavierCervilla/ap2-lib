# REQUERIMENTS.MD: Infraestructura de Pagos de Agentes AP2 (MVP)

## OBJETIVO ESTRATÉGICO

Implementar la infraestructura base para el **Agent Payments Protocol (AP2)**, el protocolo abierto y universal respaldado por Google y más de 60 organizaciones, con el fin de construir las mejores **SDKs y APIs** y **Plataformas de Gestión** para el comercio autónomo.

## STACK TECNOLÓGICO CENTRAL

*   **Lenguaje:** TypeScript (TS)
*   **Runtime:** Deno (Elegido por el tipado integrado y la reutilización de código entre *backend* y *frontend*)
*   **Base de Datos:** PostgreSQL
*   **Principios de Diseño:** **SOLID** (Se requiere el estricto cumplimiento de los principios SOLID para garantizar la mantenibilidad y escalabilidad del código).

## ALCANCE DEL MVP: Módulos y Servicios Clave

---

### 1. `ap2-lib` (Módulo de Lógica y Seguridad)

Este es el módulo central de TypeScript/Deno que encapsulará toda la lógica de seguridad y tipado fuerte del protocolo AP2.

| Requisito | Detalle e Implementación | Justificación AP2 / Seguridad |
| :--- | :--- | :--- |
| **Tipado Fuerte (Strong Typing)** | Definir **interfaces TypeScript** para los objetos centrales del protocolo AP2, incluyendo `Intent Mandate`, `Cart Mandate`, y estructuras como `contact_picker` [Conversación Histórica]. | Esencial para la **seguridad de los datos** y la coherencia con el estándar. |
| **Generación de Mandatos** | Funciones que permitan la **creación** de `Intent Mandate` y `Cart Mandate` en formato serializable (JSON). | Los Mandatos son la **prueba verificable e inalterable** de las intenciones del usuario. |
| **Firma Criptográfica (JWT/JWS)** | Funciones para generar y firmar digitalmente el objeto **`merchant_authorization`** como un **JSON Web Token (JWT)** [Conversación Histórica]. La firma debe utilizar **algoritmos asimétricos** (ej. **RS256**) con la **clave privada del *merchant***. | Implementa la **autenticidad e integridad** de los contenidos del carrito, mitigando **T1 Spoofing** y **T2 Tampering** [Conversación Histórica]. |
| **Validación de Mandatos** | Funciones que implementen la lógica de **verificación del JWT**, incluyendo: 1. **Verificación de la firma digital**. 2. Validación de la **expiración** (`exp`). 3. Comprobación del **identificador único (`jti`)** para **prevenir ataques de *replay***. 4. Recálculo y verificación del **`cart_hash`** [Conversación Histórica]. | Estas validaciones son críticas para la seguridad financiera y la trazabilidad. |
| **Compatibilidad Universal (Web-Friendly)** | El módulo debe ser construido exclusivamente utilizando **API estándar de JavaScript y Deno/Web API** (por ejemplo, Web Crypto API). Se **prohíbe estrictamente el uso de cualquier librería o API específica de Node.js**. | Garantiza la **reutilización del código** en el Servidor REST y el **Dashboard de Gestión** [Conversación Histórica], creando **SDKs universales**. |
| **Principios SOLID** | El diseño interno del módulo debe adherirse a los principios SOLID para garantizar la **mantenibilidad, extensibilidad y cohesión**. | Fundamental para la escalabilidad de la infraestructura. |
| **Cobertura de Pruebas** | El módulo debe alcanzar un nivel de cobertura de pruebas **del 100%** para toda la lógica de seguridad y criptografía [Conversación Histórica]. Se debe usar **Deno testing tools** y realizar pruebas exhaustivas de las utilidades de firma y validación. | Este alto nivel es mandatorio para garantizar la fiabilidad del protocolo AP2, que soporta pagos y requiere alineación con **Compliance y Regulación**. |

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