# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Kanban Board (Trámites):** Eliminadas las barras de scroll horizontales duplicadas. Ahora solo existe una barra interna para desplazarse entre columnas.
- **Kanban Board (Trámites):** Implementado **Optimistic UI con Revert Real**. En caso de error en el servidor o pérdida de conexión, el tablero vuelve automáticamente a su estado anterior para garantizar integridad visual y de datos.
- **Kanban Board (Trámites):** Eliminados los `toast.success` redundantes en acciones de Drag & Drop y menús de estado para una experiencia más fluida y profesional ("Quiet UI").
- **Server Actions (Procedures):** Eliminado `revalidatePath` en la actualización de estados, reduciendo la latencia percibida en ~400ms al evitar refetching innecesario del servidor.
- **Kanban Board (Trámites):** Corregido el fondo roto/inconsistente causado por `bg-transparent` en el layout. Ahora usa una superficie oscura consistente (`bg-slate-950/80`).
- **Kanban Board (Trámites):** Eliminado el botón "Nuevo Trámite" duplicado dentro del tablero (se mantiene el del Header).
- **Kanban Board (Trámites):** Rediseño de columnas con estilo glassmórfico premium (`bg-slate-900/50`, `backdrop-blur-sm`, bordes sutiles, separadores con gradiente).
- **Dashboard Layout:** Movido el padding (`p-4 md:p-6`) del layout global a cada página individual para permitir que páginas como el Kanban controlen su propio espaciado.
- **Kanban Board (Trámites):** Reducido el ancho de columnas un 20% (280px → 225px) para mostrar más columnas visibles simultáneamente.
- **Scrollbars Globales:** Estilos premium para barras de desplazamiento en todo el sitio — delgadas (6px), translúcidas, con esquinas redondeadas y efecto hover sutil. Compatible con Chrome, Safari, Edge y Firefox.

### Changed
- **Super Admin Panel UI Redesign (Command Vault):**
    - Rediseño completo de la interfaz de administración siguiendo estándares SaaS Enterprise.
    - Nuevo Sidebar de navegación vertical que reemplaza el TopNav, usando esquema monocromo y opacidades.
    - KPIs numéricos con tipografía `font-mono tabular-nums` e indicadores LED semánticos (verde, rojo, ambar).
    - Tablas de datos optimizadas (`overflow-x-auto min-w-[900px]`) para máxima legibilidad.
    - Badges re-estilizados usando transparencias (fondo 10%, borde 20%) en lugar de colores sólidos.
    - Extracción de acciones primarias ("Verificar", "Hacer PRO", "Corregir Perfil") fuera de menús ocultos, ahora disponibles directamente con un clic en la tabla.

### Added
- **Dynamic Plans & Smart Limits:**
    - Esquema de planes de suscripción dinámicos (`subscription_plans`) en BD con límites customizables (`max_clients`, `max_procedures`, `max_storage_mb`, `grace_allowance`).
    - API centralizada de límites (`src/lib/limits.ts`) con bloqueo estricto (Server Actions) al crear Recursos (Clientes/Trámites) si se supera el límite de gracia.
    - Componente `<RenewalCard />` (Hook de conversión) en el Sidebar: muestra avisos de expiración en los últimos 5 días o llamados a la acción (CTAs) de Upgrade para cuentas gratuitas.
    - Hook de React (`useLimits`) para exponer el uso en tiempo real en la vista cliente.
    - Panel de administración de Planes (`/admin/plans`) para gestionar dinámicamente las cuotas.
- **Super Admin Panel (RBAC):**
    - Nueva sección `/admin` protegida a nivel de base de datos via tabla `app_admins`.
    - Sistema de 3 roles: `super_admin`, `support`, `analyst` con políticas RLS diferenciadas.
    - Dashboard de KPIs financieros (solo `super_admin`) y actividad de uso (todos los roles).
    - Página de gestión de organizaciones (`/admin/orgs`): tabla paginada con búsqueda, badges de plan/estado, y menú de acciones por fila.
    - Acciones de gestión: Activar PRO, Extender Trial, Bajar a Free, Banear organización.
    - Página de Analytics (`/admin/analytics`): Bar chart de top herramientas, Line chart de tendencia 30 días, tabla de orgs más activas.
    - Gestión de equipo (`/admin/settings/team`): agregar/remover admins por User ID y rol (`super_admin` únicamente).
    - Server Actions con `requireAdmin(minRole)` helper para RBAC en backend.
