# 🏗️ Arquitectura del Sistema

> Este documento describe la arquitectura técnica de TramiFlow CE, las decisiones de diseño y los patrones utilizados.

---

## 1. Visión General de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                     │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ React 19  │  │ TanStack     │  │ React Hook Form    │   │
│  │ Components│  │ Query v5     │  │ + Zod Validation   │   │
│  └─────┬─────┘  └──────┬───────┘  └────────┬───────────┘   │
│        │               │                    │               │
└────────┼───────────────┼────────────────────┼───────────────┘
         │               │                    │
    ┌────▼───────────────▼────────────────────▼────┐
    │           Next.js 16 (App Router)             │
    │  ┌─────────────────────────────────────────┐  │
    │  │  Middleware (Auth Guard + Session Mgmt)  │  │
    │  └─────────────────────────────────────────┘  │
    │  ┌──────────────┐  ┌────────────────────────┐ │
    │  │ Server       │  │ Route Handlers         │ │
    │  │ Components   │  │ (API Routes)           │ │
    │  │ (RSC)        │  │                        │ │
    │  └──────┬───────┘  └───────────┬────────────┘ │
    │         │                      │              │
    │  ┌──────▼──────────────────────▼────────────┐ │
    │  │         Server Actions                    │ │
    │  │  (auth.ts, categories.ts, growth.ts)      │ │
    │  └─────────────────┬────────────────────────┘ │
    └────────────────────┼──────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Supabase SSR       │
              │  (@supabase/ssr)    │
              │  ┌────────────────┐ │
              │  │ Server Client  │ │
              │  │ Browser Client │ │
              │  └────────────────┘ │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   Supabase Cloud    │
              │  ┌────────────────┐ │
              │  │ PostgreSQL     │ │
              │  │ + RLS Policies │ │
              │  │ + Auth         │ │
              │  │ + Realtime     │ │
              │  └────────────────┘ │
              └─────────────────────┘
```

---

## 2. Estructura de Carpetas (Detallada)

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root Layout (Providers, ThemeProvider, fonts)
│   ├── globals.css                   # CSS global + variables de tema Shadcn
│   │
│   ├── (dashboard)/                  # 🔒 Layout group protegido
│   │   ├── layout.tsx                # SidebarProvider + AppSidebar + Header + ErrorBoundary
│   │   ├── page.tsx                  # Dashboard: stats, deadlines, actividad reciente
│   │   ├── clients/                  # Módulo de clientes
│   │   │   ├── page.tsx              # Lista + CRUD de clientes
│   │   │   └── actions.ts            # Server Actions de clientes
│   │   └── templates/                # Módulo de plantillas
│   │       ├── page.tsx              # Lista de plantillas (tabla + filtros)
│   │       ├── new/                  # Crear nueva plantilla
│   │       │   ├── page.tsx          # Página de creación
│   │       │   └── actions.ts        # Server Action: createTemplate
│   │       └── [id]/                 # Plantilla individual
│   │           ├── page.tsx          # Vista detalle (Manifiesto)
│   │           └── edit/
│   │               └── page.tsx      # Edición de plantilla
│   │
│   ├── api/                          # Route Handlers
│   │   ├── auth/                     # Callback de OAuth
│   │   └── categories/               # CRUD de categorías
│   │
│   ├── auth/                         # Auth callback handler
│   ├── login/                        # Página de login (pública)
│   └── shared/                       # Páginas públicas (lead magnets)
│
├── actions/                          # Server Actions centralizados
│   ├── auth.ts                       # logout, session management
│   ├── categories.ts                 # CRUD categorías de plantillas
│   └── growth.ts                     # Analytics y tracking de leads
│
├── components/
│   ├── ui/                           # 28 componentes Shadcn/UI base
│   │   ├── button.tsx, input.tsx, dialog.tsx, etc.
│   │   ├── sidebar.tsx               # Sidebar collapsible
│   │   ├── table.tsx                 # TanStack Table wrapper
│   │   └── sonner.tsx                # Toast notifications
│   │
│   ├── templates/                    # Componentes del Template Builder
│   │   ├── templates-view.tsx        # Vista principal con tabla + stats
│   │   ├── templates-table.tsx       # Tabla de plantillas con TanStack Table
│   │   ├── template-form.tsx         # Formulario de crear/editar (React Hook Form)
│   │   ├── template-config-panel.tsx # Panel lateral de configuración (22KB, el más complejo)
│   │   ├── template-step-card.tsx    # Card draggable para cada paso (@dnd-kit)
│   │   ├── template-timeline.tsx     # Vista timeline del proceso
│   │   ├── template-analytics.tsx    # Dashboard de métricas (Recharts)
│   │   └── share-modal.tsx           # Modal para compartir plantilla pública
│   │
│   ├── layout/
│   │   ├── sidebar.tsx               # AppSidebar con navegación
│   │   └── header.tsx                # Header con breadcrumbs + user menu
│   │
│   ├── common/                       # Componentes compartidos
│   ├── providers.tsx                 # QueryClientProvider + ThemeProvider
│   └── error-boundary.tsx            # Error boundary con UI de fallback
│
├── hooks/                            # Custom hooks
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 # createClient() para Server Components/Actions
│   │   └── client.ts                 # createClient() para Client Components ('use client')
│   ├── constants.ts                  # Categorías, configuración global
│   ├── rate-limit.ts                 # Rate limiting para API routes
│   ├── toast.ts                      # Helpers de notificaciones
│   └── utils.ts                      # cn() y utilidades generales
│
├── types/
│   ├── database.types.ts             # Tipos auto-generados de Supabase (fuente de verdad)
│   ├── template.ts                   # Schemas Zod + tipos de plantillas
│   ├── client.ts                     # Schemas Zod + tipos de clientes
│   ├── analytics.ts                  # Tipos de analytics (ChartData, etc.)
│   └── lead.ts                       # Schema Zod de captura de leads
│
└── middleware.ts                     # Auth guard + session refresh
```

