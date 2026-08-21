# ADR-002: Control de Sesión Única en Edge vía Metadata y Cookies Criptográficas

- **Estado**: Aceptado
- **Fecha**: 2026-08-21
- **Autor**: TramiFlow Senior Architecture Team
- **Contexto**: Seguridad de Sesiones, Prevención de Cuentas Compartidas y Cero Latencia

---

## 1. Contexto y Problema

En aplicaciones SaaS B2B, es común el abuso de cuentas compartidas entre múltiples usuarios de una misma oficina o el riesgo de secuestro de sesión si un usuario deja su terminal abierta en un entorno público.
Sin embargo, verificar activamente la validez de la sesión contra una tabla de PostgreSQL en cada petición HTTP dentro del `middleware.ts` de Next.js introduce **15ms - 50ms de latencia de base de datos** por cada navegación de página y satura el pool de conexiones de la base de datos (Pool Exhaustion).

---

## 2. Decisión

Implementar **Zero-Latency Single Session Enforcement** en Edge:

1. **Generación de `session_uuid` en Login**:
   - Cada inicio de sesión exitoso (email/password o OAuth Google) genera un UUID criptográfico aleatorio (`crypto.randomUUID()`).
   - Se actualiza `user.user_metadata.session_uuid` mediante `supabase.auth.updateUser()`.
   - Se emite una cookie HTTP-only segura `tf_session_id` sincronizada con ese UUID.

2. **Validación Instantánea en `middleware.ts`**:
   - En cada petición, el Edge Middleware obtiene el usuario verificado vía `supabase.auth.getUser()`.
   - Se compara `user.user_metadata.session_uuid` contra la cookie `tf_session_id`.
   - Si no coinciden (porque el usuario inició sesión en otro dispositivo o navegador), la sesión antigua es invalidada y redirigida inmediatamente a `/login?reason=concurrent_session` **sin realizar ninguna consulta a la base de datos PostgreSQL**.

3. **Detección Geográfica en Edge**:
   - Se capturan las cabeceras `x-vercel-ip-country` y `cf-ipcountry` para auditar el país de procedencia y propagarlo mediante la cabecera `x-user-country`.

---

## 3. Consecuencias

### Positivas
- **Latencia Cero**: La verificación se realiza en memoria / Edge sin tocar el pool de PostgreSQL.
- **Seguridad Inmediata**: Cierre automático e instantáneo de sesiones concurrentes obsoletas.
- **Experiencia de Usuario Transparente**: Explicación clara al usuario en el login sobre el cierre de sesión por concurrencia.

### Consideraciones
- Requiere que las cookies del navegador admitan `SameSite=Lax` y `Secure` en producción.
