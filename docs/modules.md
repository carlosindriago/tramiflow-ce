# 📦 Módulos del Sistema

> Descripción funcional detallada de cada módulo de TramiFlow CE.

---

## Mapa de Módulos

```
TramiFlow CE
├── 🔐 Auth                    # Autenticación y sesiones
├── 📊 Dashboard               # Panel principal con stats
├── 👥 Clientes                # Gestión de clientes
├── 📋 Plantillas (Templates)  # Constructor de flujos de trabajo
│   ├── Template Builder       # Drag & Drop editor
│   ├── Template Manifest      # Vista de solo lectura
│   └── Template Sharing       # Landing pages públicas
├── 🚦 Trámites (Procedures)   # Gestión de expedientes y Kanban
├── 📈 Growth (Analytics)      # Métricas y lead capture
├── 📂 Documentos              # Integración Google Drive
└── ⚙️ Configuración          # Org settings, perfil
```

---

## 1. 🔐 Módulo de Autenticación

**Estado:** ✅ Implementado

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Login con email/password | ✅ | Supabase Auth |
| Logout | ✅ | Server Action en `src/actions/auth.ts` |
| OAuth callback | ✅ | `src/app/auth/callback/` |
| Auto-crear perfil | ✅ | Trigger DB al registrarse |
| Auto-crear organización | ✅ | Para usuarios sin organización |
| Session refresh | ✅ | Middleware refresca tokens expirados |
| Route protection | ✅ | Middleware protege rutas privadas |

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/middleware.ts` | Auth guard, session refresh, route protection |
| `src/actions/auth.ts` | Server Action de logout |
| `src/app/login/` | UI de login |
| `src/app/auth/` | OAuth callback handler |
| `src/lib/supabase/server.ts` | Supabase client para server |
| `src/lib/supabase/client.ts` | Supabase client para browser |

---

## 2. 📊 Módulo Dashboard

**Estado:** 🟡 Parcial (datos de demostración)

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Stats cards | 🟡 | 4 métricas (datos hardcoded de demo) |
| Vencimientos próximos | 🟡 | Tabla con deadlines (datos de demo) |
| Actividad reciente | 🟡 | Timeline de eventos (datos de demo) |
| Datos reales de Supabase | ❌ | Pendiente de implementación |

### Componentes de UI

El dashboard muestra 4 cards con colores semánticos:

| Card | Color | Significado |
|------|-------|-------------|
| Vencimientos | 🔴 Rojo | Trámites que requieren atención urgente |
| Trámites Activos | 🔵 Azul | Total de trámites en proceso |
| Nuevos Clientes | 🟢 Verde | Clientes agregados este mes |
| Atendidos Mes | 🟣 Púrpura | Productividad del mes |

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/page.tsx` | Página principal del dashboard |
| `src/app/(dashboard)/layout.tsx` | Layout: Sidebar + Header + ErrorBoundary |

---

## 3. 👥 Módulo de Clientes

**Estado:** ✅ Implementado (CRUD básico)

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Listar clientes | ✅ | Con búsqueda y filtros |
| Crear cliente | ✅ | Modal con formulario Zod-validated |
| Ver perfil | ✅ | Datos del cliente |
| Editar cliente | ✅ | Formulario con pre-fill |
| Eliminar cliente | ✅ | Con confirmación |
| Historial de trámites | ❌ | Pendiente de módulo de Procedures |
| Google Drive folder | ❌ | Campo existe, integración pendiente |

### Datos del Cliente

```typescript
interface Client {
    id: string
    organization_id: string
    full_name: string           // ← Obligatorio
    document_number: string     // DNI, Pasaporte, CE
    nationality: string
    phone: string
    email: string
    notes: string               // Notas internas del gestor
    google_drive_folder_id: string  // Para integración futura
    created_at: string
}
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/clients/page.tsx` | Lista de clientes + CRUD UI |
| `src/app/(dashboard)/clients/actions.ts` | Server Actions del módulo |
| `src/types/client.ts` | Schema Zod + tipos |

