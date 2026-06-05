# 👨‍💻 Guía de Desarrollo

> Convenciones, configuración del entorno, Git flow, TDD y workflows para contribuir a TramiFlow CRM.

---

## 1. Configuración del Entorno

### Requisitos Previos

| Herramienta | Versión Mínima |
|-------------|---------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| Git | 2.40+ |
| Supabase CLI | Última estable (opcional, para desarrollo local) |

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd tramiflow-crm

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Editar .env.local con credenciales reales de Supabase:
#    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 5. Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Dev | `npm run dev` | Inicia Next.js en modo desarrollo |
| Build | `npm run build` | Build de producción |
| Start | `npm run start` | Inicia el servidor de producción |
| Lint | `npm run lint` | Ejecuta ESLint |

---

## 2. Git Flow

### Estrategia de Ramas

```
main (producción)
  └── develop (pre-producción)
        ├── feat/nombre-feature
        ├── fix/nombre-bug
        └── chore/nombre-tarea
```

### Reglas Estrictas

| Regla | Descripción |
|-------|-------------|
| 🚫 **NUNCA** | Trabajar directamente en `main` o `develop` |
| ✅ **SIEMPRE** | Crear rama con prefijo: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/` |
| ✅ **SIEMPRE** | Usar [Conventional Commits](https://www.conventionalcommits.org/) |
| ✅ **SIEMPRE** | Commits atómicos (1 cambio = 1 commit) |

### Conventional Commits

Formato: `<tipo>(<alcance>): <descripción>`

```bash
# ✅ Correcto
feat(auth): add google login button component
fix(dashboard): resolve overlap in sidebar on mobile
chore(deps): upgrade supabase-js to v2.39
docs(readme): add setup instructions for testing
refactor(templates): extract step card into separate component
test(clients): add unit tests for create client form

# ❌ Prohibido
wip
arreglado
cambios en el login
fixed stuff
```

### Flujo de Trabajo Completo

```bash
# 1. Verificar que estés en develop
git checkout develop
git pull origin develop

# 2. Crear rama
git checkout -b feat/nombre-de-la-feature

# 3. Desarrollar con commits atómicos
git add src/components/new-component.tsx
git commit -m "feat(dashboard): add client stats widget"

git add src/types/stats.ts
git commit -m "feat(types): add stats interface definitions"

# 4. Push y crear PR
git push -u origin HEAD
# → Usar /pr workflow para automatizar

# 5. Después de aprobación
git checkout develop
git merge feat/nombre-de-la-feature
git push origin develop

# 6. Limpiar
git branch -d feat/nombre-de-la-feature
```

---

## 3. Workflows Automatizados

### `/pr` — Crear Pull Request

Automatiza el push y genera el link de PR:

1. Ejecuta `git status` para ver cambios pendientes.
2. Si hay cambios, hace `add` + `commit` con Conventional Commits.
3. Ejecuta `git push -u origin HEAD`.
4. Muestra el link de PR de GitHub.

### `/tdd` — TDD Feature Flow

Flujo estricto para crear features:

1. **Análisis:** Lee `CONTEXT.md`, entiende qué se necesita.
2. **RED:** Crea test que falla (`nombre.test.ts`).
3. **GREEN:** Implementa el código mínimo para que pase.
4. **Verificación:** Si es visual, sugiere agregarlo a una página de prueba.

---

## 4. Convenciones de Código

### TypeScript

```typescript
// ✅ Function components con interfaces tipadas
interface ClientCardProps {
    client: Client
    onEdit: (id: string) => void
}

function ClientCard({ client, onEdit }: ClientCardProps) {
    // ...
}

// ❌ NUNCA: usar `any`
function processData(data: any) { } // PROHIBIDO

// ✅ Si no sabes el tipo, defínelo en src/types/
interface ProcessData {
    status: 'pending' | 'active' | 'completed'
    metadata: Record<string, unknown>
}
```

### Componentes React

| Regla | Descripción |
|-------|-------------|
| Máximo 200 líneas | Si es más largo, divide en sub-componentes |
| `function` components | No classes ni `React.FC` |
| Iconos: `lucide-react` | No Material Icons ni FontAwesome |
| UI: `@/components/ui` primero | Solo crear custom si Shadcn no tiene el componente |
| Validación: `Zod` | Schemas en `src/types/` |
| Formularios: `react-hook-form` | Con `@hookform/resolvers` + Zod |

### Imports

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'

// 2. Librerías externas
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 3. Componentes internos
import { Button } from '@/components/ui/button'
import { ClientCard } from '@/components/clients/client-card'

// 4. Utilidades y tipos
import { cn } from '@/lib/utils'
import type { Client } from '@/types/client'
```

### Supabase

