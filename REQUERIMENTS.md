# REQUERIMENTS.MD: Infraestructura de Pagos de Agentes AP2 (MVP)

## OBJETIVO ESTRATÉGICO

Implementar la infraestructura base para el **Agent Payments Protocol (AP2)**, el protocolo abierto y universal respaldado por Google y más de 60 organizaciones, con el fin de capitalizar la oportunidad de mercado en la creación de **SDKs y APIs** y **Plataformas de Gestión** para agentes de IA.

## STACK TECNOLÓGICO CENTRAL

*   **Lenguaje:** TypeScript (TS)
*   **Runtime:** Deno (Elegido por el tipado integrado y la reutilización de código entre *backend* y *frontend*)

## ALCANCE DEL MVP: Módulos y Servicios Clave

El MVP se divide en tres componentes interdependientes que deben construirse y probarse para garantizar la seguridad y la trazabilidad, pilares de AP2.

---

### 1. `ap2-lib` (Módulo de Lógica y Seguridad)

Este es el módulo central de TypeScript/Deno que encapsulará toda la lógica de seguridad y tipado fuerte del protocolo AP2.

| Requisito | Detalle e Implementación | Justificación AP2 / Seguridad |
| :--- | :--- | :--- |
| **Tipado Fuerte (Strong Typing)** | Definir **interfaces TypeScript** para los objetos centrales del protocolo AP2, incluyendo `Intent Mandate` y `Cart Mandate`. | Es esencial para la **seguridad de los datos** y la coherencia del protocolo, replicando la estructura de los objetos definidos en `src/ap2/types` del repositorio oficial. |
| **Generación de Mandatos** | Funciones que permitan la **creación** de `Intent Mandate` y `Cart Mandate` en formato serializable (JSON). | Los Mandatos son la **prueba verificable e inalterable** de las intenciones del usuario. |
| **Firma Criptográfica (ECDSA)** | Funciones para aplicar **firmas digitales criptográficas** a los Mandatos, tanto por parte del usuario como del *merchant* (comerciante). | Debe utilizar el algoritmo **ECDSA**, como se requiere en las implementaciones seguras de demostración del protocolo. |
| **Validación de Mandatos** | Funciones que realicen la **verificación de firmas** y la validación de *checksums* en las comunicaciones. | Mitiga las amenazas críticas **T1 Spoofing** (Suplantación) y **T2 Tampering** (Manipulación). |
| **Pruebas Unitarias** | El módulo debe estar **100% testeado** para garantizar la fiabilidad de las funciones de seguridad y criptografía. | La confianza en la infraestructura de pagos depende totalmente de la precisión de este módulo. |

---

### 2. MCP Servidor (API Gateway para Agentes)

Este es el **Servidor REST** desarrollado en TypeScript/Deno, que utiliza `ap2-lib` y actúa como la **puerta de entrada** *headless* para los agentes de IA que desean realizar transacciones.

| Requisito | Detalle e Implementación Requerida | Lógica Interna del Servidor |
| :--- | :--- | :--- |
| **Base de Datos** | **PostgreSQL** para el almacenamiento de Mandatos firmados, registros de auditoría (`audit.log`) y datos de usuario/comerciante. | Requiere un esquema de base de datos que priorice la **trazabilidad** y la **inmutabilidad** de los registros de Mandatos. |
| **Autenticación** | Gestión de usuarios y autenticación segura mediante **API Keys** (Claves API) para los desarrolladores de agentes. | Soporta el modelo de monetización de APIs. |
| **Endpoint: Creación/Firma** | API para que los agentes soliciten la creación y firma de un Mandato, delegando la lógica de seguridad a `ap2-lib`. | Permite la generación de **Cart Mandates** para transacciones. |
| **Endpoint: Validación** | Endpoint dedicado (`/verify_mandate`) para que cualquier parte verifique criptográficamente la integridad de un Mandato. | Fundamental para la mitigación del riesgo en tiempo real. |
| **Endpoint: Auditoría** | Endpoint (`/log_dispute`) para registrar transacciones y gestionar el registro de disputas. | Implementa la mitigación de **T6 Repudiation** (No Repudiación). |
| **Endpoint: Límite de Gasto** | Endpoint (`/check_rate_limit`) para verificar y aplicar límites de gasto configurados por el *merchant* al agente antes de autorizar el pago. | Mitiga el riesgo de **T4 DoS** (Denegación de Servicio) y transacciones excesivas. |

---

### 3. Documentación OpenAPI y Dashboard de Gestión

Estos componentes son la salida directa del MVP, enfocados en la adopción por parte de desarrolladores (OpenAPI) y la interfaz humana (Dashboard).

#### 3.1 Documentación OpenAPI (Para Agentes/Desarrolladores)

*   **Generación Automática:** Se requiere la generación de una especificación **OpenAPI (Swagger)** completa a partir del Servidor REST (MCP Servidor).
*   **Propósito:** Esta documentación será la base para que los agentes puedan generar automáticamente clientes (SDKs/Bibliotecas) y para que otros desarrolladores implementen la interacción con nuestro servicio.
*   **Monetización:** La calidad de las APIs y SDKs es la principal oportunidad para monetizar el servicio, típicamente mediante modelos **freemium**.

#### 3.2 Dashboard de Gestión para Merchants (MCP Humano)

*   **Interfaz de Usuario:** Un *frontend* construido con TypeScript/Deno (o similar) que se comunica con el MCP Servidor.
*   **Funcionalidades Esenciales (Plataforma de Gestión):**
    *   **Monitoreo de Agentes:** Visualización en tiempo real del tráfico de Mandatos y transacciones.
    *   **Configuración de Límites:** Interfaz para que los *merchants* puedan **configurar límites de gasto** por agente o por tipo de transacción.
    *   **Auditoría Completa:** Acceso al **Sistema de facturación y analytics** que muestre el `audit.log`, permitiendo la revisión de los Mandatos firmados (prueba inalterable) para la gestión de disputas.

---

### CONSIDERACIONES CRÍTICAS (No Funcionales)

*   **Compliance y Regulación:** Aunque AP2 mejora la trazabilidad, la infraestructura debe estar diseñada para alinearse con regulaciones financieras como **PCI-DSS** y el monitoreo de crímenes financieros para asegurar la adopción en industrias reguladas.
*   **Escalabilidad:** Dado que el futuro del comercio autónomo podría valer trillones, el diseño de la infraestructura debe ser escalable para manejar **volúmenes altos** y mantener una **latencia baja** para transacciones en tiempo real.
*   **Reutilización del Código:** Maximizar la reutilización del código Deno/TypeScript entre `ap2-lib`, el MCP Servidor y el Dashboard.