---

## 4. 📋 Módulo de Plantillas (Template Builder)

**Estado:** ✅ Implementado — **Módulo más desarrollado del sistema**

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Listar plantillas | ✅ | Tabla con TanStack Table, filtros, búsqueda |
| Crear plantilla | ✅ | Formulario completo + config panel |
| Editar plantilla | ✅ | Pre-fill con datos existentes |
| Duplicar plantilla | ✅ | Clon rápido |
| Eliminar plantilla | ✅ | Con confirmación |
| Drag & Drop steps | ✅ | @dnd-kit para reordenar pasos |
| Config panel lateral | ✅ | Honorarios, duración, categoría, renovación |
| Vista "Manifiesto" | ✅ | Solo lectura con timeline |
| Compartir (share URL) | ✅ | Landing page pública |
| Métricas de plantilla | ✅ | Vistas, leads, tasa de conversión |
| Categorías personalizadas | ✅ | CRUD de categorías |

### Tipos de Pasos

| Tipo | Icono | Uso |
|------|-------|-----|
| `document` | 📄 FileText | Recopilación de documentos |
| `payment` | 💰 DollarSign | Pagos o tasas |
| `appointment` | 📅 Calendar | Citas o entrevistas |
| `notification` | 🔔 Bell | Alertas y recordatorios |

### Configuración de Plantilla

```typescript
interface TemplateConfig {
    // Honorarios
    feesProfessional: number    // Honorarios del gestor
    feesOfficial: number        // Costos oficiales (tasas, etc.)
    currency: 'PEN' | 'USD'    // Moneda
    paymentTerms: 'upfront' | 'split_50_50' | 'on_completion'

    // Duración
    durationWork: number        // Días de trabajo activo
    durationResolution: number  // Días de espera de resolución

    // Categoría
    category: string
    isCustomCategory: boolean

    // Renovación
    requiresRenewal: boolean
    renewalFrequency: number    // Meses
}
```

### Componentes (8 archivos)

| Componente | Líneas | Responsabilidad |
|-----------|--------|----------------|
| `template-config-panel.tsx` | ~600 | **Panel lateral de configuración** — el componente más complejo. Contiene formularios de honorarios, duración, categoría, alertas de renovación |
| `templates-view.tsx` | ~400 | Vista principal: stats + tabla + acciones rápidas |
| `templates-table.tsx` | ~300 | Tabla con TanStack Table: sorting, filtros, acciones |
| `template-analytics.tsx` | ~250 | Dashboard de métricas con Recharts |
| `template-step-card.tsx` | ~200 | Card draggable para cada paso del flujo |
| `share-modal.tsx` | ~150 | Modal para generar/gestionar URL pública |
| `template-form.tsx` | ~120 | Formulario principal de crear/editar |
| `template-timeline.tsx` | ~120 | Vista timeline para el manifiesto |

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/templates/page.tsx` | Lista de plantillas |
| `src/app/(dashboard)/templates/new/` | Crear plantilla |
| `src/app/(dashboard)/templates/[id]/` | Detalle + edición |
| `src/components/templates/` | 8 componentes del builder |
| `src/types/template.ts` | Schemas Zod de plantillas |

---

## 5. 📈 Módulo Growth (Analytics & Leads)

**Estado:** ✅ Implementado

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Landing page pública | ✅ | Páginas optimizadas por plantilla compartida |
| Tracking de vistas | ✅ | Registro anónimo (device_type, timestamp) |
| Captura de leads | ✅ | Formulario público con validación Zod |
| Analytics dashboard | ✅ | Gráficos de vistas/leads (Recharts) |
| Tasa de conversión | ✅ | Leads / Vistas × 100 |
| Leads recientes | ✅ | Lista con nombre, teléfono, email |
| Redirección WhatsApp | 🟡 | Preparado en UI, integración directa pendiente |

### Flujo de Lead Capture

```
Visitante externo
    │
    ▼
