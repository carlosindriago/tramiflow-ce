# ADR-001: Storage RLS y URLs Firmadas Efímeras (60s TTL)

- **Estado**: Aceptado
- **Fecha**: 2026-08-21
- **Autor**: TramiFlow Senior Architecture Team
- **Contexto**: Seguridad y Aislamiento Multi-Tenant de Documentos

---

## 1. Contexto y Problema

TramiFlow gestiona expedientes migratorios y administrativos con documentación altamente sensible (pasaportes, identificaciones, partidas de nacimiento, comprobantes bancarios). Inicialmente, existían dos riesgos arquitectónicos:
1. **Cuello de Botella del Proxy**: El streaming de archivos pesados o múltiples PDFs a través de Route Handlers (`/api/documents/view`) consumía memoria y tiempo de CPU en funciones Serverless/Edge de Next.js.
2. **URLs Firmadas de Larga Duración**: Se estaban generando Signed URLs de 1 año (365 días) persistidas en bases de datos o transferidas al cliente, exponiendo los documentos si un enlace se filtraba o compartía fuera de la organización.

---

## 2. Decisión

1. **Aislamiento Estricto por RLS en Supabase Storage**:
   - Bucket `client-docs` configurado como **Privado**.
   - Path estándar: `{organization_id}/{client_id}/{filename}`.
   - Políticas RLS a nivel de `storage.objects` que verifican membresía activa en `organization_members` vía `(storage.foldername(name))[1] = organization_id`.

2. **URLs Firmadas Efímeras (60s TTL) Bajo Demanda**:
   - Las URLs firmadas se generan exclusivamente cuando el usuario interactúa con la UI para previsualizar o descargar un archivo (`getDocumentSignedUrlAction` o `getProcedureDocumentsAction`).
   - El tiempo de vida (TTL) se fijó en **60 segundos**, impidiendo la reutilización posterior de enlaces o fugas fuera de sesión.
   - Enlace directo a Supabase CDN / S3 Storage, descargando el ancho de banda del servidor Next.js.

---

## 3. Consecuencias

### Positivas
- **Seguridad Grado Enterprise**: Los enlaces caducan en un minuto; no hay URLs públicas ni permanentes.
- **Escalabilidad y Performance**: Cero impacto de memoria en Serverless/Node.js; la transferencia de archivos ocurre directamente entre el cliente y el CDN de Supabase.
- **Cumplimiento Normativo (GDPR / Privacidad)**: Aislamiento estricto por tenant en el storage layer.

### Consideraciones
- Si el usuario mantiene abierta una previsualización por más de 60 segundos y requiere recargar la imagen o documento, el cliente debe solicitar un nuevo token efímero mediante la Server Action tipada.
