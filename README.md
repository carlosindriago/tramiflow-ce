# TramiFlow CRM

<div align="center">
  <p><strong>Open Core SaaS CRM for Immigration Procedures & Workflows</strong></p>
  <a href="https://tramiflow-demo.vercel.app"><strong>🔴 Live Demo</strong></a> | 
  <a href="#-core-vs-pro"><strong>Core vs PRO</strong></a> | 
  <a href="#-self-hosting-with-docker"><strong>Self-Hosting</strong></a>
</div>

<br/>

![No server uploads](https://img.shields.io/badge/PDF_Kit-No_server_uploads-success?style=for-the-badge)
![Security Audit](https://img.shields.io/badge/Security_Audit-Passed-blue?style=for-the-badge)
![AI Assisted](https://img.shields.io/badge/AI_Assisted-JARVIS_Workflow-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-AGPL%203.0-green?style=for-the-badge)

TramiFlow is a robust, multi-tenant CRM built with Next.js 14, Supabase (PostgreSQL + RLS), Shadcn/UI, and Tailwind CSS. It features dynamic Kanban boards, a visual Template Builder, and a powerful client-side PDF optimization kit.

## 📸 Screenshots

| Enterprise Dashboard | Client & Document Management |
| :---: | :---: |
| <img src="docs/design/tramiflow_enterprise_dashboard.png" width="400"/> | <img src="docs/design/client_detail_-_document_management.png" width="400"/> |

| Procedure Template Builder | Secure Google Access |
| :---: | :---: |
| <img src="docs/design/procedure_template_builder.png" width="400"/> | <img src="docs/design/login_-_secure_google_access.png" width="400"/> |

---

## 🏗️ Architecture

```mermaid
graph TD
    Client[Client App - Next.js App Router]
    ServerActions[Server Actions]
    SupabaseAuth[Supabase Auth]
    SupabaseDB[(Supabase PostgreSQL)]
    
    Client -->|API Calls & Mutations| ServerActions
    Client -->|Authentication| SupabaseAuth
    ServerActions -->|RLS Protected Queries| SupabaseDB
    
    subgraph Multi-Tenant Architecture
    SupabaseDB -.-> |Row Level Security| OrgA[Organization A Data]
    SupabaseDB -.-> |Row Level Security| OrgB[Organization B Data]
    end
```

### Advanced Hard & Soft Limits Architecture

Our Server Actions intercept resource consumption and enforce Grace Allowances for subscription limits:

```mermaid
flowchart TD
    Request[User Action] --> CheckLimit{Check Org Limits}
    CheckLimit -->|Below Limit| Allow[Allow Action]
    CheckLimit -->|Exceeds Soft Limit| Grace{In Grace Allowance?}
    Grace -->|Yes| Warn[Allow & Send Warning]
    Grace -->|No| Block[Block Action - Upgrade Required]
```

## 🔐 Security Audit & RLS

TramiFlow adheres to strict SaaS security standards. A comprehensive internal security audit was completed ensuring:
- **Strict Row-Level Security (RLS)**: All tables are fortified. Queries without an `organization_id` context will fail or return no data.
- **Private Storage**: All document buckets (`client-docs`) are strictly private and utilize signed URLs.
- **Server-Side Enforcement**: Limits, billing, and structural data are verified server-side, never trusting the client state.

## 🤖 AI-Assisted Development Workflow

TramiFlow uses the **JARVIS Protocol**, an AI-assisted Pull Request workflow that handles atomic commits, multi-tenancy verification, and automated PR generation. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how we orchestrate AI agents for code delivery.

---

## 💎 Core vs PRO

TramiFlow operates on an Open Core model. See [OPEN_CORE.md](./OPEN_CORE.md) for details.

| Module | Community Edition (Open Core) | PRO Edition (SaaS) |
|---|---|---|
| **Gestión de Clientes** | 🟢 Perfiles, historial, documentos | - |
| **Kanban de Trámites** | 🟢 Estados dinámicos configurables | - |
| **Template Builder** | 🟢 Flujos de trabajo básicos | 🟡 Constructor Avanzado |
| **PDF Kit** | 🟢 6 herramientas client-side | - |
| **Smart Documents** | 🟡 Validación básica | 🟢 Auto-optimización |
| **Suscripciones** | 🔴 No disponible | 🟢 Hard/Soft Limits |
| **Growth & Leads** | 🔴 No disponible | 🟢 Analytics, WhatsApp |

---

## 🛠️ Self-Hosting with Docker

TramiFlow can be self-hosted. 

**Prerequisites:**
- Docker & Docker Compose
- A Supabase Project (Cloud or Self-Hosted)

**1. Clone and configure environment:**
```bash
git clone https://github.com/yourusername/tramiflow.git
cd tramiflow/tramiflow-crm
cp .env.example .env.local
```
*Fill in your Supabase keys in `.env.local`.*

**2. Build and run via Docker Compose:**
```bash
# Create a docker-compose.yml (provided in repo root or add your own)
docker-compose up -d --build
```
The application will be available at `http://localhost:3000`.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + Tailwind CSS
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Image Processing**: `browser-image-compression` + Canvas API (Client-side)

## 📄 License

This repository is dual-licensed depending on the module. The Open Core components are licensed under the **AGPL-3.0 License**, ensuring that any modifications used as a service must be shared back to the community.
