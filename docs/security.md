# 🔒 Seguridad — Security by Design

> "Nunca confíes en el Cliente (Frontend)" — Principio fundamental.

---

## 1. Modelo de Seguridad

TramiFlow implementa **defensa en profundidad** con múltiples capas:

```
┌──────────────────────────────────────────────────────┐
│  CAPA 1: Middleware (Route Protection)                │
│  → Verifica sesión ANTES de servir cualquier página   │
│  → Redirige /login si no hay token válido             │
│  → Refresca tokens expirados automáticamente          │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  CAPA 2: Server Actions (Business Logic)              │
│  → getUser() obligatorio en CADA acción               │
│  → Validación Zod de TODOS los inputs                 │
│  → user.id del token, NUNCA del cliente               │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  CAPA 3: Row-Level Security (Data Layer)              │
│  → PostgreSQL enforces access por organization_id     │
│  → Imposible acceder a datos de otra organización     │
│  → Incluso si hay bugs en la app layer                │
└──────────────────────────────────────────────────────┘
```

---

## 2. Autenticación

### 2.1 Middleware (`src/middleware.ts`)

El middleware se ejecuta en **cada request** (excepto estáticos) y:

1. Crea un cliente Supabase SSR con las cookies del request.
2. Llama a `getUser()` (valida el JWT con el servidor, NO `getSession()`).
3. Aplica las reglas de routing:

| Condición | Acción |
|-----------|--------|
| Sin user + ruta privada | → Redirect a `/login` |
| Con user + en `/login` | → Redirect a `/` |
| Ruta pública (`/login`, `/auth/callback`, `/shared`) | → Pass through |

```typescript
// ⚠️ IMPORTANTE: Usar getUser(), NO getSession()
// getUser() valida el token con el servidor de Supabase
// getSession() solo lee los claims del JWT (no detecta tokens revocados)
const { data: { user } } = await supabase.auth.getUser()
```

### 2.2 Server Actions — Verificación Obligatoria

**Primer paso en CADA Server Action:**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateTemplate(formData: FormData) {
    const supabase = await createClient()

    // 1. OBLIGATORIO: Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. OBLIGATORIO: Usar user.id del token, NUNCA del input
    const organizationId = user.id // → derivar de profiles table

    // 3. OBLIGATORIO: Validar inputs con Zod
    const parsed = templateSchema.safeParse(rawData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    // 4. Query con RLS (organización se filtra automáticamente)
    const { data, error } = await supabase
        .from('procedure_templates')
        .update(parsed.data)
        .eq('id', templateId)
}
```

### 2.3 Trigger de Perfil Automático

Cuando un usuario se registra, un trigger de database crea automáticamente su `profile`. Esto garantiza que siempre exista un registro en `profiles` para cada `auth.users`.

---

## 3. Autorización (RLS)

### 3.1 Principio Multi-Tenant

Toda tabla con datos de usuario tiene `organization_id`. Las políticas RLS verifican que el usuario autenticado pertenece a la organización:

```sql
-- Patrón estándar de RLS
CREATE POLICY "access_own_org_data"
ON public.table_name FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.profiles
        WHERE id = auth.uid()
    )
);
```

### 3.2 Roles de Usuario

| Rol | Descripción | Permisos Actuales |
|-----|-------------|-------------------|
| `owner` | Creador de la organización | CRUD completo en todos los recursos de su org |
| `admin` | Administrador | CRUD completo (mismo que owner por ahora) |
| `member` | Miembro estándar | CRUD completo (mismo que owner por ahora) |

> 📌 **Nota:** Actualmente todos los roles tienen los mismos permisos. La diferenciación granular de permisos por rol está planificada para futuras iteraciones.

### 3.3 Acceso Público

Algunas tablas permiten acceso anónimo controlado:

| Tabla | Operación | Público | Razón |
|-------|-----------|---------|-------|
| `procedure_templates` | SELECT | ✓ (si `is_publicly_visible=true`) | Landing pages de lead magnets |
| `template_views` | INSERT | ✓ (anon + auth) | Tracking de visitas |
| `template_leads` | INSERT | ✓ (anon + auth) | Captura de leads |

### 3.4 Service Role

Todas las tablas tienen una política de bypass para `service_role`:

```sql
CREATE POLICY "Service role bypass"
ON public.table_name FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

> ⚠️ **NUNCA** usar `supabase.auth.admin` (Service Role) para acciones de usuario. Solo para background jobs y tareas de sistema.

---

## 4. Validación de Inputs

### 4.1 Schemas Zod (Fuente de Verdad)

Todos los inputs del usuario pasan por schemas Zod **antes** de procesarse:

| Schema | Archivo | Uso |
|--------|---------|-----|
| `templateSchema` | `src/types/template.ts` | Crear/editar plantillas |
| `stepSchema` | `src/types/template.ts` | Validar pasos individuales |
| `createClientSchema` | `src/types/client.ts` | Crear clientes |
| `leadCaptureSchema` | `src/types/lead.ts` | Captura de leads públicos |

### 4.2 Ejemplo de Validación

```typescript
// ❌ NUNCA hacer esto
export async function createClient(data: unknown) {
    await supabase.from('clients').insert(data) // ← Peligroso
}

// ✅ SIEMPRE validar con Zod
export async function createClient(rawData: unknown) {
    const parsed = createClientSchema.safeParse(rawData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors }
    }
    await supabase.from('clients').insert({
        ...parsed.data,
        organization_id: userOrgId, // ← Del token, NO del input
    })
}
```

---

## 5. Secretos y Variables de Entorno

### Reglas

| Regla | Descripción |
|-------|-------------|
| 🚫 **NUNCA** hardcodear | Claves, tokens, secretos en código fuente |
| ✅ Usar `process.env` | Todas las credenciales via variables de entorno |
| ✅ `.env.local` en `.gitignore` | Nunca commitear archivos `.env` con secretos |
| 🛑 **ALERTA** | Si se detecta una credencial en el código, detener y alertar |

### Variables Requeridas

```env
# Supabase (OBLIGATORIAS)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Las variables con prefijo NEXT_PUBLIC_ son accesibles desde el cliente
# NUNCA poner Service Role Key con prefijo NEXT_PUBLIC_
```

---

## 6. Rate Limiting

El proyecto incluye un módulo de rate limiting (`src/lib/rate-limit.ts`) para proteger API routes de abuso. Aplicar en Route Handlers que reciben tráfico público (ej: captura de leads).

---

## 7. Checklist de Seguridad para Nuevas Features

Antes de mergear cualquier feature, verificar:

- [ ] ¿`getUser()` se llama al inicio de cada Server Action?
- [ ] ¿Los inputs se validan con un schema Zod?
- [ ] ¿`user.id` viene del token, no del request body?
- [ ] ¿La tabla nueva tiene RLS habilitado?
- [ ] ¿Las políticas RLS filtran por `organization_id`?
- [ ] ¿No hay secretos hardcodeados en el código?
- [ ] ¿Las nuevas `NEXT_PUBLIC_` variables no contienen secretos?
- [ ] ¿Se usa el Supabase client correcto (server vs browser)?

---

## 8. Security Audit Results (February 2026)

### Production Readiness Score: 8.5/10

The application has undergone a comprehensive security audit and is ready for production deployment.

### Audit Summary

| Area | Status | Details |
|------|--------|---------|
| RLS Policies | ✅ Verified | All Row-Level Security policies confirmed working correctly |
| Storage Buckets | ✅ Secure | `client-docs` bucket is private (not public) |
| Authentication | ✅ Secure | `getUser()` used consistently in all Server Actions |
| Input Validation | ✅ Secure | Zod schemas validate all user inputs |
| Code Quality | ✅ Clean | No unused imports, proper type safety |

### RLS Policies Verification

All tables have been verified to have proper RLS policies:

- **`profiles`**: Users can only access their own profile data
- **`clients`**: Organization-scoped access via `organization_id`
- **`procedure_templates`**: Organization-scoped with public read option
- **`categories`**: Organization-scoped access
- **`documents`**: Organization-scoped access via client relationships

### Storage Bucket Security

| Bucket | Visibility | Purpose |
|--------|------------|---------|
| `client-docs` | 🔒 Private | Client document storage (requires authenticated access) |
| `branding` | 🌐 Public | Organization logos and branding assets |

> ⚠️ **Important**: The `client-docs` bucket is correctly configured as private. Documents are only accessible to authenticated users within the same organization.

### Code Quality Improvements

The following improvements were made during the audit:

1. **Memory Leak Fix** ([`SmartDropzone.tsx`](src/components/documents/smart-dropzone.tsx)):
   - Fixed event listener cleanup in `useEffect` hooks
   - Properly removes drag event listeners on component unmount

2. **Type Safety** ([`client.ts`](src/types/client.ts)):
   - Client type now uses `Tables<'clients'>` from [`database.types.ts`](src/types/database.types.ts)
   - Ensures type alignment with database schema

3. **Code Cleanup**:
   - Removed all unused imports across the codebase
   - Build passes with zero type errors

### Recommendations for Future Improvements

1. **Rate Limiting**: Consider implementing rate limiting on public API routes
2. **Audit Logging**: Add audit logs for sensitive operations (client data access, document downloads)
3. **Session Management**: Consider implementing session timeout for inactive users