---

## 3. Patrones de Diseño

### 3.1 Multi-Tenancy

El modelo multi-tenant utiliza **aislamiento por filas** (Row-Level Security):

```
┌─────────────────────────────────────────┐
│              auth.users                  │
│  (Supabase Auth - fuera de nuestro      │
│   control directo)                       │
└────────────────┬────────────────────────┘
                 │ 1:1
       ┌─────────▼─────────┐
       │     profiles       │
       │  (id = auth.uid()) │
       │  organization_id ──┼──┐
       │  role: owner|admin │  │
       │        |member     │  │
       └────────────────────┘  │
                               │ N:1
       ┌───────────────────────▼──┐
       │     organizations         │
       │  (tenant principal)       │
       │  Aísla TODOS los datos    │
       └───────────┬──────────────┘
                   │ 1:N
    ┌──────────────┼──────────────────┐
    │              │                  │
    ▼              ▼                  ▼
 clients    procedure_templates   procedures
 documents  template_views        template_leads
```

**Regla fundamental:** Toda tabla de datos tiene `organization_id` y políticas RLS que verifican que el usuario pertenece a esa organización.

### 3.2 Data Flow (Server Actions)

```
Client Component           Server Action              Supabase
     │                          │                        │
     │  formData + Zod schema   │                        │
     │ ────────────────────────▶│                        │
     │                          │  1. getUser() ✓        │
     │                          │  2. Zod.parse() ✓      │
     │                          │  3. Query con RLS      │
     │                          │ ──────────────────────▶│
     │                          │                        │
     │                          │◀────── result ─────────│
     │                          │                        │
     │  { success, data/error } │                        │
     │◀─────────────────────────│                        │
     │                          │                        │
     │  revalidatePath()        │                        │
     │  (auto re-render)        │                        │
```

### 3.3 Auth Flow

```
                    Middleware (EVERY request)
                            │
                    ┌───────▼───────┐
                    │ createServer  │
                    │ Client (SSR)  │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
              ┌─────│ getUser()     │─────┐
              │     │ (validates    │     │
              │     │  JWT token)   │     │
          user ✓    └───────────────┘  user ✗
              │                           │
       ┌──────▼──────┐           ┌────────▼────────┐
       │ Is /login?  │           │ Is public route? │
       │  → redirect │           │ /login, /auth,   │
       │    to /     │           │ /shared           │
       └─────────────┘           │  ✓ → pass through│
                                 │  ✗ → redirect    │
                                 │      to /login   │
                                 └─────────────────┘
```

### 3.4 Supabase Client Strategy

| Contexto | Client | Archivo |
|----------|--------|---------|
| Server Components / Server Actions | `createServerClient()` con cookies | `src/lib/supabase/server.ts` |
| Client Components | `createBrowserClient()` | `src/lib/supabase/client.ts` |
| Middleware | `createServerClient()` con request cookies | `src/middleware.ts` |

**Importante:** Nunca importar el cliente de server en un componente `'use client'` ni viceversa.

---

## 4. Decisiones Arquitectónicas (ADRs)

### ADR-001: Steps como JSONB en procedure_templates

**Decisión:** Los pasos de una plantilla se almacenan como array JSONB dentro de `procedure_templates.steps` en lugar de una tabla separada.

**Razón:**
- Los steps siempre se leen/escriben junto con la plantilla (no necesitan queries independientes).
- Simplifica el drag & drop (reordenar es un update de un solo campo).
- Evita N+1 queries al cargar la vista de detalle.
- El builder visual opera sobre el array completo en memoria.

**Trade-off:** No se puede hacer `JOIN` ni queries sobre steps individuales. Si fuera necesario en el futuro (ej: buscar "todas las plantillas que tengan un paso de tipo pago"), se evaluaría migrar a tabla separada con GIN index.

### ADR-002: No usamos Supabase Storage

**Decisión:** Los documentos finales de clientes se gestionan a través de la API de Google Drive del cliente, no con Supabase Storage.

**Razón:** Los gestores migratorios ya tienen flujos establecidos en Google Drive. La tabla `documents` solo almacena metadatos y `google_file_id` / `webview_link` como referencia.

### ADR-003: Server Actions sobre API Routes

**Decisión:** Usamos Server Actions como mecanismo principal de mutación de datos, reservando Route Handlers solo para webhooks y APIs que necesitan URL estable.

**Razón:** Server Actions integran mejor con React Server Components, permiten `revalidatePath()` automático, y tienen tipado end-to-end con TypeScript.

### ADR-004: TanStack Query para cache en cliente

**Decisión:** Usamos `@tanstack/react-query` para estado del servidor en componentes cliente.

**Razón:** Deduplicación automática de requests, cache con stale-while-revalidate, retry automático, y manejo de loading/error states integrado.

---

## 5. Colores Semánticos

El sistema de diseño usa colores con significado consistente en toda la UI:

| Color | Código | Significado | Uso |
|-------|--------|-------------|-----|
| 🔴 Rojo | `red-400/500` | Vencimiento / Crítico | Alertas, deadlines expirados, acciones destructivas |
| 🔵 Azul | `blue-400/500` | Trámite Activo | Estado "en proceso", links, acciones primarias |
| 🟢 Verde | `green-400/500` | Nuevo / WhatsApp | Nuevos clientes, éxito, integración WhatsApp |
| 🟣 Púrpura | `purple-400/500` | Productividad | Métricas positivas, badges de éxito |
| 🟡 Amarillo | `yellow-400/500` | Pendiente | Estados que requieren atención pero no son críticos |