- **Telemetría (Analytics Internos):**
    - Tabla `usage_logs` con RLS: usuarios insertan, admins leen.
    - API Route `POST /api/analytics/track` — fire-and-forget, responde `202 Accepted`.
    - Hook `useAnalytics()` con `trackEvent(name, data?)` para usar en cualquier componente.
    - Evento `tool_ocr_success` integrado en `SmartScannerDialog`.
- **Usuarios Online (Admin KPI):**
    - Columna `last_seen_at timestamptz` en `profiles` con índice para queries rápidas.
    - API Route `POST /api/heartbeat` — actualiza `last_seen_at` del usuario autenticado.
    - Hook `useHeartbeat()` — hace ping cada 5 minutos desde el dashboard de usuarios.
    - `HeartbeatProvider` — componente client mínimo integrado en el dashboard layout.
    - `OnlineUsersKPI` — tarjeta clickable en el admin con punto verde pulsante, polling cada 30 segundos, y panel slide-over con listado de usuarios activos (avatar, nombre, org, tiempo de última actividad).

- **Subscripciones (`organizations`):**
    - Nuevos campos: `plan_tier` (enum `free|pro`), `status` (enum `active|trialing|past_due|canceled`), `trial_ends_at`, `subscription_ends_at`.
- **Facturación (UI):**
    - Nueva página `/settings/billing` con tarjeta de estado de suscripción, días restantes, y alerta de vencimiento.
    - Modal de pago Yape/Plin: número a copiar, input de **Número de Operación**, y botón que abre WhatsApp con mensaje pre-armado.
    - Card de acceso a Facturación desde `/settings`.
- **PDF Kit (Herramientas):**
    - Nueva sección "Herramientas" en el sidebar con acceso a PDF Kit.
    - **Compresor PDF:** Reduce el peso de documentos renderizando páginas a canvas y re-creando como JPEG con calidad ajustable.
    - **Imágenes a PDF:** Convierte múltiples JPG/PNG en un solo PDF A4 con Drag & Drop para reordenar y selector de orientación.
    - **Unir PDFs:** Combina múltiples PDFs en uno solo con reordenamiento Drag & Drop usando `pdf-lib`.
    - Procesamiento 100% client-side (sin subir archivos al servidor).
    - Barras de progreso y comparación de tamaño (Original vs Optimizado).
- **PDF Tools Contextual (Panel de Trámites):**
    - Multi-select en DocumentGrid con checkboxes y toolbar flotante contextual.
    - `ImagesToPdfDialog`: nombre personalizado, layout (individual/collage), 3 tiers de optimización (Alta/Equilibrada/Ligero), guardado automático en Supabase.
    - `MergePdfsDialog`: descarga PDFs seleccionados y los pre-carga en el merger.
    - `PdfCompressorDialog`: compresión inline en SmartDropzone (reemplaza link a ilovepdf.com).
    - Drag & Drop para reordenar imágenes con `@dnd-kit`.
- **Document Tools (Advanced):**
    - **Download Format Menu:** Dropdown para descargar imágenes como Original, JPG, PNG o PDF (1 página).
    - **PDF Optimization:** Opción directa "Optimizar y descargar" para PDFs.
    - **OCR Smart Scanner:** Herramienta interactiva para recortar y extraer texto de imágenes usando `Tesseract.js` (lazy loaded).
    - **Privacy Badges:** Indicadores visuales de procesamiento local.
    - **File Badges:** Etiquetas de color para extensiones de archivo en miniaturas.

- **Start Page:** Rediseño completo de la página de inicio con acceso rápido a herramientas y resumen de estado.

