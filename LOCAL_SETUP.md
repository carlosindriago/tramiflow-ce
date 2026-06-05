# TramiFlow - Setup de Desarrollo Local

Esta guía te permite ejecutar TramiFlow localmente con Supabase en Docker.

## 🐋 Prerrequisitos

- Docker Desktop instalado
- Docker Compose instalado
- 8GB+ RAM recomendado
- Node.js 20+

## 🚀 Inicio Rápido

### 1. Clonar el Repo (si no lo tienes)
```bash
git clone https://github.com/carlosindriago/tramiflow-ce.git
cd tramiflow-ce
```

### 2. Instalar Dependencias
```bash
npm install
# o
pnpm install
# o
yarn install
```

### 3. Configurar Variables de Entorno

Crea `.env.local` con las credenciales de Supabase:
```bash
# Obtén estas de: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-anon-key-publica
```

### 4. Iniciar Supabase Local con Docker

```bash
# Opción A: Usar Docker (recomendado)
docker run -d \
  --name tramiflow-supabase \
  -p 54321:54321 \
  -e POSTGRES_PASSWORD=your-password \
  -v $PWD/data/supabase:/var/lib/postgresql/data \
  supabase/local:latest

# Opción B: Usar Supabase CLI (más fácil)
npx supabase init
npx supabase start
```

### 5. Ejecutar Migraciones SQL

Una vez Supabase local corriendo:

**Por CLI:**
```bash
npx supabase db execute --file supabase/migrations/20260220_create_organizations.sql
npx supabase db execute --file supabase/migrations/20260221_create_branding_bucket.sql
```

**Por Dashboard Local:**
1. Entra a: http://localhost:54323
2. Credentials: `admin` / `your-password`
3. SQL Editor → New Query
4. Copia y ejecuta las migraciones

### 6. Iniciar Desarrollo

```bash
npm run dev
# Abre: http://localhost:3000
```

## ✅ Verificación

Una vez todo corriendo:

1. **Supabase Local:** http://localhost:54323
2. **TramiFlow:** http://localhost:3000
3. **Probar flujo:**
   - Registrar nuevo usuario
   - Iniciar sesión
   - Debería redirigir a `/onboarding`
   - Crear organización
   - Subir logo
   - Entrar al dashboard
   - Verificar TeamSwitcher muestra la organización

## 📁 Estructura de Datos

### Tablas

**organizations:**
| id | name | slug | logo_url | plan | created_by |
|----|------|------|----------|------|------------|
| UUID | text | text | text | text | UUID |

**organization_members:**
| id | organization_id | user_id | role |
|----|---------------|---------|------|
| UUID | UUID | UUID | text |

## 🐛 Troubleshooting

### Docker no inicia
```bash
# Verificar Docker está corriendo
docker ps

# Ver logs
docker logs tramiflow-supabase

# Reiniciar
docker restart tramiflow-supabase
```

### Las migraciones no surten efecto
```bash
# Verificar que se ejecutaron:
npx supabase db list

# Verificar tablas creadas
npx supabase db execute "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"

# Borrar y recrear si es necesario
npx supabase db reset --force
```

### Puerto en uso
```bash
# Si el puerto 54321 está ocupado:
lsof -i :54321

# Matar proceso que lo está usando
kill -9 <PID>
```

## 📚 Recursos

- [Supabase Local Docs](https://supabase.com/docs/guides/local-development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [TramiFlow Docs](./README.md)

---

**¿Prefieres usar Supabase Cloud o Local?** Local es más rápido para desarrollo, Cloud es para producción.
