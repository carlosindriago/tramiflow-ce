# Patrones de UX - TramiFlow CRM

Guía de patrones de experiencia de usuario para consistencia en toda la aplicación.

---

## Tabla de Contenidos

1. [Modal de Éxito Animado](#1-modal-de-éxito-animado)
2. [Variantes de Color](#2-variantes-de-color)
3. [Tiempo y Redirección](#3-tiempo-y-redirección)
4. [Accesibilidad](#4-accesibilidad)
5. [Ejemplos de Implementación](#5-ejemplos-de-implementación)
6. [Patrones Relacionados](#6-patrones-relacionados)

---

## 1. Modal de Éxito Animado

### Propósito

Proporcionar feedback visual inmediato y satisfactorio cuando el usuario completa una acción exitosa. El animado checkmark con efecto "ping" crea una sensación de logro y confirma que la acción se completó correctamente.

### Cuándo Usar

✅ **Usar en:**
- Creación de recursos (templates, clientes, categorías)
- Actualización exitosa de datos
- Procesos batch completados
- Acciones irreversibles (delete, archive)
- Envío de formularios largos

❌ **NO usar en:**
- Operaciones rápidas (< 500ms) - usar toast en su lugar
- Acciones que fallan - usar error boundary o error toast
- Procesos en background - usar loading state + notificación posterior
- Validaciones de formulario - usar errores inline

### Componentes

#### `AnimatedSuccessModal`

Componente reutilizable en `src/components/ui/animated-success-modal.tsx`.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controla visibilidad del modal |
| `onOpenChange` | `(open: boolean) => void` | - | Callback cuando cambia estado |
| `redirectPath` | `string` | - | Ruta de redirección |
| `title` | `string` | - | Título del modal (ej: "¡Guardado!") |
| `message` | `string` | - | Descripción del éxito |
| `redirectInfo` | `string` | `"Redirigiendo..."` | Info sobre redirección |
| `autoRedirectDelay` | `number` | `2000` | Delay en ms antes de redirect |
| `buttonLabel` | `string` | `"Ir Ahora"` | Texto del botón manual |
| `variant` | `'emerald' \| 'blue' \| 'amber' \| 'purple'` | `'emerald'` | Variante de color |

#### `useFormSuccess` Hook

Hook personalizado en `src/hooks/use-form-success.ts` para simplificar implementación.

**Retorna:**

```typescript
interface UseFormSuccessReturn {
    isModalOpen: boolean
    setIsModalOpen: (open: boolean) => void
    createdId: string | null
    handleSuccess: (id?: string) => void
    buildRedirectPath: (basePath: string, detailPath?: (id: string) => string) => string
    reset: () => void
}
```

---

## 2. Variantes de Color

### Emerald (Éxito)

```tsx
<AnimatedSuccessModal variant="emerald" />
```

**Uso:** Acciones exitosas, creación, actualización.

**Estilos:**
- Icon: `text-emerald-500`
- Title: `text-emerald-600`
- Background: `bg-emerald-50` (light) / `bg-emerald-950/20` (dark)

### Blue (Info)

```tsx
<AnimatedSuccessModal variant="blue" />
```

**Uso:** Información importante, confirmaciones neutrales.

**Estilos:**
- Icon: `text-blue-500`
- Title: `text-blue-600`
- Background: `bg-blue-50` (light) / `bg-blue-950/20` (dark)

### Amber (Warning)

```tsx
<AnimatedSuccessModal variant="amber" />
```

**Uso:** Advertencias, acciones que requieren atención posterior.

**Estilos:**
- Icon: `text-amber-500`
- Title: `text-amber-600`
- Background: `bg-amber-50` (light) / `bg-amber-950/20` (dark)

### Purple (Custom)

```tsx
<AnimatedSuccessModal variant="purple" />
```

**Uso:** Acciones especiales, features premium, workflows personalizados.

**Estilos:**
- Icon: `text-purple-500`
- Title: `text-purple-600`
- Background: `bg-purple-50` (light) / `bg-purple-950/20` (dark)

---

## 3. Tiempo y Redirección

### Auto-Redirect

Por defecto, el modal redirige automáticamente después de **2 segundos**. Este tiempo está basado en investigación de UX:

- **1-2s:** Usuario puede leer el mensaje de éxito
- **> 3s:** Usuario siente que la aplicación es lenta
- **< 1s:** Usuario no alcanza a procesar el feedback

**Personalizar delay:**

```tsx
<AnimatedSuccessModal
    autoRedirectDelay={3000} // 3 segundos para mensajes más largos
    redirectInfo="Procesando datos adicionales..."
/>
```

### Skip Button

El botón "Ir Ahora" permite al usuario saltar el delay y redirigir inmediatamente. Esto es importante para:

- Usuarios recurrentes que ya conocen el flujo
- Casos donde el usuario quiere continuar rápidamente
- Accesibilidad (usuarios que no esperan)

### Countdown Timer

El modal muestra un countdown del tiempo restante:

```tsx
Redirigiendo a la vista... (2s)
```

Esto reduce la ansiedad del usuario al saber cuánto tiempo falta.

---

## 4. Accesibilidad

### Focus Management

El componente `Dialog` de shadcn/ui maneja automáticamente:
- Focus trap dentro del modal
- Return focus al elemento que lo abrió
- Focus visible para keyboard navigation

### Screen Readers

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>¡Plantilla Guardada!</DialogTitle>
            <DialogDescription>
                Tu plantilla se ha creado correctamente
            </DialogDescription>
        </DialogHeader>
        {/* ... */}
    </DialogContent>
</Dialog>
```

- `DialogTitle`: Anunciado por screen readers
- `DialogDescription`: Proporciona contexto adicional
- `role="dialog"`: Agregado automáticamente por Radix UI

### Keyboard Navigation

- **ESC**: Cierra el modal y cancela redirección
- **ENTER** en botón "Ir Ahora": Redirección inmediata
- **TAB**: Navega dentro del modal (solo botón en este caso)

### Dark Mode

Todos los estilos tienen variantes dark mode:

```tsx
className="bg-emerald-50 dark:bg-emerald-950/20"
```

Contraste mínimo WCAG AA:
- Light mode: 4.5:1 (texto normal)
- Dark mode: 7:1 (texto normal)

---

## 5. Ejemplos de Implementación

### Ejemplo Básico: Creación de Template

```tsx
'use client'

import { useState } from 'react'
import { useFormSuccess } from '@/hooks/use-form-success'
import { AnimatedSuccessModal } from '@/components/ui/animated-success-modal'
import { Button } from '@/components/ui/button'

export function TemplateForm() {
    const [isSaving, setIsSaving] = useState(false)
    const { isModalOpen, setIsModalOpen, createdId, handleSuccess } = useFormSuccess()

    const onSubmit = async (data: FormData) => {
        setIsSaving(true)
        try {
            const result = await saveTemplateAction(data)

            if (result.success && result.id) {
                // Mostrar modal de éxito
                handleSuccess(result.id)
            }
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <form onSubmit={onSubmit}>
                {/* ... campos del formulario ... */}
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                </Button>
            </form>

            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath={createdId ? `/templates/${createdId}` : '/templates'}
                title="¡Plantilla Guardada!"
                message="Tu plantilla se ha creado correctamente"
                redirectInfo="Redirigiendo a la vista de la plantilla..."
                buttonLabel="Ir Ahora"
                variant="emerald"
            />
        </>
    )
}
```

### Ejemplo: Actualización de Recurso

```tsx
export function EditTemplateForm({ initialData }: { initialData: Template }) {
    const { isModalOpen, setIsModalOpen, createdId, handleSuccess } = useFormSuccess()

    const onSubmit = async (data: FormData) => {
        const result = await updateTemplateAction(initialData.id, data)

        if (result.success) {
            handleSuccess(initialData.id) // Usar ID existente
        }
    }

    return (
        <>
            <form onSubmit={onSubmit}>...</form>

            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath={`/templates/${initialData.id}`}
                title="¡Cambios Guardados!"
                message="Los cambios se han guardado correctamente"
                redirectInfo="Redirigiendo a la vista de la plantilla..."
                variant="emerald"
            />
        </>
    )
}
```

### Ejemplo: Eliminar con Confirmación

Para acciones destructivas, primero mostrar **ConfirmDialog**, luego el modal de éxito:

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function TemplateActions({ templateId }: { templateId: string }) {
    const [showConfirm, setShowConfirm] = useState(false)
    const { isModalOpen, setIsModalOpen, handleSuccess } = useFormSuccess()

    const handleDelete = async () => {
        const result = await deleteTemplateAction(templateId)

        if (result.success) {
            setShowConfirm(false)
            handleSuccess() // Sin ID = redirect a listado
        }
    }

    return (
        <>
            <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                Eliminar Plantilla
            </Button>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="¿Eliminar esta plantilla?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                onConfirm={handleDelete}
            />

            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath="/templates"
                title="¡Plantilla Eliminada!"
                message="La plantilla se ha eliminado correctamente"
                redirectInfo="Redirigiendo al listado..."
                variant="emerald"
            />
        </>
    )
}
```

### Ejemplo: Batch Actions

```tsx
export function TemplateBulkActions({ selectedIds }: { selectedIds: string[] }) {
    const { isModalOpen, setIsModalOpen, handleSuccess } = useFormSuccess()

    const handleBulkArchive = async () => {
        const result = await archiveTemplatesAction(selectedIds)

        if (result.success) {
            handleSuccess()
        }
    }

    return (
        <>
            <Button onClick={handleBulkArchive}>
                Archivar {selectedIds.length} plantillas
            </Button>

            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath="/templates"
                title="¡Plantillas Archivadas!"
                message={`${selectedIds.length} plantillas han sido archivadas`}
                redirectInfo="Redirigiendo al listado..."
                variant="blue"
            />
        </>
    )
}
```

### Ejemplo: Variantes por Contexto

```tsx
// Éxito estándar (creación)
<AnimatedSuccessModal variant="emerald" />

// Info (registro completado)
<AnimatedSuccessModal
    variant="blue"
    title="¡Registro Completo!"
    message="Hemos recibido tu información correctamente"
/>

// Warning (requiere acción posterior)
<AnimatedSuccessModal
    variant="amber"
    title="¡Plantilla Creada!"
    message="Ahora debes agregar los pasos del procedimiento"
    redirectInfo="Serás redirigido para completar el proceso..."
/>

// Custom (feature premium)
<AnimatedSuccessModal
    variant="purple"
    title="¡Feature Premium Activada!"
    message="Tu organización ahora tiene acceso a analytics avanzado"
    redirectInfo="Explorando nuevas funcionalidades..."
/>
```

---

## 6. Patrones Relacionados

### ConfirmDialog (Pre-Action Confirmation)

El `ConfirmDialog` es para **confirmación ANTES de una acción** (generalmente destructiva), mientras que `AnimatedSuccessModal` es para **feedback DESPUÉS de una acción exitosa**.

**Componente:** [`src/components/ui/confirm-dialog.tsx`](src/components/ui/confirm-dialog.tsx:1)

**Diferencias clave:**

| Aspecto | ConfirmDialog | AnimatedSuccessModal |
|---------|---------------|----------------------|
| **Momento** | Antes de la acción | Después de la acción |
| **Propósito** | Confirmar intención | Feedback de éxito |
| **Botones** | Cancelar + Confirmar | Ir Ahora (skip redirect) |
| **Icono** | AlertTriangle / Info | CheckCircle |
| **Colores** | Rojo/Amber/Azul | Emerald/Blue/Amber/Purple |
| **Redirect** | No | Sí (auto o manual) |
| **Info Badge** | "Esta acción es irreversible" | "Redirigiendo... (2s)" |

**Variantes de color:**
- `destructive` (rojo) → Para acciones peligrosas (eliminar, archivar)
- `warning` (amber) → Para advertencias
- `default` (blue) → Para confirmaciones neutrales

**Ejemplo de uso:**
```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const [showConfirm, setShowConfirm] = useState(false)

const handleDelete = async () => {
    const result = await deleteTemplateAction(templateId)

    if (result.success) {
        setShowConfirm(false)
        // Luego mostrar AnimatedSuccessModal
        handleSuccess()
    }
}

return (
    <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="¿Eliminar esta plantilla?"
        description="Esta acción no se puede deshacer. Se perderán todos los datos asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
    />
)
```

**Diseño visual consistente:**
- Layout centrado (igual que `AnimatedSuccessModal`)
- Icono grande (16x16) con fondo circular
- Mensaje centrado con título + descripción
- Botones centrados al fondo
- Info Badge para variant `destructive`
- Dark mode soportado

### Loading States

Usar `Loader2` con `animate-spin` para indicar proceso:

```tsx
import { Loader2 } from 'lucide-react'

<Button disabled={isSaving}>
    {isSaving ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
        </>
    ) : (
        'Guardar'
    )}
</Button>
```

### Toast Notifications

Para feedback rápido (< 500ms) o mensajes no bloqueantes:

```tsx
import { toast } from 'sonner'

// Éxito rápido
toast.success('Cambios guardados')

// Error
toast.error('Error al guardar')

// Info
toast.info('Tienes 3 notificaciones sin leer')
```

### Error Boundaries

Para errores de runtime en componentes:

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary fallback={<ErrorState />}>
    <TemplateForm />
</ErrorBoundary>
```

### Skeleton Loading

Para contenido que se está cargando:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

{isLoading ? (
    <Skeleton className="h-[400px]" />
) : (
    <TemplateAnalytics data={data} />
)}
```

---

## Implementación System-Wide

### Checklist para Agregar a Nuevas Features

- [ ] **Server Action retorna `{ success: boolean, id?: string }`**
- [ ] **Formulario usa hook `useFormSuccess()`**
- [ ] **Modal con mensaje contextual (create vs update)**
- [ ] **Redirect a detail view si hay ID, sino a list**
- [ ] **Auto-redirect de 2s con botón para skip**
- [ ] **Countdown visible en modal**
- [ ] **Variant de color apropiada (emerald/blue/amber/purple)**
- [ ] **Dark mode soportado**
- [ ] **Keyboard navigation (ESC para cerrar)**
- [ ] **Screen reader announcements (DialogTitle/Description)**

### Archivos Relacionados

**Patrones de Éxito (Post-Action):**
- **Componente:** `src/components/ui/animated-success-modal.tsx`
- **Hook:** `src/hooks/use-form-success.ts`
- **Ejemplo de uso:** `src/components/templates/template-form.tsx`
- **Iconos:** `lucide-react` (CheckCircle)
- **Dialog primitives:** `@radix-ui/react-dialog`
- **Estilos:** Tailwind CSS (animate-ping, color variants)

**Patrones de Confirmación (Pre-Action):**
- **Componente:** `src/components/ui/confirm-dialog.tsx`
- **Iconos:** `lucide-react` (AlertTriangle, Info)
- **Variantes:** destructive (red), warning (amber), default (blue)

---

## Referencias

- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Tailwind CSS Animations](https://tailwindcss.com/docs/animation)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [shadcn/ui Dialog Component](https://ui.shadcn.com/docs/components/dialog)

---

**Última actualización:** 2025-02-11
**Versión:** 1.1.0 (Added ConfirmDialog documentation)
