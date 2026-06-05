import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Eye, Database, Globe, Mail, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad | TramiFlow',
  description: 'Conozca cómo TramiFlow recopila, usa y protege sus datos personales y los de sus clientes.',
}

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 md:py-20">

      {/* Hero */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 uppercase tracking-widest">Privacidad</p>
            <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Tu privacidad es fundamental para nosotros. Esta política explica exactamente qué datos recopilamos, cómo los usamos y cómo los protegemos.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Última actualización: 16 de abril de 2026</span>
          <span>·</span>
          <span>Versión 1.0</span>
        </div>
      </div>

      {/* Principios clave */}
      <div className="mb-12 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Lock, title: 'Encriptado', desc: 'Todos los datos en tránsito y en reposo están cifrados.', color: 'emerald' },
          { icon: Eye, title: 'Sin venta de datos', desc: 'Nunca vendemos ni compartimos datos con terceros para publicidad.', color: 'blue' },
          { icon: Database, title: 'Sus datos son suyos', desc: 'Puede exportar o eliminar sus datos en cualquier momento.', color: 'purple' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className={`rounded-xl border border-${color}-500/20 bg-${color}-500/5 p-4`}>
            <Icon className={`h-6 w-6 text-${color}-500 mb-2`} />
            <p className="font-semibold text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Alert GDPR */}
      <div className="mb-10 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-400">
          TramiFlow cumple con los principios del GDPR europeo y las regulaciones locales de protección de datos. Si es usuario dentro de la UE, tiene derechos adicionales descritos en la Sección 9.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-10">

        <PrivacySection number="1" title="Qué datos recopilamos" icon={Database}>
          <p>Recopilamos únicamente los datos necesarios para proveerte del servicio:</p>
          <div className="space-y-4">
            <DataCategory title="Datos de cuenta" items={[
              'Dirección de email y nombre al registrarte',
              'Foto de perfil (si usás Google Sign-In)',
              'Información de facturación (procesada y almacenada por Stripe, no por nosotros)',
            ]} />
            <DataCategory title="Datos de uso" items={[
              'Logs de actividad para seguridad y auditoría dentro de su organización',
              'Dirección IP y tipo de dispositivo para seguridad',
              'Métricas de uso anónimas del producto (sin datos personales)',
            ]} />
            <DataCategory title="Datos de sus clientes" items={[
              'Toda la información de clientes y documentos que carga en el sistema',
              'Estos datos son de su propiedad — nosotros solo los almacenamos y procesamos bajo sus instrucciones',
            ]} />
          </div>
        </PrivacySection>

        <PrivacySection number="2" title="Cómo usamos sus datos" icon={Eye}>
          <p>Usamos los datos únicamente para:</p>
          <ul>
            <li>Proveer y mejorar el servicio de TramiFlow</li>
            <li>Enviar notificaciones del sistema (vencimientos, alertas de seguridad)</li>
            <li>Procesar pagos y gestionar su suscripción</li>
            <li>Detectar y prevenir fraude o uso indebido</li>
            <li>Cumplir con obligaciones legales</li>
            <li>Enviarle comunicaciones de producto (puede cancelar la suscripción en cualquier momento)</li>
          </ul>
          <p className="font-medium">Nunca usamos sus datos ni los de sus clientes para:</p>
          <ul>
            <li>🚫 Entrenar modelos de inteligencia artificial</li>
            <li>🚫 Publicidad de terceros</li>
            <li>🚫 Venta o intercambio con otras empresas</li>
          </ul>
        </PrivacySection>

        <PrivacySection number="3" title="Almacenamiento y seguridad" icon={Lock}>
          <p>
            Los datos se almacenan en servidores seguros de <strong>Supabase</strong> (PostgreSQL en AWS), ubicados en regiones con altos estándares de seguridad. Aplicamos:
          </p>
          <ul>
            <li>Encriptación TLS 1.3 para datos en tránsito</li>
            <li>Encriptación AES-256 para datos en reposo</li>
            <li>Row Level Security (RLS) — cada organización solo accede a sus propios datos</li>
            <li>Backups automáticos diarios con retención de 7 días</li>
            <li>Autenticación de dos factores disponible para todas las cuentas</li>
            <li>Auditoría de accesos y cambios críticos dentro de la plataforma</li>
          </ul>
        </PrivacySection>

        <PrivacySection number="4" title="Proveedores externos (Sub-procesadores)" icon={Globe}>
          <p>Para brindarte el servicio trabajamos con los siguientes proveedores de confianza, cada uno bajo sus propias políticas de privacidad y acuerdos de procesamiento de datos:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Proveedor</th>
                  <th className="text-left px-4 py-2 font-medium">Propósito</th>
                  <th className="text-left px-4 py-2 font-medium">Región</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Supabase', 'Base de datos y autenticación', 'AWS us-east-1'],
                  ['Vercel', 'Hosting y CDN', 'Global'],
                  ['Stripe', 'Procesamiento de pagos', 'EE.UU.'],
                  ['Upstash', 'Rate limiting (Redis)', 'AWS us-east-1'],
                  ['Resend / SMTP', 'Envío de emails transaccionales', 'EE.UU.'],
                ].map(([provider, purpose, region]) => (
                  <tr key={provider} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">{provider}</td>
                    <td className="px-4 py-2 text-muted-foreground">{purpose}</td>
                    <td className="px-4 py-2 text-muted-foreground">{region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrivacySection>

        <PrivacySection number="5" title="Cookies y seguimiento" icon={Eye}>
          <p>Usamos únicamente las cookies estrictamente necesarias para el funcionamiento del servicio:</p>
          <ul>
            <li><strong>Sesión:</strong> Cookie de autenticación HttpOnly, Secure, SameSite=Strict — no accesible desde JavaScript.</li>
            <li><strong>Preferencias:</strong> Tema (claro/oscuro) y configuración de interfaz.</li>
          </ul>
          <p>
            No usamos cookies de rastreo de terceros, Google Analytics ni píxeles de publicidad. Tu navegación dentro de TramiFlow es completamente privada.
          </p>
        </PrivacySection>

        <PrivacySection number="6" title="Retención de datos" icon={Database}>
          <ul>
            <li>Los datos de cuenta activa se retienen durante toda la suscripción.</li>
            <li>Al cancelar la cuenta, los datos se conservan por <strong>30 días</strong> para posible reactivación.</li>
            <li>Transcurridos 30 días, los datos son eliminados de forma permanente e irrecuperable.</li>
            <li>Los logs de auditoría de seguridad se retienen por 90 días.</li>
            <li>Los datos de facturación son retenidos por Stripe según sus políticas y requisitos legales.</li>
          </ul>
        </PrivacySection>

        <PrivacySection number="7" title="Sus derechos" icon={Shield}>
          <p>Tiene derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> Solicitar una copia de todos sus datos personales.</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
            <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos (“derecho al olvido”).</li>
            <li><strong>Portabilidad:</strong> Exportar sus datos en formato estándar (CSV / JSON).</li>
            <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos para ciertos fines.</li>
            <li><strong>Restricción:</strong> Limitar el procesamiento de sus datos en casos específicos.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, envíe un email a{' '}
            <a href="mailto:privacidad@tramiflow.com" className="text-blue-600 hover:underline">privacidad@tramiflow.com</a>{' '}
            con el asunto "Ejercicio de Derechos GDPR". Respondemos en un plazo máximo de 30 días.
          </p>
        </PrivacySection>

        <PrivacySection number="8" title="Transferencias internacionales" icon={Globe}>
          <p>
            Al usar TramiFlow, sus datos pueden ser procesados en los EE.UU. donde están ubicados nuestros principales proveedores. Nos aseguramos de que estas transferencias cumplan con las regulaciones aplicables mediante acuerdos de procesamiento de datos con cada proveedor.
          </p>
        </PrivacySection>

        <PrivacySection number="9" title="Usuarios dentro de la Unión Europea" icon={Shield}>
          <p>
            Si reside en la UE o el EEE, cuenta con derechos adicionales bajo el RGPD (Reglamento General de Protección de Datos). La base legal para el procesamiento es la ejecución del contrato de servicio aceptado al registrarse.
          </p>
          <p>
            Tiene derecho a presentar una reclamación ante la autoridad supervisora de protección de datos de su país miembro de la UE.
          </p>
        </PrivacySection>

        <PrivacySection number="10" title="Contacto y DPO" icon={Mail}>
          <p>
            Para cualquier consulta relacionada con privacidad y protección de datos:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacidad@tramiflow.com" className="text-blue-600 hover:underline">privacidad@tramiflow.com</a></li>
            <li>Tiempo de respuesta: 5 días hábiles (máximo 30 para solicitudes GDPR)</li>
          </ul>
          <p>
            Para asuntos legales urgentes, puede usar el email{' '}
            <a href="mailto:legal@tramiflow.com" className="text-blue-600 hover:underline">legal@tramiflow.com</a>.
          </p>
        </PrivacySection>
      </div>

      {/* Related links */}
      <div className="mt-16 p-6 rounded-xl border border-border bg-muted/20">
        <p className="font-medium mb-3">Documentos relacionados</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/terms" className="text-sm text-emerald-600 hover:underline flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            Términos de Servicio
          </Link>
          <Link href="/help" className="text-sm text-emerald-600 hover:underline flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            Centro de Ayuda
          </Link>
        </div>
      </div>
    </article>
  )
}

function PrivacySection({ number, title, icon: Icon, children }: {
  number: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
          <Icon className="h-4 w-4 text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold">
          <span className="text-muted-foreground text-base font-normal mr-2">{number}.</span>
          {title}
        </h2>
      </div>
      <div className="ml-12 space-y-3 text-muted-foreground leading-relaxed text-[0.95rem] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_strong]:font-medium">
        {children}
      </div>
    </section>
  )
}

function DataCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium text-foreground mb-1.5">{title}:</p>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
