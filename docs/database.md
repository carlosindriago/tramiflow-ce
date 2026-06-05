# 🗄️ Base de Datos — Esquema y Políticas

> Supabase PostgreSQL · Multi-tenant con Row-Level Security

---

## 1. Diagrama Entidad-Relación

```
┌──────────────────┐       ┌──────────────────────┐
│  auth.users      │       │    organizations      │
│  (Supabase)      │       │                       │
│                  │       │  id (UUID PK)          │
│  id ─────────┐   │       │  name                  │
│              │   │       │  slug (UNIQUE)          │
└──────────────┘   │       │  logo_url               │
                   │       │  created_at              │
                   │       │  updated_at              │
                   │       └──────────┬───────────────┘
                   │                  │
              1:1  │           N:1    │
          ┌────────▼──────┐           │
          │   profiles     │          │
          │                │          │
          │  id (PK → auth)│          │
          │  organization_id ─────────┘
          │  full_name     │
          │  avatar_url    │
          │  role          │
          └───────┬────────┘
                  │ 1:N (created_by)
                  │
┌─────────────────▼──────────────────────────────────────┐
│                 procedure_templates                     │
│                                                         │
│  id (UUID PK)                                           │
│  organization_id → organizations(id) CASCADE            │
│  created_by → profiles(id)                              │
│  name, description, category                            │
│  fees_professional, fees_official, currency              │
│  duration_work, duration_resolution                     │
│  payment_terms, requires_renewal, renewal_frequency     │
│  steps (JSONB[])                                        │
│  is_active, is_publicly_visible, share_url (UNIQUE)     │
└──────┬───────────────────────┬──────────────────────────┘
       │ 1:N                   │ 1:N
       │                       │
┌──────▼──────────┐     ┌──────▼──────────┐
│ template_views   │     │ template_leads   │
│                  │     │                  │
│ id (BIGINT PK)   │     │ id (UUID PK)     │
│ template_id (FK) │     │ template_id (FK) │
│ device_type      │     │ name, phone      │
│ created_at       │     │ email            │
└──────────────────┘     │ created_at       │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    categories    │     │     clients      │
│                  │     │                  │
│ id (UUID PK)     │     │ id (UUID PK)     │
│ organization_id  │     │ organization_id  │
│ name             │     │ full_name        │
│ slug (UNIQUE*)   │     │ document_number  │
│ description      │     │ nationality      │
│ color            │     │ phone, email     │
│ icon             │     │ notes            │
│ created_at       │     │ google_drive_    │
│ updated_at       │     │   folder_id      │
└──────────────────┘     └──────┬───────────┘
                                │ 1:N
                                │
┌──────────────────┐     ┌──────▼──────────┐
│     clients      │     │    procedures     │
│                  │     │                   │
│ id (UUID PK)     │     │ id (UUID PK)      │
│ organization_id  │     │ organization_id   │
│ full_name        │     │ client_id (FK)    │
│ document_number  │     │ template_id (FK)  │
│ nationality      │     │ current_step      │
│ phone, email     │     │ status            │
│ notes            │     │ start_date        │
│ google_drive_    │     │ due_date          │
│   folder_id      │     │ google_drive_link │
└──────┬───────────┘     └──────────────────┘
       │ 1:N
       │
┌──────▼──────────┐
│   documents      │
│                  │
│ id (UUID PK)     │
│ organization_id  │
│ client_id (FK)   │
│ procedure_id(FK) │
│ name             │
│ google_file_id   │
│ mime_type         │
│ webview_link     │
└──────────────────┘
```

---

## 2. Tablas Detalladas

### 2.1 `organizations`
Tenant principal. Toda la data de usuario se aísla por organización.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | TEXT | NO | - | Nombre de la firma |
| `slug` | TEXT | SÍ | - | UNIQUE, solo `[a-z0-9-]` |
| `logo_url` | TEXT | SÍ | - | URL del logo |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` | Auto-trigger |

**Índices:** `slug`, `created_at DESC`

### 2.2 `profiles`
Perfil de usuario vinculado 1:1 a `auth.users`. Se crea automáticamente al registrarse.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | - | PK → `auth.users(id)` CASCADE |
| `organization_id` | UUID | SÍ | - | FK → `organizations(id)` SET NULL |
| `full_name` | TEXT | SÍ | - | - |
| `avatar_url` | TEXT | SÍ | - | - |
| `role` | TEXT | SÍ | `'member'` | CHECK: `owner\|admin\|member` |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` | Auto-trigger |

