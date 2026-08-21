# 🏗️ Arquitectura del Sistema - TramiFlow CE

> Este documento describe la arquitectura técnica consolidada de TramiFlow CE (Community Edition), su topología monorepo, contratos de seguridad, sistema de diseño y patrones de desarrollo.

---

## 1. Visión General de la Topología Monorepo (Turborepo)

```
tramiflow-ce/
├── apps/
│   └── web-ce/                           # Next.js 15+ (App Router) Main Application
│       ├── src/app/                      # Server/Client Pages & Layout Groups
│       │   ├── (dashboard)/              # 🔒 Vistas protegidas (Procedures, Clients, Templates, Settings, Tools)
│       │   ├── (legal)/                  # Páginas públicas legales (Privacy, Terms)
│       │   ├── api/                      # Route Handlers (Auth callback, documents stream, cron)
│       │   ├── login/                    # Autenticación segura con MFA y Single Session
│       │   └── templates/share/[token]/  # Plantillas compartidas públicamente
│       ├── src/lib/action-helpers.ts     # Higher-Order Functions: createOrgAction, createAdminAction
│       └── src/middleware.ts             # Zero-Latency Edge Middleware (Auth, Single Session, Country)
│
├── packages/
│   ├── core/                             # @carlosindriago/core: Tipos de dominio, ActionResult<T>, utilidades de negocio
│   ├── database/                         # @carlosindriago/database: Database types Supabase generados, Server/Browser Clients
│   ├── ui/                               # @carlosindriago/ui: Design System Shadcn/UI, Tokens Navy/Emerald, Card Contrast
│   ├── pdf-kit/                          # @carlosindriago/pdf-kit: Utilidades de manipulación PDF (merge, compresión, OCR)
│   ├── config-typescript/                # @carlosindriago/config-typescript: TSConfig base estricto compartido
│   └── config-eslint/                    # @carlosindriago/config-eslint: Reglas y configuración ESLint
│
├── docs/                                 # Documentación técnica, diseño y registros ADR
│   ├── adr/                              # Architecture Decision Records
│   │   ├── ADR-001-storage-rls-ephemeral-signed-urls.md
│   │   └── ADR-002-edge-single-session-jwt-claims.md
│   └── ARCHITECTURE.md
│
└── supabase/
    └── migrations/                       # Migraciones SQL y políticas RLS versionadas
```

---

## 2. Contrato de Mutación: `ActionResult<T>` y Higher-Order Functions

Toda Server Action en TramiFlow CE utiliza el tipo discriminado estricto `ActionResult<T>` y se ejecuta mediante envoltorios de seguridad (HOF):

### 2.1 Tipo Discriminado `ActionResult<T>`
```typescript
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; code?: string }
```

### 2.2 Higher-Order Functions de Multi-Tenancy
- **`createOrgAction`**: Inyecta `{ user, orgId, supabase }` resolviendo la organización activa y validando membresía en `organization_members`. Si la sesión o membresía fallan, retorna un error de contrato sin lanzar excepciones no controladas.
- **`createAdminAction`**: Valida que el usuario posea privilegios de `super_admin` / `OWNER` antes de ejecutar la acción.

---

## 3. Seguridad Defensiva en Edge & Bóveda Documental

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegador / Cliente                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Edge Middleware                        │
│  - Zero-Latency Check: user.session_uuid === tf_session_id  │
│  - Edge Geo-Detection: x-vercel-ip-country                  │
│  - Security Headers: CSP (frame-src 'self' blob:), HSTS     │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    Server Actions Seguras    │ │  Supabase Storage (Private) │
│ - createOrgAction validation │ │ - Bucket 'client-docs' RLS  │
│ - Ephemeral Signed URLs (60s)│ │ - Direct CDN Download (60s) │
└──────────────────────────────┘ └─────────────────────────────┘
```

1. **Zero-Latency Single Session**: Inyección de `session_uuid` en `user_metadata` y cookie HTTP-only segura. El middleware invalida sesiones concurrentes al instante sin consultar PostgreSQL.
2. **URLs Firmadas Efímeras (60s TTL)**: Erradicación de URLs de 1 año. Las URLs se generan bajo demanda con TTL de 60 segundos directo al CDN.
3. **CSP Estricto**: Prevención de Clickjacking (`X-Frame-Options: SAMEORIGIN`), Content-Type sniffing (`nosniff`) y directivas específicas para el visor de PDFs (`frame-src 'self' blob:`).

---

## 4. Sistema de Diseño Institucional: Navy & Esmeralda

El sistema de diseño de TramiFlow CE utiliza el espacio de color semántico **OKLCH** asegurando cumplimiento **WCAG AA** tanto en modo claro como en modo oscuro:

| Token Semántico | Light Mode | Dark Mode | Propósito |
|---|---|---|---|
| `--background` | `oklch(0.99 0.005 250)` | `oklch(0.13 0.02 250)` | Base estructural Deep Navy |
| `--card` | `oklch(1 0 0)` | `oklch(0.16 0.025 250)` | Superficies legibles y tarjetas |
| `--primary` | `oklch(0.55 0.16 160)` | `oklch(0.65 0.18 160)` | Acentos y acciones primarias Esmeralda |
| `--ring` | `oklch(0.55 0.16 160)` | `oklch(0.65 0.18 160)` | Anillos de foco y accesibilidad |

- **Tipografía de Métricas**: `font-mono tabular-nums tracking-tight` en todas las KPI Cards.
- **Iconografía**: Lucide React semántica estandarizada.

---

## 5. Decisiones Arquitectónicas Registradas (ADRs)

- [ADR-001: Storage RLS & Ephemeral Signed URLs (60s)](file:///home/carlos/Proyectos/tramiflow/tramiflow-ce/docs/adr/ADR-001-storage-rls-ephemeral-signed-urls.md)
- [ADR-002: Edge Single Session vía Metadata y Cookies](file:///home/carlos/Proyectos/tramiflow/tramiflow-ce/docs/adr/ADR-002-edge-single-session-jwt-claims.md)
