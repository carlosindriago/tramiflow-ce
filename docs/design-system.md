# Design System - TramiFlow CRM

Guía oficial de patrones de diseño, componentes y comportamiento visual.

---

## 📋 Tabla de Contenidos

1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Sistema de Modales](#2-sistema-de-modales)
3. [Sistema de Colores](#3-sistema-de-colores)
4. [Tipografía](#4-tipografía)
5. [Espaciado](#5-espaciado)
6. [Animaciones](#6-animaciones)
7. [Reglas de Componentes](#7-reglas-de-componentes)
8. [Accesibilidad](#8-accesibilidad)

---

## 1. Principios Fundamentales

### 1.1 Consistencia Visual

**REGLA DE ORO:** Todos los modales deben seguir el mismo layout base.

**Layout Base de Modal:**
```
┌─────────────────────────────────────┐
│                                     │
│           [ICONO GRANDE]            │
│           (80x80px o 64x64px)       │
│                                     │
│         TÍTULO (centrado)            │
│      Descripción (centrada)          │
│                                     │
│    [INFO BADGE - si aplica]          │
│                                     │
│      [BOTÓN 1]  [BOTÓN 2]           │
│       centrados al fondo             │
└─────────────────────────────────────┘
```

**Elementos obligatorios:**
- ✅ Icono centrado arriba (64x64px o 80x80px)
- ✅ Título centrado con variante de color
- ✅ Descripción centrada abajo del título
- ✅ Botones centrados al fondo
- ✅ `sm:max-w-md` para contenido moderado
- ✅ `py-6` padding vertical interno
- ✅ Dark mode con variantes `dark:`

### 1.2 Feedback al Usuario

**Tipos de Feedback:**

| Tipo | Componente | Cuándo usar | Duración |
|------|-----------|-------------|----------|
| **Éxito con redirect** | `AnimatedSuccessModal` | Crear/actualizar recurso | 2s auto |
| **Confirmación** | `ConfirmDialog` | Antes de acción destructiva | Espera usuario |
| **Rápido** | `toast()` | < 500ms, no bloqueante | 3s auto |
| **Error** | `toast.error()` o `ErrorBoundary` | Falla de acción | 5s o manual |
| **Loading** | `<Loader2 />` | Procesamiento async | - |

**NO usar modales para:**
- ❌ Login/logout (debe ser fluido)
- ❌ Operaciones < 500ms (usar toast)
- ❌ Validaciones de formulario (errores inline)
- ❌ Procesos en background (loading + notificación posterior)

### 1.3 Nomenclatura de Componentes

**Formato:** `[Tipo][Propósito]`

```tsx
// ✅ Correcto
AnimatedSuccessModal
ConfirmDialog
TemplateConfigPanel
TemplateTimeline

// ❌ Incorrecto
Modal        // Demasiado genérico
Dialog       // No indica propósito
Panel        // No indica contexto
```

---

## 2. Sistema de Modales

### 2.1 AnimatedSuccessModal (Post-Action)

**Propósito:** Feedback visual después de una acción exitosa.

**Variantes de Color:**

| Variante | Hex (Light) | Hex (Dark) | Uso |
|----------|-------------|------------|-----|
| `emerald` | `#10b981` | `#059669` | Éxito estándar (crear, actualizar) |
| `blue` | `#3b82f6` | `#2563eb` | Info (registro completado) |
| `amber` | `#f59e0b` | `#d97706` | Warning (requiere acción posterior) |
| `purple` | `#8b5cf6` | `#7c3aed` | Custom (feature premium) |

**Props Obligatorias:**
```tsx
<AnimatedSuccessModal
    open={boolean}
    onOpenChange={(open) => void}
    redirectPath={string}
    title={string}
    message={string}
    variant={'emerald' | 'blue' | 'amber' | 'purple'}
/>
```

**Props Opcionales:**
```tsx
redirectInfo="Redirigiendo..."      // Default: "Redirigiendo..."
autoRedirectDelay={2000}            // Default: 2000ms
buttonLabel="Ir Ahora"              // Default: "Ir Ahora"
```

**Comportamiento:**
- Countdown visible: `(2s)`
- Auto-redirect después de `autoRedirectDelay`
- Botón para saltar espera inmediatamente
- Tecla `ESC` cierra modal
- Focus trap dentro del modal

### 2.2 ConfirmDialog (Pre-Action)

**Propósito:** Confirmación antes de acción destructiva.

**Variantes de Color:**

| Variante | Icono | Color | Uso |
|----------|-------|-------|-----|
| `destructive` | `AlertTriangle` | Rojo | Eliminar, archivar |
| `warning` | `AlertTriangle` | Amber | Advertencias |
| `default` | `Info` | Azul | Confirmaciones neutrales |

**Props Obligatorias:**
```tsx
<ConfirmDialog
    open={boolean}
    onOpenChange={(open) => void}
    title={string}
    description={string}
    onConfirm={() => Promise<void> | void}
    variant={'destructive' | 'warning' | 'default'}
/>
```

**Props Opcionales:**
```tsx
confirmText="Confirmar"              // Default: "Confirmar"
cancelText="Cancelar"                // Default: "Cancelar"
isLoading={boolean}                  // Loading state externo
```

**Comportamiento:**
- Info Badge para `destructive`: "Esta acción es irreversible"
- Loading state en botón confirmar
- Ambos botones deshabilitados durante loading
- Tecla `ESC` cierra modal (cancela acción)

---

## 3. Sistema de Colores

### 3.1 Paleta Semántica

```css
/* Success (Emerald) */
--success-light: #10b981;      /* text-emerald-500 */
--success-dark: #059669;       /* dark:text-emerald-500 */
--success-bg: #d1fae5;         /* bg-emerald-50 */
--success-bg-dark: #064e3b20;  /* dark:bg-emerald-950/20 */
--success-border: #6ee7b7;     /* border-emerald-200 */

/* Error (Red) */
--error-light: #ef4444;        /* text-red-500 */
--error-dark: #dc2626;         /* dark:text-red-500 */
--error-bg: #fee2e2;           /* bg-red-50 */
--error-bg-dark: #7f1d1d20;    /* dark:bg-red-950/20 */
--error-border: #fca5a5;       /* border-red-200 */

/* Warning (Amber) */
--warning-light: #f59e0b;      /* text-amber-500 */
--warning-dark: #d97706;       /* dark:text-amber-500 */
--warning-bg: #fef3c7;         /* bg-amber-50 */
--warning-bg-dark: #78350f20;  /* dark:bg-amber-950/20 */
--warning-border: #fcd34d;     /* border-amber-200 */

/* Info (Blue) */
--info-light: #3b82f6;         /* text-blue-500 */
--info-dark: #2563eb;          /* dark:text-blue-500 */
--info-bg: #dbeafe;            /* bg-blue-50 */
--info-bg-dark: #1e3a8a20;     /* dark:bg-blue-950/20 */
--info-border: #93c5fd;        /* border-blue-200 */

/* Custom (Purple) */
--custom-light: #8b5cf6;       /* text-purple-500 */
--custom-dark: #7c3aed;        /* dark:text-purple-500 */
--custom-bg: #ede9fe;          /* bg-purple-50 */
--custom-bg-dark: #4c1d9520;   /* dark:bg-purple-950/20 */
--custom-border: #c4b5fd;      /* border-purple-200 */
```

### 3.2 Uso de Colores

**Regla de Contraste:** Mínimo WCAG AA (4.5:1 para texto normal)

```tsx
// ✅ Correcto - Alto contraste
<p className="text-emerald-600 dark:text-emerald-400">

// ❌ Incorrecto - Bajo contraste
<p className="text-emerald-900 dark:text-emerald-950">
```

**Fondos de Badge:**

```tsx
// ✅ Correcto - Badge con borde
<div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">

// ❌ Incorrecto - Badge sin borde (bajo contraste en dark mode)
<div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4">
```

---

## 4. Tipografía

### 4.1 Escala de Tamaños

```tsx
// Display (títulos principales)
<h1 className="text-4xl font-bold">        // 36px
<h2 className="text-3xl font-bold">        // 30px
<h3 className="text-2xl font-bold">        // 24px

// Body
<p className="text-base">                  // 16px (default)
<p className="text-sm">                   // 14px
<p className="text-xs">                   // 12px

// Modal Títulos
<DialogTitle className="text-xl font-bold text-emerald-600">  // 20px
<DialogDescription className="text-base">                    // 16px
```

### 4.2 Pesos de Fuente

```tsx
// Regular
text.font-normal                        // 400

// Medium
text.font-medium                        // 500

// Semibold
text.font-semibold                      // 600

// Bold
text.font-bold                          // 700
```

**Uso:**
- `font-normal`: Texto de párrafo
- `font-medium`: Labels, botones secundarios
- `font-semibold`: Subtítulos, badges
- `font-bold`: Títulos, números importantes

---

## 5. Espaciado

### 5.1 Escala de Spacing

```tsx
// Tailwind spacing scale
p-0    → 0px
p-1    → 4px
p-2    → 8px
p-3    → 12px
p-4    → 16px
p-6    → 24px
p-8    → 32px
```

### 5.2 Reglas de Espaciado en Modales

```tsx
// ✅ Correcto - Espaciado consistente
<DialogContent className="sm:max-w-md">
    <div className="flex flex-col items-center justify-center py-6">
        <div className="mb-6">{Icon}</div>        // 24px abajo del icono
        <DialogHeader className="text-center">
            <DialogTitle>{Title}</DialogTitle>      // Título
            <DialogDescription className="mt-2">   // 8px abajo del título
                {Description}
            </DialogDescription>
        </DialogHeader>
        <div className="mt-4 mb-6">{Badge}</div>  // 16px arriba, 24px abajo
        <DialogFooter>{Buttons}</DialogFooter>    // Botones al fondo
    </div>
</DialogContent>
```

---

## 6. Animaciones

### 6.1 Animaciones Permitidas

```tsx
// Loading spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Ping effect (solo para AnimatedSuccessModal)
<div className="h-20 w-20 rounded-full bg-emerald-500/20 animate-ping" />

// Pulse (para badges de info)
<div className="animate-pulse">...</div>
```

### 6.2 Duraciones

```tsx
// Fast (transiciones UI)
duration-150    // 150ms
duration-200    // 200ms

// Medium (animaciones de contenido)
duration-300    // 300ms

// Slow (transiciones de página)
duration-500    // 500ms
```

**Auto-Redirect Timing:**
- Default: `2000ms` (2 segundos)
- Mínimo recomendado: `1500ms` (1.5 segundos)
- Máximo recomendado: `3000ms` (3 segundos)

---

## 7. Reglas de Componentes

### 7.1 Componentes Reutilizables

**Todos los componentes deben:**
1. ✅ Tener `displayName` para debugging
2. ✅ Exportarse named export (no default)
3. ✅ Tener JSDoc con descripción y ejemplo de uso
4. ✅ Usar `cn()` para merges de className
5. ✅ Aceptar `className` prop para customización
6. ✅ Soportar dark mode con variantes `dark:`

```tsx
/**
 * Animated Success Modal Component
 *
 * Provides consistent, animated feedback for successful actions.
 *
 * @example
 * ```tsx
 * <AnimatedSuccessModal
 *     open={showSuccess}
 *     onOpenChange={setShowSuccess}
 *     redirectPath="/templates/123"
 *     title="¡Plantilla Guardada!"
 *     message="Tu plantilla se ha creado correctamente"
 *     variant="emerald"
 * />
 * ```
 */
export function AnimatedSuccessModal({
    className,
    ...props
}: AnimatedSuccessModalProps) {
    return (
        <div className={cn('base-classes', className)}>
            {...props}
        </div>
    )
}
```

### 7.2 Componentes de Formulario

**Patrón de Estado Local:**

```tsx
// ✅ Correcto - Estado local para UI inmediata
const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
const [newCategoryName, setNewCategoryName] = useState('')

// ❌ Incorrecto - form.watch() es lento (causa re-renders)
const categoryName = form.watch('category')
```

**Validación:**
1. Schema Zod en `src/types/`
2. `zodResolver` en `react-hook-form`
3. Validación manual en `handleSaveClick` si se necesita feedback inmediato

---

## 8. Accesibilidad

### 8.1 Focus Management

**Reglas:**
- ✅ Modales tienen focus trap (Radix UI lo maneja)
- ✅ Return focus al elemento que abrió el modal
- ✅ `ESC` cierra modales
- ✅ `ENTER` ejecuta acción primaria
- ✅ Focus visible en todos los elementos interactivos

```tsx
// ✅ Correcto - Focus visible
<Button className="focus-visible:ring-2 focus-visible:ring-emerald-500">

// ❌ Incorrecto - Sin focus visible
<Button className="focus:outline-none">
```

### 8.2 Screen Readers

**Reglas:**
- ✅ `DialogTitle` anuncia el propósito del modal
- ✅ `DialogDescription` provee contexto adicional
- ✅ `aria-label` en botones con solo iconos
- ✅ `role="alertdialog"` en modales críticos

```tsx
// ✅ Correcto - Dialog con accesibilidad
<Dialog>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>¡Plantilla Guardada!</DialogTitle>
            <DialogDescription>
                Tu plantilla se ha creado correctamente
            </DialogDescription>
        </DialogHeader>
    </DialogContent>
</Dialog>
```

### 8.3 Keyboard Navigation

| Tecla | Acción |
|-------|--------|
| `ESC` | Cerrar modal, cancelar acción |
| `ENTER` | Ejecutar acción primaria |
| `TAB` | Navegar elementos interactivos |
| `SHIFT + TAB` | Navegar hacia atrás |

### 8.4 Contraste de Colores

**Requerimientos WCAG AA:**
- Texto normal: Mínimo 4.5:1
- Texto grande (>18px): Mínimo 3:1
- Componentes UI: Mínimo 3:1

```tsx
// ✅ Correcto - Alto contraste
<p className="text-emerald-600 dark:text-emerald-400">  // 7:1+

// ❌ Incorrecto - Bajo contraste
<p className="text-emerald-900 dark:text-emerald-950">  // < 3:1
```

---

## 9. Dark Mode

### 9.1 Reglas de Dark Mode

**Todas las variantes de color deben tener equivalente dark:**

```tsx
// ✅ Correcto - Dark mode implementado
<div className="bg-emerald-50 dark:bg-emerald-950/20
            text-emerald-700 dark:text-emerald-300
            border-emerald-200 dark:border-emerald-800">

// ❌ Incorrecto - Sin dark mode
<div className="bg-emerald-50 text-emerald-700 border-emerald-200">
```

### 9.2 Superficies (Surfaces)

```css
/* Elevation System */
:root {
    --elevation-0: 250 248 245;  /* Base (papel) */
    --elevation-1: 255 255 255;  /* +1 (tarjetas) */
    --elevation-2: 255 255 255;  /* +2 (dropdowns) */
}

.dark {
    --elevation-0: 9 9 11;       /* Base */
    --elevation-1: 24 24 27;     /* +1 (tarjetas) */
    --elevation-2: 39 39 42;     /* +2 (dropdowns) */
}
```

---

## 10. Checklist para Nuevos Componentes

Antes de agregar un nuevo componente a la UI, verificar:

- [ ] **Consistencia Visual:** Sigue el layout base de modales
- [ ] **Dark Mode:** Tiene variantes `dark:` para todos los colores
- [ ] **Accesibilidad:** Tiene `DialogTitle`, `DialogDescription`
- [ ] **Focus Management:** Funciona con teclado (TAB, ESC, ENTER)
- [ ] **Contraste:** Cumple WCAG AA (4.5:1 mínimo)
- [ ] **Responsive:** Funciona en mobile y desktop
- [ ] **Loading State:** Tiene feedback visual durante carga
- [ ] **Error Handling:** Maneja errores correctamente
- [ ] **Documentación:** Tiene JSDoc con ejemplo de uso
- [ ] **Named Export:** Exporta con nombre (no default)

---

## 11. Archivos de Referencia

### Documentación
- **[docs/ux-patterns.md](ux-patterns.md)** - Patrones de UX detallados
- **[docs/modules.md](modules.md)** - Módulos del sistema

### Componentes
- **[src/components/ui/animated-success-modal.tsx](../src/components/ui/animated-success-modal.tsx)** - Modal de éxito
- **[src/components/ui/confirm-dialog.tsx](../src/components/ui/confirm-dialog.tsx)** - Dialog de confirmación

### Hooks
- **[src/hooks/use-form-success.ts](../src/hooks/use-form-success.ts)** - Hook para estado de éxito

### Ejemplos
- **[src/components/templates/template-form.tsx](../src/components/templates/template-form.tsx)** - Implementación de referencia

---

## 12. Versionado

**Versión Actual:** 1.0.0
**Última Actualización:** 2025-02-11

**Historial de Cambios:**
- 1.0.0 - Sistema de modales, colores, tipografía base

---

**IMPORTANTE:** Este documento es la **fuente de verdad** para el diseño de TramiFlow CRM. Cualquier cambio en la UI debe actualizarse aquí primero.

---

¿Necesitas aclarar o expandir alguna sección de este documento?