```typescript
// Server Component / Server Action → SIEMPRE usar server client
import { createClient } from '@/lib/supabase/server'

export async function getClients() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    // ...
}

// Client Component → SIEMPRE usar browser client
'use client'
import { createClient } from '@/lib/supabase/client'
```

---

## 5. Proceso TDD

Todo feature nuevo debe seguir el ciclo:

```
   ┌─────────┐
   │  RED    │ ← Escribe test que falla
   │  (Test) │
   └────┬────┘
        │
   ┌────▼────┐
   │  GREEN  │ ← Código mínimo para pasar
   │  (Code) │
   └────┬────┘
        │
   ┌────▼─────┐
   │ REFACTOR │ ← Limpia, tipea estricto, optimiza
   │          │
   └──────────┘
```

### Ubicación de Tests

Los tests se ubican en `src/tests/` o junto al componente:

```
src/
├── components/
│   └── clients/
│       ├── client-card.tsx
│       └── client-card.test.tsx   ← opción 1: junto al componente
├── tests/
│   └── client-card.test.tsx       ← opción 2: carpeta centralizada
```

---

## 6. Skills Disponibles

Los agentes AI tienen acceso a 4 skills especializados en `.agents/skills/`:

| Skill | ¿Cuándo usarlo? |
|-------|-----------------|
| `interface-design` | Diseño de dashboards, panels, UI compleja. Dark Mode Enterprise |
| `postgresql-table-design` | Al crear o modificar tablas en Supabase |
| `supabase-postgres-best-practices` | Optimización de queries, índices, RLS |
| `vercel-react-best-practices` | Performance React/Next.js: waterfalls, bundles, Server Actions |

### Verificación Obligatoria con Context7/MCP

Antes de generar código para estas tecnologías, **verificar** la sintaxis actual:

- **Next.js 16:** Server Actions, `use cache`, cookies
- **Supabase SSR:** `createBrowserClient`, `createServerClient`
- **Shadcn/UI:** Rutas de imports (pueden cambiar entre versiones)
- **TanStack Query v5:** `useMutation`, `useQuery` (sintaxis de objeto)

---

## 7. Política de Revisión

| Acción | Permiso |
|--------|---------|
| Crear/editar archivos en `src/` | ✅ Libre (si tests pasan) |
| Ejecutar `rm`, `drop` | 🛑 Requiere confirmación explícita |
| `npm install <nueva-librería>` | 🛑 Pedir permiso antes |
| Modificar datos en DB (MCP) | 🛑 Requiere revisión humana |
| Leer schema de DB (MCP) | ✅ Libre |

---

## 8. Code Quality Standards

### No Console Statements in Production

```typescript
// ❌ NUNCA: console.log en código de producción
console.log('User data:', userData)
console.error('Error:', error)

// ✅ CORRECTO: Usar logger condicional o toast notifications
if (process.env.NODE_ENV === 'development') {
    console.log('Debug info:', data)
}

// ✅ MEJOR: Usar el sistema de toast para errores de usuario
import { toast } from '@/lib/toast'
toast.error('Error al procesar la solicitud')
```

### Type Safety with Database Types

Always use generated types from [`database.types.ts`](src/types/database.types.ts) for database entities:

```typescript
// ❌ NUNCA: Definir tipos manuales para tablas de base de datos
interface Client {
    id: string
    name: string
    email: string
    // ... manual definitions can become outdated
}

// ✅ CORRECTO: Usar Tables<> helper desde database.types.ts
import { Tables } from '@/types/database.types'

type Client = Tables<'clients'>
type Template = Tables<'procedure_templates'>
type Category = Tables<'categories'>

// ✅ Para inserts (campos opcionales pueden ser omitidos)
type NewClient = TablesInsert<'clients'>

// ✅ Para updates (todos los campos opcionales)
type ClientUpdate = TablesUpdate<'clients'>
```

### Benefits of Using Generated Types

1. **Always in sync**: Types are generated from your Supabase schema
2. **Autocomplete**: IDE provides accurate property suggestions
3. **Type safety**: Catch schema mismatches at compile time
4. **Self-documenting**: Types reflect actual database structure

### Memory Leak Prevention

When using `useEffect` with event listeners or subscriptions:

```typescript
// ❌ NUNCA: Event listeners sin cleanup
useEffect(() => {
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
}, [])

// ✅ CORRECTO: Siempre retornar cleanup function
useEffect(() => {
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    
    return () => {
        window.removeEventListener('dragover', handleDragOver)
        window.removeEventListener('drop', handleDrop)
    }
}, [])
```

### Pre-Commit Checklist

Before committing any code:

- [ ] No `console.log` statements in production code
- [ ] All types use `Tables<>` from database.types.ts
- [ ] No unused imports (run `npm run lint` to check)
- [ ] Event listeners have cleanup functions
- [ ] Build passes: `npm run build` completes without errors |
