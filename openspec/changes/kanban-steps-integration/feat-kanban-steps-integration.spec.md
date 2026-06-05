# 📋 Spec: Integración de Pasos de Plantilla en Kanban de Trámites

**Versión:** 1.0  
**Fecha:** 2026-04-17  
**Autor:** Arquitecto  
**Estado:** ✅ APROBADO — Listo para implementar  
**Rama destino:** `feat/kanban-steps-integration` (desde `develop`)

---

## 🎯 Objetivo

Mejorar el tablero Kanban de `/procedures` para que cada tarjeta muestre el **progreso real de los pasos** configurados en la plantilla del trámite. El gestor debe poder ver de un vistazo qué pasos están completos y cuáles faltan, y desde un drawer lateral actualizar el estado paso a paso y revisar el expediente del cliente — todo sin salir del Kanban.

---

## ⚙️ Stack y Restricciones

| Tecnología | Versión | Notas |
|---|---|---|
| Next.js | 16 (App Router) | Server Actions para mutaciones |
| TypeScript | 5 strict | **CERO `any` types nuevos** |
| Supabase SSR | latest | RLS activo, siempre incluir `organization_id` |
| Tailwind CSS | 4 | No inventar clases, usar las existentes |
| @dnd-kit | latest | Precaución con captura de eventos pointer |
| shadcn/ui | latest | Usar `Sheet` para el drawer |
| lucide-react | latest | Única librería de iconos permitida |

---

## 🌿 Protocolo de Git — OBLIGATORIO

> El agente programador DEBE seguir este flujo sin excepción.

### Rama de trabajo
```bash
git checkout develop
git pull origin develop
git checkout -b feat/kanban-steps-integration
```

### Commits atómicos (Conventional Commits)
Cada commit debe representar un cambio único y coherente:

```
feat(procedures): add steps_progress JSONB column migration
feat(types): add TemplateStep interface and steps_progress to Procedure
feat(actions): add updateProcedureStepsProgressAction server action
feat(procedures): create ProcedureStepsDrawer component
feat(procedures): enrich ProcedureCard with full step checklist
refactor(kanban): wire drawer state into KanbanBoard
test(procedures): add unit tests for ProcedureCard and drawer
```

**Prohibido:**
- ❌ Commits tipo `wip`, `fix stuff`, `changes`, `update`
- ❌ Mezclar migración SQL con cambios de UI en el mismo commit
- ❌ Trabajar directamente en `develop` o `main`

### Al finalizar
```bash
# Verificar que el build pasa antes de cualquier push
npx next build

# Solo si el build pasa:
git push -u origin feat/kanban-steps-integration
```

---

## 📐 Diseño: ¿Qué cambia?

### Columnas del Kanban

Las columnas son configurables por organización en `procedure_statuses`. La lógica visual debe adaptarse al `order_index`, NO a nombres hardcodeados.

Las 5 columnas objetivo (el usuario las configura desde Settings):

| `order_index` | Nombre sugerido | Semántica | `is_final` |
|---|---|---|---|
| 0 | **Pendiente** | Punto de entrada de todo trámite nuevo | false |
| 1 | **En Proceso** | Trámite activo — muestra checklist de pasos | false |
| 2 | **Espera de Aprobación** | Enviado a ente externo, esperando respuesta | false |
| 3 | **Aprobado** | Resuelto positivamente | true |
| 4 | **Rechazado** | Resuelto negativamente | true |

> **Nota:** El agente NO debe migrar nombres de columnas automáticamente. Eso lo hace el usuario desde la configuración. Solo implementar la nueva lógica visual.

### Tarjeta enriquecida (ProcedureCard)

```
┌────────────────────────────────────────┐
│ Habilitación Comercial                 │  ← título
│ 👤 Juan Pérez                          │  ← cliente
├────────────────────────────────────────┤
│ Pasos  ━━━━━━━━━━━░░░░░  3 / 5        │  ← barra + contador
│                                        │
│   ✅  Recopilar documentos             │
│   ✅  Presentar formulario SUNAT       │  ← TODOS los pasos,
│   ✅  Pago de tasas                    │    sin truncar
│   ⬜  Inspección municipal             │
│   ⬜  Emisión de certificado           │
├────────────────────────────────────────┤
│ 📅 17 abr              [Ver detalles →]│  ← botón abre drawer
└────────────────────────────────────────┘
```

