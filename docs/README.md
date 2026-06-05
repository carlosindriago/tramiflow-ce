# 📖 TramiFlow CRM — Documentación Técnica

> **Versión:** 0.1.0 (MVP) · **Última actualización:** 2026-02-11  
> **Estado:** En desarrollo activo · **Licencia:** Privada

---

## 📑 Índice de Documentación

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](./architecture.md) | Stack tecnológico, estructura de carpetas, patrones de diseño y decisiones arquitectónicas |
| [Base de Datos](./database.md) | Esquema completo, tablas, relaciones, RLS policies, migraciones e índices |
| [Desarrollo](./development.md) | Guía de setup, convenciones de código, Git flow, TDD y workflows |
| [Seguridad](./security.md) | Autenticación, autorización, RLS, validación de inputs y buenas prácticas |
| [Módulos](./modules.md) | Descripción detallada de cada módulo funcional del sistema |
| [Roadmap](./roadmap.md) | Estado actual del proyecto, lo que se ha completado y plan a futuro |

---

## 🎯 Visión del Producto

**TramiFlow CRM** es un **SaaS B2B multi-tenant** diseñado para **gestores migratorios en Perú**. Resuelve el problema de desorganización, multas por vencimientos y el uso desconectado de herramientas (Excel, WhatsApp) que sufren estos profesionales.

### Propuesta de Valor

```
┌─────────────────────────────────────────────────────┐
│  PROBLEMA                  →   SOLUCIÓN             │
├─────────────────────────────────────────────────────┤
│  Trámites en Excel         →   CRM centralizado     │
│  Alertas manuales          →   Alertas automáticas   │
│  Docs en carpetas locales  →   Google Drive integrado│
│  Clientes por WhatsApp     →   Lead capture público  │
│  Sin métricas              →   Dashboard analytics   │
└─────────────────────────────────────────────────────┘
```

### Usuario Objetivo

- **Perfil:** Gestor migratorio independiente o firma pequeña (1-10 personas).
- **Nivel técnico:** No técnico — la UX debe ser "click-less" y drag & drop.
- **Contexto:** Trabaja desde oficina o móvil, necesita acceso rápido a estados de trámites.

### Principios de UX

| Principio | Implementación |
|-----------|---------------|
| **Dark Mode Enterprise** | Tema oscuro por defecto con colores semánticos |
| **Click-less** | Acciones rápidas, mínimos pasos para tareas comunes |
| **Mobile First** | Responsive design, componentes optimizados para touch |
| **Drag & Drop** | Builder de plantillas con @dnd-kit |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Runtime** | React | 19.2.3 |
| **Lenguaje** | TypeScript (Strict) | 5.x |
| **Estilos** | Tailwind CSS + Shadcn/UI | 4.x |
| **Backend** | Supabase (Auth, Postgres, RLS) | 2.95.3 |
| **Estado Cliente** | TanStack React Query | 5.x |
| **Formularios** | React Hook Form + Zod | 7.x / 4.x |
| **Drag & Drop** | @dnd-kit | 6.x |
| **Charts** | Recharts | 3.x |
| **Animaciones** | Framer Motion | 12.x |
| **Iconos** | Lucide React | - |
| **Notificaciones** | Sonner | 2.x |

---

## 🚀 Quick Start

```bash
# 1. Clonar
git clone <repo-url>
cd tramiflow-crm

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar con credenciales de Supabase

# 4. Servidor de desarrollo
npm run dev
# → http://localhost:3000
```

> 📌 Ver [development.md](./development.md) para la guía completa de configuración.

---

## 📁 Vista Rápida de la Estructura

```
tramiflow-crm/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Layout group: sidebar + header
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── clients/        # Módulo de clientes
│   │   │   └── templates/      # Módulo de plantillas
│   │   ├── api/                # Route Handlers (auth, categories)
│   │   ├── auth/               # Auth callback
│   │   ├── login/              # Página de login
│   │   └── shared/             # Páginas públicas (lead magnets)
│   ├── actions/                # Server Actions (auth, categories, growth)
│   ├── components/             # Componentes React
│   │   ├── ui/                 # 28 componentes Shadcn/UI
│   │   ├── templates/          # 8 componentes del template builder
│   │   └── layout/             # Sidebar, Header, etc.
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilidades core
│   │   └── supabase/           # Clientes Supabase (server + browser)
│   └── types/                  # TypeScript interfaces y schemas Zod
├── supabase/
│   └── migrations/             # 6 migraciones SQL aplicadas
├── docs/                       # 📖 Esta documentación
└── .agent/                     # Configuración de agentes AI
    ├── rules/                  # Reglas de desarrollo
    ├── skills/                 # Skills especializados
    └── workflows/              # Workflows automatizados
```

> 📌 Ver [architecture.md](./architecture.md) para detalles completos de la estructura y patrones.
