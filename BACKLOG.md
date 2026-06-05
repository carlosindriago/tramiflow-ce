# TramiFlow Backlog

## 🎯 Sprint Actual: Sprint 1 (Marzo 2026)

### TRAMI-006 ✅ - PRIORIDAD CRÍTICA
**Title**: Hotfix Producción - Hydration Error y Login Email/Password

**Description**:
- Resolver el "Hydration Error" en /login page (Resuelto: cambio de useState a useEffect para montaje)
- Investigar y fixear por qué el login Email/Password falla en Vercel pero funciona en Localhost (Mejorados los esquemas de validación Zod y types)
- Verificar que Server Actions responden correctamente en producción (Casteos type-safe añadidos)

**Priority**: CRITICAL
**Status**: Completed - Deployed to production

---

### TRAMI-007 (Pending) - PRIORIDAD ALTA
**Title**: Settings & Profile - Gestión de Usuario

**Description**:
- Implementar página de edición de perfil de usuario
- Editar nombre y foto de perfil
- Cambio de contraseña
- Preferencias de usuario (timezone, idioma)

**Priority**: High
**Status**: Pending

---

### TRAMI-008 (Pending) - PRIORIDAD MEDIA
**Title**: Búsqueda Global - Command Palette

**Description**:
- Implementar Command Palette (Cmd+K / Ctrl+K)
- Buscar clientes por nombre, documento, email
- Buscar trámites por nombre, estado
- Navegación rápida entre páginas

**Priority**: Medium
**Status**: Pending

---

### TRAMI-009 (Pending) - PRIORIDAD MEDIA
**Title**: Refactor Trámites - Procesos vs Archivo

**Description**:
- Renombrar vista Kanban actual a "Procesos" (solo trámites activos)
- Crear nueva vista/pestaña "Archivo" para trámites finalizados
- Formato de lista/tabla para el histórico
- Separar trámites activos de completados

**Priority**: Medium
**Status**: Pending

---

## 🚀 Post-MVP / Backlog Futuro

### Seguridad
- [ ] Multi-Factor Authentication (MFA) opcional
- [ ] Sesiones activas (ver dispositivos conectados)
- [ ] Log de auditoría de acciones
- [ ] Rate limiting en login

### Funcionalidades
- [ ] Notificaciones de trámites próximos a vencer
- [ ] Exportación PDF/Excel de clientes y trámites
- [ ] Plantillas de documentos mejoradas
- [ ] Dashboard con métricas avanzadas
- [ ] Integración con más APIs de documentos

### Técnico
- [ ] Unit tests para Server Actions
- [ ] Integration tests para CRUDs
- [ ] E2E tests con Playwright
- [ ] Monitoreo y alertas (Sentry)

---

## ✅ Completados

### TRAMI-005 ✅
**Title**: Autenticación Email/Password

**Description**:
- Formulario de login con email/password
- Formulario de registro
- Recuperación de contraseña
- Server Actions con validación Zod
- Security hardening (generic errors, max input lengths)

**Status**: Completed - Deployed to production

---

### TRAMI-003 ✅
**Title**: Fix Client Creation & Multiple IDs

**Description**:
- Fix Dialog accessibility
- Fix Error 500 (checkLimit plan)
- Add JSONB identifications column
- Dynamic ClientForm with multiple IDs

**Status**: Completed - Deployed to production

---

### TRAMI-002 ❌ (Cancelled)
**Title**: middleware.ts → proxy.ts - REVERTED

**Status**: Cancelled - Was a hallucination

---

### TRAMI-001 ✅
**Title**: Optimización de bundle PDF/OCR

**Status**: Completed