**Reglas:**
- Si `template.steps` existe y tiene items → mostrar checklist completo (todos los pasos, sin límite)
- Si `template.steps` está vacío o `template_id` es null → mantener barra de progreso de requisitos actual (sin cambios)
- **"Ver detalles"** abre el drawer, NO navega a otra página

### Drawer lateral (ProcedureStepsDrawer)

Sheet de shadcn/ui, `side="right"`, ancho `w-[480px]`.

```
╔══════════════════════════════════════════╗
║  Habilitación Comercial          [✕]     ║  ← header
║  Juan Pérez  •  🟡 En Proceso            ║
╠══════════════════════════════════════════╣
║  PASOS DEL TRÁMITE                       ║
║  ━━━━━━━━━━━━━━━━━  3 de 5 completados  ║
║                                          ║
║  [✅] 1. Recopilar documentos            ║
║  [✅] 2. Presentar formulario SUNAT      ║
║  [✅] 3. Pago de tasas                   ║
║  [⬜] 4. Inspección municipal            ║
║  [⬜] 5. Emisión de certificado          ║
╠══════════════════════════════════════════╣
║  DOCUMENTOS REQUERIDOS                   ║
║                                          ║
║  ✅  DNI del titular                     ║
║  ✅  Contrato de alquiler                ║
║  ⬜  Plano del local                     ║
║  ⬜  Memoria descriptiva                 ║
╠══════════════════════════════════════════╣
║           [Ver expediente completo →]    ║  ← navega a /procedures/{id}
╚══════════════════════════════════════════╝
```

---

## 🗄️ Base de Datos

### Nueva columna (aplicar via `apply_migration` del MCP de Supabase)

```sql
ALTER TABLE procedures
ADD COLUMN IF NOT EXISTS steps_progress JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN procedures.steps_progress IS
  'Mapa de progreso por paso: { "step_index_or_id": boolean }. '
  'Permite marcar pasos individuales de forma no secuencial.';
```

> El campo `current_step_index` (entero) se mantiene para compatibilidad. Ambos coexisten.

### Estructura de `template.steps` (ya existe en la DB)

```typescript
interface TemplateStep {
  id: string          // UUID o string único
  title: string       // ej: "Recopilar documentación"
  description?: string
  order?: number
}
```

---

## 📁 Archivos a Crear / Modificar

### CREAR (archivos nuevos)

| Archivo | Descripción |
|---|---|
| `src/components/procedures/procedure-steps-drawer.tsx` | Drawer lateral con pasos y documentos |
| `src/components/procedures/__tests__/procedure-card.test.tsx` | Tests del card enriquecido |
| `src/components/procedures/__tests__/procedure-steps-drawer.test.tsx` | Tests del drawer |

### MODIFICAR (archivos existentes)

| Archivo | Qué cambia |
|---|---|
| `src/types/procedure.ts` | Agregar `TemplateStep`, `steps_progress` al tipo `Procedure` |
| `src/app/(dashboard)/procedures/actions.ts` | Agregar `updateProcedureStepsProgressAction` |
| `src/components/procedures/procedure-card.tsx` | Checklist de pasos + botón "Ver detalles" |
| `src/components/procedures/kanban-board.tsx` | Estado del drawer + `onStepsUpdate` handler |

### NO TOCAR

| Archivo | Motivo |
|---|---|
| `src/middleware.ts` | Seguridad — no modificar bajo ningún concepto |
| `src/app/(dashboard)/procedures/[id]/page.tsx` | Vista de expediente ya existe y funciona |
| `.env*` | Variables de entorno — nunca modificar |

---

## 🔌 API: Nuevas Server Actions

### `updateProcedureStepsProgressAction`

