# TramiFlow CRM - Architecture & Rules

**Última actualización:** 2026-03-07  
**Versión:** 0.2.0

---

## 🏗️ Arquitectura General

### Tech Stack
- **Framework:** Next.js 16.1.6 (App Router)
- **Lenguaje:** TypeScript 5.x (Strict Mode)
- **Base de Datos:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** Shadcn/ui + Tailwind CSS 4 + Radix UI
- **Estado:** TanStack React Query
- **Validación:** Zod + React Hook Form
- **Drag & Drop:** @dnd-kit

### Estructura de Carpetas
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Área protegida (multi-tenant)
│   ├── admin/             # Super Admin Panel
│   ├── api/               # API Routes
│   └── auth/              # Auth handlers
├── components/
│   ├── ui/                # Componentes Shadcn
│   ├── clients/          # Módulo clientes
│   ├── procedures/        # Kanban
│   ├── templates/         # Template Builder
│   └── pdf-tools/        # Herramientas PDF
├── lib/
│   ├── actions/           # Server Actions
│   ├── supabase/         # Clients
│   └── utils.ts          # Utilidades
└── types/                 # Tipos TypeScript
```

### Multi-Tenancy
- Todas las tablas tienen `organization_id`
- Middleware verifica organización antes de permitir acceso
- RLS (Row Level Security) activo en todas las tablas

---

## ⚠️ Reglas de Seguridad (CRÍTICAS)

### Regla #1: Multi-Tenant Estricto

> **Somos un SaaS. Jamás debes hacer una consulta a Supabase que exponga datos globales.**

✅ **Correcto:**
```typescript
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('organization_id', organizationId)  // ← OBLIGATORIO
```

❌ **Incorrecto:**
```typescript
const { data } = await supabase
  .from('clients')
  .select('*')  // ← EXPONE TODOS LOS CLIENTES!
```

**Consecuencia:** Data Leak - Exposición de datos de otras organizaciones.

---

## ⚠️ Reglas de React y Next.js SSR

### Regla #2: Hydration Mismatches con dnd-kit

Al usar librerías de Drag & Drop (@dnd-kit), los IDs generados dinámicamente chocan entre el servidor y el cliente, causando Hydration Error.

✅ **Solución: Patrón isMounted (CSR)**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { DndContext, ... } from '@dnd-kit/core'

export function KanbanBoard({ initialData }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Mientras no está mountado, mostrar skeleton o null
  if (!isMounted) {
    return <KanbanSkeleton />
  }

  return (
    <DndContext ...>
      {/* Componente dnd-kit */}
    </DndContext>
  )
}
```

### Regla #3: Rules of Hooks (Regla de Oro)

> **NUNCA pongas un early return (como `if (!isMounted) return null;`) por encima de la declaración de otros Hooks.**

❌ **Incorrecto (viola Rules of Hooks):**
```tsx
export function Component() {
  if (!isMounted) return null  // ← ERROR! Early return antes de useState

  const [state, setState] = useState()  // ← Nunca se ejecuta si no está mountado
  useEffect(() => {}, [])
  
  return <div>...</div>
}
```

✅ **Correcto:**
```tsx
export function Component() {
  const [state, setState] = useState()  // ← Hooks primero
  useEffect(() => {}, [])

  if (!isMounted) return null  // ← Early return DESPUÉS de hooks

  return <div>...</div>
}
```

**Consecuencia:** "Rendered more hooks than during the previous render" - Error de producción.

---

## ⚠️ Reglas de CSS y Tailwind - El Kanban

### Regla #4: Prevención de "Flexbox Blowout"

Para construir tableros de scroll horizontal sin romper el layout padre:

```tsx
// 1. Padre (Página): overflow-hidden
<div className="h-screen overflow-hidden">
  
  {/* 2. Contenedor intermedio: flex-1 min-h-0 min-w-0 */}
  <div className="flex-1 min-h-0 min-w-0">
    
    {/* 3. Viewport: El que hace scroll */}
    <div className="overflow-x-auto overflow-y-hidden">
      
      {/* 4. Track: Contenedor de columnas - w-max */}
      <div className="flex gap-4 w-max">
        
        {/* Columnas: ancho FIJO (no min-w) */}
        <div className="w-[225px] flex-shrink-0">
          {/* Contenido */}
        </div>
        
      </div>
    </div>
  </div>
</div>
```

**Errores comunes:**
- ❌ `min-w-max` en el track → Rompe el cálculo de ancho
- ❌ Sin `min-w-0` en contenedor → Genera doble scrollbar
- ❌ Columnas sin ancho fijo → Se encogen al estar vacías

---

## ⚙️ Protocolo Operativo (v3.0 - Pull Request)

### Antes de Codificar
1. ✅ Actualizar rama develop: `git checkout develop && git pull`
2. ✅ Crear rama desde develop: `git checkout -b feat/TRAMI-XXX-descripcion`
3. ✅ Analizar el contexto
4. ✅ Presentar plan estructurado
5. ✅ Verificar impacto en multi-tenancy

### Antes de Commit
1. ✅ Prefijo [JARVIS] en todos los commits
   - ✅ `git commit -m "[JARVIS] feat: descripción"`
2. ✅ `npm run build` - Verificar TypeScript y Linting (NO npm run dev)
3. ✅ Verificar que no hay console.logs en código
4. ✅ Revisar que toda consulta tenga `organization_id`

### Entrega vía Pull Request
1. ✅ Push de rama: `git push -u origin nombre-rama`
2. ✅ Crear PR: `gh pr create --base develop --title "[JARVIS] feat: descripción" --body "..." --label "AI-Agent"`
3. ❌ NO HACER MERGE - Esperar autorización del Tech Lead

### Post-Merge (cuando Carlos apruebe)
1. ✅ `git checkout develop && git pull`
2. ✅ `git branch -d nombre-rama` (limpiar rama local)
3. ✅ Listo para siguiente tarea

---

## ✅ Checklist de Seguridad

| Item | Status |
|------|--------|
| RLS en todas las tablas | ✅ |
| organization_id en TODAS las consultas | ⚠️ Revisar |
| Middleware auth check | ✅ |
| Input validation (Zod) | ✅ |
| Storage bucket privado | ✅ |
| Secrets en env | ✅ |

---

## 📝 Notas

- Este archivo documenta las reglas aprendidas durante el desarrollo
- Actualizar cuando se descubran nuevos patrones o antipatrones
- Consultar BACKLOG.md para tareas pendientes
- Consultar review-2026-03-07.md para code review completo