### Added
- **Pagos & QR (Mejoras):**
    - **Soporte QR:** Ahora se pueden subir imágenes de códigos QR para Yape y Plin desde el panel de administración.
    - **Privacidad:** Opción para ocultar el número de teléfono en las modales de pago (mostrar solo QR).
    - **Configuración Bancaria:** Separación de campos "Nombre del Banco" y "Titular" para mayor claridad en las instrucciones de transferencia.
    - **Plin:** Agregado campo "Titular" para la configuración de Plin.

## [0.2.0] - 2026-02-18

### Added
- **Template Sharing (Growth):**
    - Public Template Pages (`/templates/share/[token]`) with premium UI.
    - `ShareModal` for managing visibility (Private, Public, Restricted).
    - Import flow allowing users to clone templates to their own organization.
- **Customer Experience (CX):**
    - Public Status Page (`/status/[tracking_id]`) for clients to track procedure progress in real-time.
    - Visual progress bar and requirements checklist.
- **Retention (Expiration Alerts):**
    - Automated Cron Job (`/api/cron/check-expirations`) to detect expiring procedures.
    - Notification system for managers (30, 15, 7 days before expiration).
- **Analytics:**
    - "Template Clones" tracking to see who is using your shared templates.
    - Geographic tracking of clones (Country based on IP).
- **Public Settings:**
    - Granular control over public template data (Show/Hide Fees, Requirements, Allow Copy).

### Changed
- **UI/UX Overhaul:**
    - **Dark Theme:** Implemented a unified "Premium Dark" aesthetic across the entire app.
    - **Glassmorphism:** Applied to Sidebar, Header, and Cards for a modern feel.
    - **Vertical Timeline:** Replaced simple steps list with a connected timeline component.
- **Performance (Supabase):**
    - **Indexes:** Added missing foreign key indexes to 10+ tables (documents, leads, procedures, etc.).
    - **RLS Optimization:** Rewrapped `auth()` calls in `SELECT` subqueries to prevent per-row performance degradation.
    - **Security:** Hardened function search paths (`SET search_path = public`).

### Fixed
- **Dashboard Background:** Resolved issue where background color cut off on scroll.
- **Vercel Build:** Fixed `cron/check-expirations` build failure by moving Supabase client initialization to runtime.


### Added
- **Website Builder:** Implementada la vista previa multi-dispositivo (Galaxy S20 y Escritorio) para validar diseños en tiempo real.
- **Website Builder:** Integración con TikTok en el pie de página y esquema de la base de datos.
- **Public Profile:** Refactorización completa del motor de renderizado (`PublicProfileRenderer`) para unificar la vista del dashboard y la página pública.
- **Public Profile:** Nuevos layouts de diseño: "Alto Impacto" (Hero Focused) y "Link en Bio" (Simple Bio).
- **Public Profile:** Badges editables y personalizables desde el constructor.
- **Procedures:** Implementación de tarjetas dinámicas en el Kanban Board. Ahora cada tarjeta hereda el color de su estado con un diseño moderno y sutil degradado.


### Fixed
- **Website Builder:** Corrección de posicionamiento del botón flotante "Contáctanos" en la vista previa móvil.
- **Website Builder:** Eliminación de información duplicada en el encabezado de edición.
- **Clients:** Corrección de errores de seguridad (RLS) al crear clientes, migrando la validación de `profiles` a `organization_members`.
- **Clients UI:** Mejora de contraste en botones de acción (texto blanco sobre fondo verde).
- **Dashboard:** Eliminación de contador hardcodeado en notificaciones. Ahora muestra feedback interactivo al hacer clic.
- **Security:** Actualización de políticas RLS para `procedures`, `categories`, `documents` y `procedure_templates` para usar autenticación basada en organización.
- **Public Page:** Reparado error de acceso asíncrono a `params` (Breaking Change Next.js 15).
- **Website Builder:** Añadido manejo de errores para detectar fallos silenciosos por permisos RLS.