```typescript
// src/app/(dashboard)/procedures/actions.ts
// Agregar al final del archivo, NO modificar las actions existentes

export async function updateProcedureStepsProgressAction(
  procedureId: string,
  stepsProgress: Record<string, boolean>
): Promise<{ success: boolean; error?: string }> {
  // 1. Verificar sesión
  // 2. Verificar que el procedimiento pertenece a la organización del usuario (RLS)
  // 3. UPDATE procedures SET steps_progress = $1 WHERE id = $2
  // 4. NO llamar a revalidatePath — el cliente maneja el estado localmente
}
```

**Importante:** NO usar `revalidatePath` en esta action. El Kanban es cliente-side y maneja el estado optimísticamente.

---

## ⚠️ Problemas Conocidos — Leer antes de codificar

### 1. Drag vs Click en @dnd-kit

`@dnd-kit` captura `onPointerDown` para iniciar el drag. Si el botón "Ver detalles" no detiene la propagación correctamente, al hacer click se arrastrará la tarjeta.

**Solución obligatoria:**
```tsx
<button
  onPointerDown={(e) => e.stopPropagation()} // ← CRÍTICO: para dnd-kit
  onClick={(e) => {
    e.stopPropagation()
    onOpenDrawer(procedure.id)
  }}
>
  Ver detalles
</button>
```

### 2. Optimistic update — flujo completo

```
Usuario checkea un paso en el drawer
  ↓
1. Actualizar estado local de `procedures` en KanbanBoard (inmediato)
2. Llamar a updateProcedureStepsProgressAction()
3a. Éxito → no hacer nada más
3b. Error → revertir estado local + toast.error('Error al guardar. Intente nuevamente.')
```

### 3. Tarjetas sin plantilla

Trámites con `template_id = null` no tienen `steps`. El checklist NO debe renderizarse. Usar la barra de progreso de requisitos existente como fallback.

```typescript
const hasSteps = procedure.template?.steps && procedure.template.steps.length > 0
// if (!hasSteps) → render actual (sin cambios)
// if (hasSteps) → render checklist
```

---

## ✅ Lista de Tareas (TODO para el agente)

> Marcar cada item con `[x]` al completarlo. Hacer commit atómico por cada sección.

### Fase 1 — Infraestructura de datos
- [ ] **1.1** Aplicar migración SQL: `steps_progress JSONB` en tabla `procedures` (via MCP Supabase `apply_migration`)
- [ ] **1.2** Actualizar `src/types/procedure.ts`:
  - [ ] Agregar interfaz `TemplateStep { id, title, description?, order? }`
  - [ ] Agregar `steps_progress: Record<string, boolean>` a `Procedure`
  - [ ] Tipar `template.steps` como `TemplateStep[]` (actualmente `Record<string, unknown>[]`)
- [ ] **1.3** Agregar `steps_progress` al SELECT en `getProceduresAction` (ya hace join, solo asegurar que el campo venga)
- [ ] **1.4** Crear `updateProcedureStepsProgressAction` en `actions.ts`
- [ ] **1.5** Commit: `feat(procedures): add steps_progress column and server action`

### Fase 2 — Drawer lateral
- [ ] **2.1** Crear `src/components/procedures/procedure-steps-drawer.tsx`
  - [ ] Sheet de shadcn `side="right"` `w-[480px]`
  - [ ] Header: título, cliente, badge de estado con color dinámico
  - [ ] Sección "Pasos": lista completa con checkbox interactivo + barra de progreso
  - [ ] Sección "Documentos": lista de `requirements_snapshot` con estado de `checklist_progress`
  - [ ] Footer: botón "Ver expediente completo" → `<Link href="/procedures/{id}">`
  - [ ] Optimistic update al checkear un paso (ver flujo en sección anterior)
- [ ] **2.2** Commit: `feat(procedures): create ProcedureStepsDrawer with step checklist`

### Fase 3 — Tarjeta enriquecida
- [ ] **3.1** Modificar `src/components/procedures/procedure-card.tsx`
  - [ ] Detectar si `template.steps` existe y tiene items
  - [ ] Si tiene steps: renderizar checklist completo (todos los pasos, con ✅/⬜)
  - [ ] Si no tiene steps: mantener barra de progreso de requisitos (sin cambios)
  - [ ] Agregar botón "Ver detalles →" con `onPointerDown={e => e.stopPropagation()}`
  - [ ] La tarjeta ya NO es un `<Link>` cuando tiene el botón "Ver detalles" — el botón es el único CTA
