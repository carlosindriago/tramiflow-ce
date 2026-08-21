# 🎯 Project Charter y Planificación WBS

## 1. Fundamentos del Proyecto

* **Objetivo Principal:** Erradicar la deuda técnica de tipado, unificar los contratos de retorno en Server Actions y centralizar la resolución de sesión y contexto multi-tenant en el monorepo de TramiFlow CE.
* **Problema a Resolver:** Presencia de 50+ usos de `any` y `as any`, 5 variantes incompatibles de interfaces de retorno en Server Actions, 56 llamadas dispersas a `getUser()`, 39 consultas manuales a `organization_members` y 145 directivas inertes de `eslint-disable`.
* **Alcance y Naturaleza:** Refactorización Arquitectónica y Saneamiento de Deuda Técnica (Packages `core`, `database`, `config-typescript`, `config-eslint` y App `web-ce`).
* **Stack Tecnológico Principal:** Next.js 15 (App Router), TypeScript (Strict Mode), Supabase (Auth, Postgres, Storage), Zod, Tailwind CSS, Turbo Monorepo.

---

## 2. Plan de Ejecución (WBS)

## 🎯 Épica 1: Arquitectura & Setup Inicial

### 🏃 Sprint 1 (Fundamentos y Entorno)

* [ ] **Configuración del Entorno y Dependencias** [Priority: High] [Type: Feature] [Depends: None] [Hours: 4h] [Branch: feat/setup-env]
* [ ] Verificar versiones de Node, pnpm y dependencias del workspace
* [ ] Configurar linters y variables de entorno locales en `.env.local`


* [ ] **Esquema de Base de Datos y Modelos Iniciales** [Priority: High] [Type: Feature] [Depends: Configuración del Entorno y Dependencias] [Hours: 6h] [Branch: feat/db-models]
* [ ] Validar migraciones existentes en `supabase/migrations/`
* [ ] Ejecutar sincronización de esquema local contra Supabase CLI



## 🎯 Épica 2: Fuente de Verdad y Contratos de Dominio

### 🏃 Sprint 2 (Tipos Base y Contratos de Server Actions)

* [ ] **Sincronización de Base de Datos y Supabase Types** [Priority: High] [Type: Refactor] [Depends: Esquema de Base de Datos y Modelos Iniciales] [Hours: 4h] [Branch: refactor/supabase-types]
* [ ] Regenerar `packages/database/src/types/database.types.ts` con Supabase CLI
* [ ] Eliminar archivo muerto `packages/database/src/types/supabase.ts` (0 bytes)
* [ ] Configurar tipos inferidos relacionales con `QueryData` de `@supabase/supabase-js`


* [ ] **Contrato Unificado ActionResult y Tipos Base** [Priority: High] [Type: Refactor] [Depends: Sincronización de Base de Datos y Supabase Types] [Hours: 4h] [Branch: refactor/action-result-contract]
* [ ] Crear `packages/core/src/types/action.ts` con discriminación estricta para `ActionResult<T>`
* [ ] Exportar `ActionResult` desde el barril central `packages/core/src/index.ts`
* [ ] Tipar soporte para `fieldErrors` con `Record<string, string[] | undefined>`


* [ ] **Esquemas Zod Isomórficos para Uploads y Metadata** [Priority: Medium] [Type: Refactor] [Depends: Contrato Unificado ActionResult y Tipos Base] [Hours: 3h] [Branch: refactor/zod-isomorphic-schemas]
* [ ] Reemplazar `z.any()` en `onboardingSchema` dentro de `packages/core/src/types/organization.ts`
* [ ] Implementar validador personalizado compatible con SSR y File API para `logo`



## 🎯 Épica 3: Autenticación Multi-Tenant y Server Actions Seguras

### 🏃 Sprint 3 (Centralización de Contexto Tenant y HOF)

* [ ] **Middleware HOF de Server Actions (createOrgAction)** [Priority: High] [Type: Refactor] [Depends: Contrato Unificado ActionResult y Tipos Base] [Hours: 6h] [Branch: refactor/safe-org-action]
* [ ] Crear helper `getAuthenticatedOrgContext` en `packages/core/src/server.ts`
* [ ] Implementar Higher-Order Function `createOrgAction` con validación Zod y encapsulamiento de tenant
* [ ] Implementar Higher-Order Function `createAdminAction` con validación de rol `super_admin`


* [ ] **Migración de Server Actions Críticas de Procedimientos y Clientes** [Priority: High] [Type: Refactor] [Depends: Middleware HOF de Server Actions (createOrgAction)] [Hours: 8h] [Branch: refactor/migrate-core-actions]
* [ ] Migrar `apps/web-ce/src/app/(dashboard)/procedures/actions.ts` al nuevo `createOrgAction`
* [ ] Migrar `apps/web-ce/src/app/(dashboard)/clients/actions.ts` y `clients/[id]/actions.ts`
* [ ] Eliminar bloques repetitivos de `supabase.auth.getUser()` y consultas a `organization_members`


