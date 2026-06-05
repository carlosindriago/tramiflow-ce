# 🗺️ Roadmap — Estado Actual y Plan Futuro

> Última actualización: 2026-02-11 · Versión: 0.1.0 (MVP)

---

## Estado General del Proyecto

```
████████████░░░░░░░░  ~35% del MVP completado
```

| Métrica | Valor |
|---------|-------|
| Módulos funcionales | 4 de 7 |
| Tablas de BD | 8 creadas, todas con RLS |
| Migraciones aplicadas | 6 |
| Componentes UI | ~40 (28 Shadcn + 8 Templates + layout + common) |
| Server Actions | 3 (auth, categories, growth) |

---

## 1. Lo que YA está construido ✅

### 🔐 Autenticación Completa
- [x] Login/Logout con Supabase Auth
- [x] Middleware con session refresh automático
- [x] Route protection (rutas públicas vs privadas)
- [x] Auto-creación de perfil al registrarse (trigger DB)
- [x] Auto-creación de organización para usuarios nuevos
- [x] OAuth callback handler

### 📋 Template Builder (Módulo Core)
- [x] CRUD completo de plantillas
- [x] Constructor visual con Drag & Drop (@dnd-kit)
- [x] 4 tipos de pasos: documento, pago, cita, notificación
- [x] Panel de configuración lateral (honorarios, duración, categoría)
- [x] Vista "Manifiesto" de solo lectura con timeline
- [x] Compartir plantilla con URL pública
- [x] Duplicar plantillas
- [x] Categorías personalizadas (CRUD)
- [x] Tabla de plantillas con TanStack Table (filtros, sorting, búsqueda)
- [x] Términos de pago configurable (upfront, 50/50, on completion)
- [x] Alertas de renovación (frecuencia configurable)

### 👥 Gestión de Clientes
- [x] CRUD básico de clientes
- [x] Validación de datos con Zod
- [x] Búsqueda y filtros

### 📈 Growth & Analytics
- [x] Landing pages públicas por plantilla
- [x] Tracking de vistas (anónimo, por dispositivo)
- [x] Captura de leads (formulario público con validación)
- [x] Dashboard de analytics (Recharts)
- [x] Tasa de conversión (views → leads)

### 🏗️ Infraestructura
- [x] Multi-tenancy con RLS en todas las tablas
- [x] Supabase SSR (server + browser clients)
- [x] Error Boundary global con UI de fallback
- [x] Rate limiting para API routes
- [x] Sistema de notificaciones (Sonner)
- [x] Dark Mode por defecto
- [x] Responsive layout (Sidebar + Header)
- [x] Tipos auto-generados de Supabase

---

## 2. Lo que FALTA para el MVP 🟡

### Fase 1: Core Business Logic (Prioridad Alta)

#### 📋 Módulo de Trámites (Procedures)
> El corazón del CRM — instancias activas de trámites asignados a clientes.

- [ ] **Vista de trámites activos** — Lista con filtros por estado, cliente, urgencia
- [ ] **Crear trámite** — Seleccionar cliente + plantilla → generar instancia
- [ ] **Seguimiento por pasos** — Progress tracker vinculado a los steps de la plantilla
- [ ] **Estados del trámite** — Pendiente → En proceso → Esperando cliente → Completado → Cancelado
- [ ] **Fechas y deadlines** — Cálculo automático basado en `duration_work` + `duration_resolution`
- [ ] **Alertas de vencimiento** — Visual (badge rojo) + potencial email/push
- [ ] **Notas por trámite** — Historial de observaciones del gestor

> **DB:** La tabla `procedures` ya existe con schema definido. Solo necesita UI + Server Actions.

#### 📊 Dashboard con Datos Reales
- [ ] **Conectar stats** al data real de Supabase (actualmente datos de demo)
- [ ] **Vencimientos próximos** desde `procedures.due_date`
- [ ] **Actividad reciente** desde logs de cambios (requiere nueva tabla o Supabase Realtime)
- [ ] **Métricas dinámicas** — Nuevos clientes/mes, trámites completados, etc.

### Fase 2: Integraciones (Prioridad Media)