Shared Template URL (/shared/[share_url])
    │
    ├──→ template_views (INSERT anónimo)
    │
    ▼
Formulario de interés
    │
    ├──→ Validación Zod (leadCaptureSchema)
    │
    ▼
template_leads (INSERT)
    │
    ├──→ Notificación al gestor (futuro: WhatsApp/Email)
    │
    ▼
Gestor ve el lead en Analytics Dashboard
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/actions/growth.ts` | Server Actions de analytics y tracking |
| `src/components/templates/template-analytics.tsx` | UI de métricas |
| `src/types/analytics.ts` | Tipos de ChartData, TemplateAnalytics |
| `src/types/lead.ts` | Schema Zod de leads |

---

## 6. 📂 Módulo de Documentos

**Estado:** 🔴 Solo esquema (tabla existe, UI no implementada)

### Diseño Planificado

Los documentos **no se almacenan en Supabase Storage**. Se integran con la API de Google Drive del cliente. La tabla `documents` almacena únicamente metadatos:

- `google_file_id`: ID del archivo en Google Drive.
- `webview_link`: URL de visualización.
- `mime_type`: Tipo de archivo.
- Relación con `client_id` y `procedure_id`.

---

## 7. ⚙️ Módulo de Configuración

**Estado:** 🔴 No implementado

### Funcionalidad Planificada

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| Perfil de usuario | Alta | Editar nombre, avatar |
| Configuración de organización | Alta | Nombre, logo, slug |
| Gestión de miembros | Media | Invitar/remover usuarios |
| Roles y permisos | Media | Admin vs member |
| Integraciones | Baja | Google Drive, WhatsApp |
| Facturación | Baja | Planes de suscripción |

---

## 8. 🎨 Módulo de UI/UX Patterns

**Estado:** ✅ Implementado

### Propósito

Sistema de patrones reutilizables para mantener consistencia visual y comportamiento en toda la aplicación.

### Funcionalidad

| Pattern | Estado | Descripción |
|---------|--------|-------------|
| Animated Success Modal | ✅ | Feedback visual con animación y auto-redirect (post-action) |
| ConfirmDialog | ✅ | Dialog de confirmación con variantes de color (pre-action) |
| useFormSuccess hook | ✅ | Hook para manejar estado de éxito en formularios |
| Variantes de color | ✅ | Emerald, Blue, Amber, Purple para diferentes contextos |
| Countdown timer | ✅ | Muestra tiempo restante antes de auto-redirect |
| Skip button | ✅ | Permite redirección inmediata sin esperar |
| Dark mode | ✅ | Soporte completo de tema oscuro |
| Accesibilidad | ✅ | Focus management, keyboard nav, screen readers |

### Componentes

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `AnimatedSuccessModal` | `src/components/ui/animated-success-modal.tsx` | Modal animado reutilizable con variantes de color (post-action) |
| `ConfirmDialog` | `src/components/ui/confirm-dialog.tsx` | Dialog de confirmación con variantes de color (pre-action) |
| `useFormSuccess` | `src/hooks/use-form-success.ts` | Hook para manejar estado de éxito en formularios |
| `useFormSuccessVariant` | `src/hooks/use-form-success.ts` | Hook avanzado con variantes de color |

### Ejemplos de Uso

**Básico - Crear recurso:**
```tsx
const { isModalOpen, setIsModalOpen, createdId, handleSuccess } = useFormSuccess()

const onSubmit = async (data) => {
    const result = await createResource(data)
    if (result.success) {
        handleSuccess(result.id)
    }
}

return (
    <AnimatedSuccessModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        redirectPath={createdId ? `/resources/${createdId}` : '/resources'}
        title="¡Recurso Creado!"
        message="El recurso se ha creado correctamente"
        variant="emerald"
    />
)
```

**Con variantes de color:**
```tsx
// Info (registro completado)
<AnimatedSuccessModal variant="blue" title="¡Registro Completo!" />