**Índices:** `organization_id`, `role`

### 2.3 `procedure_templates`
Plantillas de trámites migratorios — el core del producto.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK CASCADE |
| `created_by` | UUID | NO | - | FK → `profiles(id)` |
| `name` | TEXT | NO | - | Nombre del trámite |
| `description` | TEXT | SÍ | - | - |
| `category` | TEXT | SÍ | - | Categoría del trámite |
| `fees_professional` | DECIMAL | SÍ | - | Honorarios profesionales |
| `fees_official` | DECIMAL | SÍ | - | Costos oficiales |
| `currency` | TEXT | SÍ | - | Moneda (PEN, USD, etc.) |
| `duration_work` | INTEGER | SÍ | - | Días de trabajo |
| `duration_resolution` | INTEGER | SÍ | - | Días de resolución |
| `payment_terms` | TEXT | SÍ | - | `upfront\|split_50_50\|on_completion` |
| `requires_renewal` | BOOLEAN | SÍ | - | ¿Necesita renovación? |
| `renewal_frequency` | INTEGER | SÍ | - | Frecuencia en meses |
| `steps` | JSONB | SÍ | `'[]'` | Array de pasos (ver §2.3.1) |
| `is_active` | BOOLEAN | SÍ | `true` | - |
| `is_publicly_visible` | BOOLEAN | SÍ | `true` | Para lead magnets |
| `share_url` | TEXT | SÍ | - | UNIQUE, solo `[a-z0-9-]` |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` | Auto-trigger |

**Índices:** `organization_id`, `created_by`, `category`, `share_url` (partial), `created_at DESC`, partial index para plantillas públicas.

#### 2.3.1 Estructura de `steps` (JSONB)

```json
[
  {
    "stepId": "uuid-string",
    "title": "Recopilar documentos",
    "type": "document | payment | appointment | notification",
    "description": "Descripción opcional del paso",
    "isRequired": true,
    "estimatedDays": 5
  }
]
```

Validado por `stepSchema` (Zod) en `src/types/template.ts`.

### 2.4 `categories`
Sistema de categorías tipo WordPress para organizar plantillas. Multi-tenant con slugs únicos por organización.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK CASCADE |
| `name` | TEXT | NO | - | Nombre de la categoría |
| `slug` | TEXT | NO | - | UNIQUE por organización: `(organization_id, slug)` |
| `description` | TEXT | SÍ | - | - |
| `color` | TEXT | SÍ | `'default'` | `default\|blue\|green\|amber\|red\|purple` |
| `icon` | TEXT | SÍ | - | Nombre de icono Lucide |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` | Auto-trigger |

**Índices:** `organization_id`, `slug`, `(organization_id, slug) UNIQUE`

**Triggers:**
- `on_organization_created`: Auto-crea categoría "General" cuando se crea una organización

### 2.5 `template_views`
Tracking anónimo de visualizaciones de plantillas públicas.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | BIGINT | NO | IDENTITY | PK |
| `template_id` | UUID | NO | - | FK CASCADE |
| `device_type` | TEXT | SÍ | - | mobile/desktop/tablet |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | - |

### 2.6 `template_leads`
Leads capturados desde landing pages públicas de plantillas.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `template_id` | UUID | NO | - | FK CASCADE |
| `name` | TEXT | NO | - | - |
| `phone` | TEXT | NO | - | Formato: +549XXXXXXXXXX |
| `email` | TEXT | SÍ | - | - |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | - |

### 2.7 `clients`
Clientes del gestor migratorio.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK |
| `full_name` | TEXT | NO | - | - |
| `document_number` | TEXT | SÍ | - | DNI/Pasaporte |
| `nationality` | TEXT | SÍ | - | - |
| `phone` | TEXT | SÍ | - | - |
| `email` | TEXT | SÍ | - | - |
| `notes` | TEXT | SÍ | - | Notas internas |
| `google_drive_folder_id` | TEXT | SÍ | - | Carpeta GDrive del cliente |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |

### 2.8 `procedure_statuses`
Estados dinámicos configurables por la organización para el tablero Kanban.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK CASCADE |
| `name` | TEXT | NO | - | Nombre del estado |
| `color` | TEXT | NO | `'#000000'` | Color Hex |
| `is_final` | BOOLEAN | NO | `false` | Aprobado/Rechazado |
| `order_index` | INTEGER | NO | `0` | Orden visual |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | - |

### 2.9 `procedures`
Instancias de trámites activos asignados a clientes.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK |
| `client_id` | UUID | NO | - | FK → `clients(id)` |
| `template_id` | UUID | SÍ | - | FK → `procedure_templates(id)` |
| `status_id` | UUID | SÍ | - | FK → `procedure_statuses(id)` |
| `status` | TEXT | SÍ | - | **Deprecado** (Legacy) |
| `current_step` | INTEGER | SÍ | - | Índice del paso actual |
| `start_date` | TEXT | SÍ | - | - |
| `due_date` | TEXT | SÍ | - | Fecha límite |
| `google_drive_link` | TEXT | SÍ | - | Link a GDrive del trámite |

### 2.10 `documents`

Metadatos de documentos almacenados en Google Drive.

| Columna | Tipo | Nullable | Default | Notas |
|---------|------|----------|---------|-------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `organization_id` | UUID | NO | - | FK |
| `client_id` | UUID | SÍ | - | FK → `clients(id)` |
| `procedure_id` | UUID | SÍ | - | FK → `procedures(id)` |
| `name` | TEXT | NO | - | Nombre del archivo |
| `google_file_id` | TEXT | NO | - | ID en Google Drive |
| `mime_type` | TEXT | SÍ | - | - |
| `webview_link` | TEXT | SÍ | - | URL de visualización |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` | - |

---

## 3. Row-Level Security (RLS)

**Todas las tablas tienen RLS habilitado.** Las políticas siguen un patrón consistente:

### Patrón General

```sql
-- SELECT: usuario pertenece a la organización
CREATE POLICY "Users can view own org data"
ON public.table_name FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
```

### Políticas por Tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE | Public Access |
|-------|--------|--------|--------|--------|---------------|
| `organizations` | Solo su org | - | - | - | ✗ |
| `profiles` | Su perfil + misma org | Auto (trigger) | Solo propio | - | ✗ |
| `categories` | Su org | Su org | Su org | Su org | ✗ |
| `procedure_templates` | Su org | Su org + `created_by = uid` | Su org | Su org | ✓ (si `is_publicly_visible`) |
| `template_views` | Org del template | ✓ (anon + auth) | - | - | ✓ Insert |
| `template_leads` | Org del template | ✓ (anon + auth) | - | - | ✓ Insert |
| `procedure_statuses` | Su org | Su org | Su org | Su org | ✗ |


> ⚠️ Todas las tablas tienen una política `Service Role bypass` para tareas de sistema.

---

## 4. Funciones de Base de Datos

### `update_updated_at_column()`
Trigger function que actualiza `updated_at` en cada UPDATE. Aplicado a: `organizations`, `profiles`, `procedure_templates`, `categories`.

### `create_organization_with_owner(org_name, user_id)`
- **SECURITY DEFINER** — ejecuta con permisos del creador de la función.
- Crea una organización y asigna al usuario como `owner`.
- Concedido a `authenticated`.

### `create_default_category()`
- **SECURITY DEFINER** — ejecuta con permisos del creador de la función.
- Trigger function que crea automáticamente la categoría "General" para nuevas organizaciones.
- Se ejecuta vía trigger `on_organization_created` después de INSERT en `organizations`.

---

## 5. Historia de Migraciones

| # | Archivo | Descripción |
|---|---------|------------|
| 1 | `20260210_core_tables.sql` | Tablas core: organizations, profiles, procedure_templates + RLS + triggers |
| 2 | `20260211_create_profile_trigger.sql` | Trigger para auto-crear perfil al registrarse |
| 3 | `20260212_growth_analytics.sql` | Tablas: template_views, template_leads + RLS |
| 4 | `20260213_create_user_profile.sql` | Ajustes al perfil de usuario |
| 5 | `20260214_fix_profile_rls.sql` | Fix de políticas RLS en profiles |
| 6 | `20260215_simplify_profile_rls.sql` | Simplificación de RLS en profiles |
| 7 | `20260216_categories_table.sql` | Tabla categories + RLS + trigger para categoría "General" |
| 8 | `20260217_default_category.sql` | Constraint única (organization_id, slug) + trigger para auto-crear "General" |
| 9 | `20260216233500_create_procedure_statuses.sql` | Tabla procedure_statuses + RLS + Migración de datos legacy |

