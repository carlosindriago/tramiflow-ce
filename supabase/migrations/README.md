# TramiFlow CRM - Supabase Migrations

Esta carpete contiene todas las migraciones de base de datos y storage para TramiFlow CRM.

## 🚀 Ejecutar Migraciones

### Opción 1: Supabase Dashboard (Manual)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Navega a: **SQL Editor** → **New Query**
4. Para cada archivo `.sql` en esta carpeta:
   - Abre el archivo
   - Copia todo el contenido
   - Pégalo en el SQL Editor
   - Click en **Run** (o `Ctrl+Enter`)
5. Verifica que no haya errores en la consola

### Opción 2: CLI (Automatizado)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login (primera vez)
supabase login

# Linkar al proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Ejecutar todas las migraciones pendientes
supabase db push

# O migrar en orden específico
supabase db execute -f supabase/migrations/20260220_create_organizations.sql
supabase db execute -f supabase/migrations/20260221_create_branding_bucket.sql
```

## 📋 Orden de Ejecución

Las migraciones deben ejecutarse en este orden:

1. **Core Tables** (si no existen aún)
   - `20260210_core_tables.sql`
   - `20260213_create_user_profile.sql`

2. **Onboarding & Multi-tenancy** ⭐ NUEVO
   - `20260220_create_organizations.sql` ⚡ **IMPORTANTE**
   - `20260221_create_branding_bucket.sql` ⚡ **IMPORTANTE**

3. **Clientes & Documentos**
   - `20260219_clients_rls_policies.sql`
   - `20260218_smart_documents.sql`

## 🏗️ Estructura Creada

### Tablas Principales

#### `organizations`
| Columna | Tipo | Descripción |
|----------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Nombre único de la organización |
| slug | TEXT | URL-friendly identifier |
| logo_url | TEXT | URL del logo (storage) |
| plan | TEXT | 'free' \| 'pro' \| 'enterprise' |
| created_at | TIMESTAMPTZ | Fecha de creación |
| created_by | UUID | Usuario creador (FK) |

#### `organization_members`
| Columna | Tipo | Descripción |
|----------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK → organizations(id) |
| user_id | UUID | FK → auth.users(id) |
| role | TEXT | 'OWNER' \| 'ADMIN' \| 'MEMBER' |
| created_at | TIMESTAMPTZ | Fecha de unión |

### Storage Buckets

#### `branding`
- **Propósito:** Logos de organizaciones
- **Acceso:** Público (lectura), Autenticado (escritura)
- **Estructura:** `{user_id}/{filename.ext}`
- **RLS:**
  - ✅ Público puede leer
  - ✅ Auth puede subir a su propia carpeta
  - ✅ Auth puede actualizar/borrar sus archivos

### Funciones PostgreSQL

#### `create_organization_with_owner(name, slug, logo_url, plan)`
Crea una organización y automáticamente asigna al usuario como OWNER.

**Retorna:** UUID de la organización creada

**Ejemplo:**
```sql
SELECT create_organization_with_owner(
    'Mi Agencia',
    'mi-agencia',
    'https://...',
    'free'
);
```

#### `get_user_organizations()`
Retorna todas las organizaciones donde el usuario es miembro.

**Retorna:** TABLE (id, name, slug, logo_url, plan, role)

**Ejemplo:**
```sql
SELECT * FROM get_user_organizations();
```

### Triggers

#### `validate_organization_name`
Valida que el nombre de la organización sea único antes de insertar/actualizar.

**Error:** `Organization name already exists: {name}` (ERRCODE 23505)

## 🔐 Row Level Security (RLS)

### Organizations
- ✅ **Público:** Lectura (cualquiera puede ver metadata)
- ✅ **Autenticado:** Insert (con restricciones adicionales)

### Organization Members
- ✅ **Usuarios:** Ver solo sus memberships
- ✅ **Autenticado:** Insert (trigger valida)

### Branding Bucket
- ✅ **Anónimo/Auth:** Leer (logos públicos)
- ✅ **Autenticado:** Subir a su carpeta (`{user_id}/...`)
- ✅ **Autenticado:** Actualizar/borrar sus archivos

## 📊 After Migrations

Una vez ejecutadas las migraciones, verifica:

1. **Tablas creadas:**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   -- Debería incluir: organizations, organization_members
   ```

2. **Funciones disponibles:**
   ```sql
   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
   -- Debería incluir: create_organization_with_owner, get_user_organizations
   ```

3. **Bucket creado:**
   - Ve a: **Storage** → **Buckets** en Dashboard
   - Deberías ver: `branding`

4. **Permisos RLS:**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   -- Revisa que hayan políticas activas
   ```

## 🐛 Troubleshooting

### Error: "relation already exists"
→ La tabla ya existe. Si necesitas resetear:
```sql
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
-- Luego ejecuta la migración nuevamente
```

### Error: "function already exists"
→ La función ya existe. Reemplazar con `CREATE OR REPLACE`.
Las migraciones ya usan `OR REPLACE`, no debería ocurrir.

### Error: "permission denied"
→ Verifica que tienes permisos de `owner` o `admin` en Supabase.

### Error: "bucket already exists"
→ El bucket de storage ya existe. No es un error crítico.
Puedes verificarlo en el Dashboard de Storage.

## 📝 Notas Importantes

- **Onboarding Flow:** El sistema redirige automáticamente a `/onboarding`
  si un usuario autenticado no tiene organizaciones.
- **Slug Generation:** Se genera automáticamente desde el nombre (lowercase, hyphens).
- **Logo Upload:** Máximo 2MB, solo imágenes (JPG, PNG, WebP).
- **Roles:** Solo los OWNER pueden borrar la organización.

## 🔄 Rollback

Si necesitas revertir cambios:

```sql
-- Eliminar tablas
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.create_organization_with_owner;
DROP FUNCTION IF EXISTS public.get_user_organizations;
DROP FUNCTION IF EXISTS public.validate_unique_organization_name;

-- Eliminar bucket (desde Dashboard o CLI)
# supabase storage rm branding
```

---

**¿Dudas?** Revisa la documentación de [Supabase](https://supabase.com/docs).