// Warning (requiere acción posterior)
<AnimatedSuccessModal variant="amber" title="¡Atención!" />

// Custom (feature premium)
<AnimatedSuccessModal variant="purple" title="¡Feature Activada!" />
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/components/ui/animated-success-modal.tsx` | Componente modal animado (post-action) |
| `src/components/ui/confirm-dialog.tsx` | Dialog de confirmación (pre-action) |
| `src/hooks/use-form-success.ts` | Hooks personalizados |
| `docs/ux-patterns.md` | Documentación completa de patrones de UX |
| `src/components/templates/template-form.tsx` | Ejemplo de implementación |

### Cuándo Usar

✅ **Usar el modal de éxito (AnimatedSuccessModal):**
- Creación de recursos (templates, clientes, categorías)
- Actualización exitosa de datos
- Procesos batch completados
- Acciones irreversibles (delete, archive) - DESPUÉS de confirmar
- Envío de formularios largos

✅ **Usar el dialog de confirmación (ConfirmDialog):**
- Antes de acciones destructivas (eliminar, archivar)
- Antes de acciones irreversibles
- Cuando se requiere confirmación explícita del usuario
- Para prevenir accidents

❌ **NO usar modales:**
- Operaciones rápidas (< 500ms) → usar toast
- Login/logout → redirección fluida sin interrupción
- Acciones que fallan → usar error boundary
- Procesos en background → usar loading state + notificación posterior
- Validaciones de formulario → usar errores inline

### Configuración

| Propiedad | Default | Descripción |
|-----------|---------|-------------|
| `autoRedirectDelay` | `2000`ms | Tiempo antes de auto-redirect |
| `buttonLabel` | `"Ir Ahora"` | Texto del botón manual |
| `redirectInfo` | `"Redirigiendo..."` | Info sobre redirección |
| `variant` | `"emerald"` | Variante de color (emerald/blue/amber/purple) |

### Accesibilidad

- ✅ Focus trap dentro del modal
- ✅ Return focus al elemento que lo abrió
- ✅ `ESC` para cerrar modal
- ✅ `ENTER` para redirección inmediata
- ✅ Screen reader announcements (DialogTitle/Description)
- ✅ Dark mode soportado
- ✅ Contraste WCAG AA (4.5:1 minimum)

---

## 9. 🚦 Módulo de Trámites (Dynamic Statuses)

**Estado:** ✅ Implementado

### Propósito

Gestionar el ciclo de vida de los expedientes (trámites) de los clientes, permitiendo una personalización total de los estados por los que pasan.

### Funcionalidad

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Kanban Board Dinámico | ✅ | Columnas generadas según estados configurados |
| CRUD de Estados | ✅ | Crear, editar, eliminar y reordenar estados |
| Asignación de Color | ✅ | Identificación visual rápida en selectores y board |
| Visualización por Color | ✅ | Las tarjetas del Kanban heredan el color del estado con un diseño degradado sutil |
| Estados Finales | ✅ | Marcar estados como "Aprobado" o "Rechazado" para cerrar ciclos |
| Drag & Drop | ✅ | Mover trámites entre columnas actualiza el estado |
| Backward Compatibility | ✅ | Soporte para estados legacy (hardcoded) si no hay configuración |


### Configuración de Estado

```typescript
interface ProcedureStatus {
    id: string
    organization_id: string
    name: string        // Nombre del estado (ej: "En Revisión")
    color: string       // Hex color (ej: "#ef4444")
    is_final: boolean   // Si es un estado terminal
    order_index: number // Orden en el Kanban
}
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/procedures/page.tsx` | Tablero Kanban principal |
| `src/components/procedures/kanban-board.tsx` | Componente de Drag & Drop |
| `src/app/(dashboard)/settings/statuses/page.tsx` | UI de configuración de estados |
| `src/app/(dashboard)/settings/statuses/actions.ts` | Server Actions para CRUD de estados |
| `src/types/procedure-status.ts` | Interfaces TypeScript |