* [ ] **Migración de Server Actions Secundarias** [Priority: Medium] [Type: Refactor] [Depends: Migración de Server Actions Críticas de Procedimientos y Clientes] [Hours: 6h] [Branch: refactor/migrate-secondary-actions]
* [ ] Migrar `apps/web-ce/src/actions/categories.ts` y `apps/web-ce/src/app/(dashboard)/templates/new/actions.ts`
* [ ] Migrar `apps/web-ce/src/app/(dashboard)/settings/account/actions.ts` y `statuses/actions.ts`
* [ ] Unificar respuestas de error y validaciones con la firma estándar `ActionResult<T>`



## 🎯 Épica 4: Erradicación de Any y Casts en Componentes UI

### 🏃 Sprint 4 (Tipado Estricto de Vistas y Normalización de Errores)

* [ ] **Tipado Relacional de Vistas Complejas (Kanban y Detalle de Trámite)** [Priority: High] [Type: Technical Debt] [Depends: Migración de Server Actions Críticas de Procedimientos y Clientes] [Hours: 6h] [Branch: refactor/strict-ui-typing]
* [ ] Eliminar los 5 casts `status as any` en `apps/web-ce/src/components/procedures/kanban-board.tsx`
* [ ] Reemplazar casts `procedure.client as any` en `apps/web-ce/src/app/(dashboard)/procedures/[id]/page.tsx` usando `QueryData`
* [ ] Tipar resolvers de formularios Zod en `template-form.tsx` y `template-config-panel.tsx`


* [ ] **Corrección de Helpers de Dominio y Barrel Exports en Core** [Priority: High] [Type: Technical Debt] [Depends: Sincronización de Base de Datos y Supabase Types] [Hours: 3h] [Branch: refactor/core-domain-helpers]
* [ ] Tipar `client: { identifications: Identification[] | string | null }` en `getPrimaryIdentificationNumber`
* [ ] Exportar `getPrimaryIdentificationNumber` desde `packages/core/src/index.ts`
* [ ] Resolver colisión de nombres entre `ProcedureStatus` y `ProcedureStatusConfig`


* [ ] **Normalización de Manejo de Errores (catch unknown)** [Priority: Medium] [Type: Technical Debt] [Depends: Middleware HOF de Server Actions (createOrgAction)] [Hours: 4h] [Branch: refactor/catch-unknown]
* [ ] Reemplazar `catch (error: any)` por `catch (error: unknown)` en todas las Server Actions y utilidades
* [ ] Centralizar función extractora de mensajes de error seguros (`error instanceof Error ? error.message : '...'`)



## 🎯 Épica 5: Endurecimiento de Compilación y Limpieza de Calidad

### 🏃 Sprint 5 (Blindaje del Compilador y Auditoría ESLint)

* [ ] **Depuración de Comentarios ESLint Inertes y Overrides** [Priority: High] [Type: Technical Debt] [Depends: Tipado Relacional de Vistas Complejas (Kanban y Detalle de Trámite)] [Hours: 4h] [Branch: refactor/clean-eslint-ignores]
* [ ] Remover los 145 comentarios `/* eslint-disable */` inertes sobre imports y llaves
* [ ] Eliminar overrides de `@typescript-eslint/ban-ts-comment` para los 16 archivos en `eslint.config.mjs`


* [ ] **Activación de Reglas Estrictas en tsconfig Base** [Priority: High] [Type: Technical Debt] [Depends: Depuración de Comentarios ESLint Inertes y Overrides] [Hours: 3h] [Branch: refactor/enable-strict-tsconfig]
* [ ] Activar `"noUnusedLocals": true` en `packages/config-typescript/base.json`
* [ ] Activar `"noUnusedParameters": true` en `packages/config-typescript/base.json`
* [ ] Activar `"noImplicitOverride": true` y validar compilación limpia en todo el monorepo


* [ ] **Sincronización de Documentación de Arquitectura** [Priority: Low] [Type: Technical Debt] [Depends: Activación de Reglas Estrictas en tsconfig Base] [Hours: 2h] [Branch: docs/update-architecture]
* [ ] Actualizar `docs/architecture.md` eliminando referencias a directorios inexistentes (`src/types/`)
* [ ] Documentar el patrón de Server Actions con `createOrgAction` y la jerarquía de paquetes



---

## 💡 3. Icebox (Backlog y Propuestas Futuras)

* Idea: Migración de los 88 `console.error` hacia un Logger estructurado tipado en `@carlosindriago/core/logger` con niveles (info, warn, error) y contexto serializado para observabilidad en producción.
* Idea: Implementación de Nonces criptográficos dinámicos generados en Next.js Middleware para alcanzar calificación A+ en Mozilla HTTP Observatory sin requerir `unsafe-inline`.
* Idea: Algoritmo de detección de Impossible Travel en tiempo real mediante cálculo de velocidad geográfica basado en coordenadas de red MaxMind GeoIP2.