#### 📱 Integración WhatsApp
- [ ] **Botón "Contactar por WhatsApp"** en cada lead capturado
- [ ] **URL pre-formateada** con datos del lead (`wa.me/numero?text=...`)
- [ ] **Templates de mensaje** personalizables por tipo de trámite
- [ ] **Drag & Drop desde WhatsApp Web** (investigar viabilidad técnica)

#### 📂 Integración Google Drive
- [ ] **Conectar OAuth de Google** — Obtener permisos de Drive API
- [ ] **Crear carpeta por cliente** automáticamente
- [ ] **Subir documentos** desde el CRM hacia la carpeta del cliente
- [ ] **Listar documentos** del cliente desde Google Drive
- [ ] **Preview de documentos** inline (webview)

### Fase 3: UX & Polish (Prioridad Media)

#### 🔔 Sistema de Alertas
- [ ] **Alertas por vencimiento** — Automáticas basadas en due_date
- [ ] **Alertas de renovación** — Basadas en `requires_renewal` + `renewal_frequency`
- [ ] **Centro de notificaciones** — Panel con historial de alertas
- [ ] **Email notifications** — Opcional (Supabase Edge Functions + Resend/SendGrid)

#### 🔍 Búsqueda Global
- [ ] **Command palette** (⌘K) — Buscar clientes, trámites, plantillas
- [ ] **Full-text search** — PostgreSQL `tsvector` para búsquedas avanzadas

#### 📱 Mobile Experience
- [ ] **PWA** — Instalable como app en móvil
- [ ] **Touch-optimized** — Gestos swipe en tablas
- [ ] **Offline support** — Service Worker para acceso básico sin conexión

---

## 3. Futuro Post-MVP 🔮

### Funcionalidades Avanzadas

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| **Multi-idioma** | Soporte i18n (español, portugués, inglés) | Media |
| **Reportes PDF** | Exportar estado de trámites como PDF | Media |
| **Calendar view** | Vista de calendario con deadlines | Media |
| **Kanban board** | Vista kanban de trámites por estado | Media |
| **Bulk operations** | Acciones masivas en tablas | Baja |
| **Activity log** | Auditoría de todas las acciones | Media |
| **Roles granulares** | Permisos diferenciados owner/admin/member | Alta |
| **Multi-org** | Un usuario en múltiples organizaciones | Alta |
| **API pública** | REST API para integraciones externas | Alta |
| **Webhooks** | Notificaciones a servicios externos | Media |
| **Supabase Realtime** | Actualizaciones en tiempo real entre usuarios | Media |
| **Facturación** | Integración con Stripe/MercadoPago | Alta |
| **Onboarding wizard** | Guía paso a paso para nuevos usuarios | Baja |

### Mejoras Técnicas

| Mejora | Impacto | Prioridad |
|--------|---------|-----------|
| **Testing completo** | Vitest + Playwright para E2E | Alta |
| **CI/CD pipeline** | GitHub Actions: lint, test, build, deploy | Alta |
| **Monitoring** | Sentry para errores en producción | Media |
| **Performance** | Lighthouse audit, bundle optimization | Media |
| **Supabase Edge Functions** | Background jobs (emails, crons) | Media |
| **Database indexes audit** | Revisar queries lentas, añadir índices | Media |

---

## 4. Prioridades Inmediatas

Las siguientes tareas son las **próximas en la cola** de desarrollo:

```
 PRIORIDAD 1 (Próximo sprint)
 ─────────────────────────────
 □ Módulo de Trámites (Procedures) — UI + Server Actions
 □ Dashboard con datos reales de Supabase
 □ Tests unitarios para Server Actions existentes

 PRIORIDAD 2 (Siguiente sprint)
 ─────────────────────────────
 □ Integración WhatsApp (botón + URL pre-formateada)
 □ Sistema de alertas (vencimientos + renovaciones)
 □ Búsqueda global (⌘K)

 PRIORIDAD 3 (Backlog)
 ─────────────────────────────
 □ Google Drive integration
 □ Roles granulares
 □ CI/CD pipeline
 □ PWA
```

---

## 5. Registro de Cambios (Changelog Resumido)

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-02-11 | 0.1.0 | Template Builder completo, Growth Analytics, Client CRUD, Auth |
| 2026-02-10 | 0.0.1 | Core tables migration, middleware, proyecto base |
