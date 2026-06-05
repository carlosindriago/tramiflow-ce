# 🏗️ TRAMIFLOW CE - CONTEXTO MAESTRO

## 🎯 VISIÓN DEL PRODUCTO
SaaS B2B para gestores migratorios en Perú.
- **Problema:** Desorganización, multas por vencimientos, uso de Excel/WhatsApp desconectados.
- **Solución:** CRM Multi-tenant con alertas automáticas, integración con Google Drive (archivos del cliente) y WhatsApp.
- **Usuario:** Gestor migratorio (No técnico).
- **UX:** Dark Mode Enterprise, "Click-less", Drag & Drop desde WhatsApp Web.

## 🛠️ TECH STACK (NO NEGOCIABLE)
- **Framework:** Next.js 15 (App Router).
- **Lenguaje:** TypeScript 5.x (Strict Mode).
- **Estilos:** Tailwind CSS 4 + Shadcn/ui (`npx shadcn@latest`).
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime).
- **Estado:** React Query (@tanstack/react-query).
- **Validación:** Zod + React Hook Form.
- **Testing:** Vitest (Unit), Playwright (E2E).

## 📐 ARQUITECTURA DE DATOS (SUPABASE)
- **Multi-tenancy:** OBLIGATORIO. Todas las tablas tienen `organization_id`.
- **Seguridad:** RLS (Row Level Security) activado en todas las tablas.
- **Storage:** No usamos Supabase Storage para docs finales, usamos la API de Google Drive del cliente.

## 🎨 DISEÑO UI (SHADCN + TAILWIND)
- **Tema:** Dark Mode por defecto (`class="dark"`).
- **Colores Semánticos:**
  - 🔴 Rojo: Vencimiento/Crítico.
  - 🔵 Azul: Trámite Activo.
  - 🟢 Verde: Nuevo Cliente / WhatsApp.
  - 🟣 Púrpura: Productividad/Éxito.
- **Componentes:** Usar siempre componentes de `@/components/ui` antes de crear nuevos.

## 🧪 FILOSOFÍA DE DESARROLLO
1. **TDD First:** Escribe el test (Vitest) antes que el componente.
2. **Mobile First:** Todo debe funcionar en móvil.
3. **KISS:** Mantén los componentes pequeños (< 200 líneas).