- [ ] **3.2** Commit: `feat(procedures): enrich ProcedureCard with full step checklist`

### Fase 4 — Integración en KanbanBoard
- [ ] **4.1** Modificar `src/components/procedures/kanban-board.tsx`
  - [ ] Estado: `openDrawerProcedureId: string | null`
  - [ ] Handler `handleOpenDrawer(id: string)` y `handleCloseDrawer()`
  - [ ] Handler `handleStepsUpdate(updatedProcedure: Procedure)` — actualiza el item en `procedures[]` sin re-fetch
  - [ ] Renderizar `<ProcedureStepsDrawer>` fuera del `DndContext` (al final del return, para evitar conflictos)
  - [ ] Pasar `onOpenDrawer` como prop a `SortableProcedureCard` → `ProcedureCard`
- [ ] **4.2** Commit: `refactor(kanban): wire drawer state and step update handler`

### Fase 5 — Tests
- [ ] **5.1** `src/components/procedures/__tests__/procedure-card.test.tsx`
  - [ ] Renderiza checklist cuando `template.steps` tiene items
  - [ ] NO renderiza checklist cuando `template.steps` está vacío o ausente
  - [ ] Muestra todos los pasos sin truncar
  - [ ] El botón "Ver detalles" llama a `onOpenDrawer` con el id correcto
  - [ ] `onPointerDown` en el botón detiene la propagación
  - [ ] Los pasos con `steps_progress[id] = true` muestran ✅
- [ ] **5.2** `src/components/procedures/__tests__/procedure-steps-drawer.test.tsx`
  - [ ] Se abre y cierra correctamente
  - [ ] Checkbox llama a `updateProcedureStepsProgressAction`
  - [ ] Optimistic update actualiza UI antes de la respuesta del server
  - [ ] Revierte el estado si la action falla
  - [ ] El botón "Ver expediente" tiene el href correcto
- [ ] **5.3** Commit: `test(procedures): add unit tests for card and drawer`

### Fase 6 — Verificación final
- [ ] **6.1** Ejecutar `npx tsc --noEmit` → 0 errores
- [ ] **6.2** Ejecutar `npx next build` → build exitoso sin errores
- [ ] **6.3** Verificar que no se introdujeron tipos `any` nuevos: `grep -r "any" src/components/procedures/`
- [ ] **6.4** Verificar que el drag & drop del Kanban sigue funcionando
- [ ] **6.5** Commit final si hubo ajustes de polish: `fix(procedures): address build and type issues`
- [ ] **6.6** Push: `git push -u origin feat/kanban-steps-integration`

---

## 🏁 Criterios de Aceptación

El trabajo está **terminado** cuando:

1. ✅ `npx next build` pasa sin errores TypeScript
2. ✅ Todos los tests pasan
3. ✅ 0 tipos `any` nuevos introducidos
4. ✅ El drag & drop del Kanban sigue funcionando sin interferencias
5. ✅ Las tarjetas con steps muestran el checklist completo
6. ✅ Las tarjetas sin steps muestran la barra de progreso de requisitos (sin cambios)
7. ✅ El drawer abre y cierra correctamente al hacer click en "Ver detalles"
8. ✅ El checkbox del drawer persiste en Supabase con optimistic update
9. ✅ El botón "Ver expediente completo" navega a `/procedures/{id}`
10. ✅ La rama `feat/kanban-steps-integration` está pusheada a origin

---

## 📞 Escalación

Si el agente encuentra algo no especificado aquí, **detener y consultar** en lugar de asumir. Los puntos más probables de ambigüedad:

- Estructura exacta del JSON de `template.steps` en la DB (inspeccionar con Supabase MCP antes de codificar)
- Comportamiento esperado al marcar un paso en una tarjeta que está en columna "Aprobado" (¿se debe bloquear el checklist en columnas finales?)
