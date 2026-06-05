import type { Metadata } from 'next'
import Link from 'next/link'
import {
  HelpCircle, Mail, MessageCircle, BookOpen,
  Zap, Users, FileText, Settings, CreditCard, Shield,
  ChevronDown, ExternalLink
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centro de Ayuda | TramiFlow',
  description: 'Encontrá respuestas a las preguntas frecuentes y soporte para usar TramiFlow.',
}

const faqs = [
  {
    category: 'Primeros pasos',
    icon: Zap,
    questions: [
      {
        q: '¿Cómo creo mi primera plantilla de trámite?',
        a: 'Vaya a la sección "Plantillas" desde el menú lateral y haga clic en "Nueva Plantilla". Puede definir el nombre, descripción, pasos del proceso, requisitos de documentación, honorarios y más. Una vez guardada, puede usarla para crear trámites de clientes.',
      },
      {
        q: '¿Cómo agrego mi primer cliente?',
        a: 'Desde el menú lateral, seleccione "Clientes" y haga clic en "Nuevo Cliente". Complete los datos básicos (nombre, email, teléfono) y guarde. Luego puede crearle trámites y cargarle documentos directamente.',
      },
      {
        q: '¿Puedo probar TramiFlow gratis?',
        a: 'Sí. Todos los planes nuevos incluyen un período de prueba gratuito. No se requiere tarjeta de crédito para empezar. Puede explorar todas las funcionalidades sin limitaciones durante el período de prueba.',
      },
    ],
  },
  {
    category: 'Gestión de trámites',
    icon: FileText,
    questions: [
      {
        q: '¿Cómo funciona el sistema de vencimientos?',
        a: 'Al crear un trámite puede definir una fecha de vencimiento. El sistema enviará notificaciones automáticas por email a los días configurados antes del vencimiento (7, 3 y 1 día por defecto). También lo verá destacado en el dashboard con colores de alerta.',
      },
      {
        q: '¿Puedo personalizar los estados de los trámites?',
        a: 'Sí. Desde Configuración → Estados puede crear estados personalizados con colores propios. Puede definir estados como "En espera de documentación", "En ente regulador", "Aprobado", etc., adaptados a su flujo de trabajo.',
      },
      {
        q: '¿Qué son las plantillas compartidas?',
        a: 'Las plantillas públicas te permiten compartir un formulario de captura de leads para un servicio específico. Tus clientes potenciales completan sus datos desde una URL pública y la información llega directamente a tu panel de Leads. Ideal para marketing digital.',
      },
    ],
  },
  {
    category: 'Documentos y archivos',
    icon: BookOpen,
    questions: [
      {
        q: '¿Qué tipos de archivos puedo cargar?',
        a: 'TramiFlow acepta PDF, imágenes (JPG, PNG, HEIC), documentos de Word y Excel. Los archivos se almacenan de forma segura y puede acceder a ellos desde cualquier dispositivo. El tamaño máximo por archivo es de 25 MB.',
      },
      {
        q: '¿Cómo vinculo documentos a un trámite específico?',
        a: 'Dentro de la vista de un trámite, vaya a la pestaña "Documentos". Puede subir archivos directamente al trámite o vincular documentos que ya están en la carpeta general del cliente. Los documentos vinculados quedan asociados a ese trámite específico.',
      },
      {
        q: '¿Puedo combinar PDFs o convertir imágenes a PDF?',
        a: 'Sí. En la sección de documentos tiene herramientas integradas: "Fusionar PDFs" para combinar varios PDFs en uno, e "Imágenes a PDF" para convertir fotos de documentos en un PDF unificado. Muy útil para armar expedientes completos.',
      },
    ],
  },
  {
    category: 'Cuenta y facturación',
    icon: CreditCard,
    questions: [
      {
        q: '¿Cómo cambio de plan?',
        a: 'Vaya a Configuración → Facturación. Desde ahí puede ver su plan actual y los planes disponibles para hacer el upgrade o downgrade. Los cambios aplican al inicio del próximo período de facturación. Si hace upgrade, se prorratea el costo del mes en curso.',
      },
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) procesadas de forma segura a través de Stripe. También aceptamos transferencias bancarias para planes anuales bajo pedido.',
      },
      {
        q: '¿Cómo cancelo mi cuenta?',
        a: 'Puede cancelar en cualquier momento desde Configuración → Cuenta → Cancelar suscripción. Su cuenta permanecerá activa hasta el final del período pagado. Sus datos se conservan por 30 días después de la cancelación para que pueda exportarlos.',
      },
    ],
  },
  {
    category: 'Seguridad y privacidad',
    icon: Shield,
    questions: [
      {
        q: '¿Mis datos están seguros en TramiFlow?',
        a: 'Sí. Usamos encriptación TLS 1.3 para datos en tránsito y AES-256 para datos en reposo. Cada organización está completamente aislada (Row Level Security). Puede activar autenticación de dos factores (2FA) desde Configuración → Seguridad.',
      },
      {
        q: '¿Cómo activo la verificación en dos pasos (2FA)?',
        a: 'Vaya a Configuración → Seguridad → Autenticación de dos factores. Escanee el código QR con una app como Google Authenticator o Authy, verifique con un código y listo. A partir de ese momento, cada inicio de sesión requerirá el código de 6 dígitos.',
      },
      {
        q: '¿Quién puede ver los datos de mi organización?',
        a: 'Solo los miembros de su organización tienen acceso. Nuestros técnicos de soporte solo acceden con su permiso explícito para resolver incidencias. Nunca compartimos datos con terceros. Revise nuestra Política de Privacidad para más detalles.',
      },
    ],
  },
  {
    category: 'Configuración',
    icon: Settings,
    questions: [
      {
        q: '¿Cómo invito a otros usuarios a mi organización?',
        a: 'Vaya a Configuración → Equipo y haga clic en "Invitar miembro". Ingrese el email del usuario y asígnele un rol (Admin o Miembro). Recibirán un email con el link de invitación. Cada plan tiene un límite de usuarios — verifique su plan actual.',
      },
      {
        q: '¿Puedo personalizar mi perfil público?',
        a: 'Sí. En la sección "Mi Sitio Web" puede personalizar su página pública que comparte con sus clientes potenciales. Puede cambiar colores, logo, texto de bienvenida, mostrar/ocultar precios y elegir entre diferentes layouts.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">

      {/* Hero */}
      <div className="mb-12 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <HelpCircle className="h-8 w-8 text-violet-500" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">¿En qué podemos ayudarte?</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Encontrá respuestas a las preguntas más frecuentes sobre TramiFlow o contactá a nuestro equipo de soporte.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-16">
        <ContactCard
          icon={Mail}
          title="Email de soporte"
          desc="Respuesta en menos de 24 horas hábiles"
          action="soporte@tramiflow.com"
          href="mailto:soporte@tramiflow.com"
          color="emerald"
        />
        <ContactCard
          icon={MessageCircle}
          title="Chat en vivo"
          desc="Disponible Lunes a Viernes 9am – 6pm"
          action="Abrir chat →"
          href="#"
          color="blue"
        />
        <ContactCard
          icon={Users}
          title="Comunidad"
          desc="Comunidad de usuarios de TramiFlow"
          action="Unirse"
          href="#"
          color="violet"
        />
      </div>

      {/* Quick links */}
      <div className="mb-14">
        <h2 className="text-xl font-semibold mb-5">Accesos rápidos</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Zap, label: 'Guía de inicio rápido', desc: 'Configure su cuenta en 5 minutos', href: '#primeros-pasos' },
            { icon: FileText, label: 'Gestión de trámites', desc: 'Cómo organizar sus casos', href: '#gestion-de-tramites' },
            { icon: BookOpen, label: 'Documentos y archivos', desc: 'Subir, organizar y combinar', href: '#documentos-y-archivos' },
            { icon: Shield, label: 'Seguridad', desc: 'Proteja su cuenta con 2FA', href: '#seguridad-y-privacidad' },
          ].map(({ icon: Icon, label, desc, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-violet-500/10 transition-colors flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-12">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>

        {faqs.map(({ category, icon: Icon, questions }) => (
          <section key={category} id={category.toLowerCase().replace(/ /g, '-')}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
                <Icon className="h-4 w-4 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold">{category}</h3>
            </div>

            <div className="space-y-3">
              {questions.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border bg-card overflow-hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-medium text-sm hover:bg-muted/30 transition-colors list-none">
                    {q}
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA banner */}
      <div className="mt-16 rounded-2xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border border-violet-500/20 p-8 text-center space-y-4">
        <HelpCircle className="h-10 w-10 text-violet-500 mx-auto" />
        <h3 className="text-xl font-bold">¿No encontró lo que buscaba?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nuestro equipo de soporte está listo para ayudarle. Respondemos en menos de 24 horas hábiles.
        </p>
        <a
          href="mailto:soporte@tramiflow.com"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Contáctenos
        </a>
      </div>

      {/* Footer links */}
      <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>
          También puede revisar nuestros{' '}
          <Link href="/terms" className="text-violet-600 hover:underline">Términos de Servicio</Link>
          {' '}y{' '}
          <Link href="/privacy" className="text-violet-600 hover:underline">Política de Privacidad</Link>.
        </p>
      </div>
    </div>
  )
}

function ContactCard({ icon: Icon, title, desc, action, href, color }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  action: string
  href: string
  color: 'emerald' | 'blue' | 'violet'
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-500',
  }
  const linkColors = {
    emerald: 'text-emerald-600 hover:text-emerald-700',
    blue: 'text-blue-600 hover:text-blue-700',
    violet: 'text-violet-600 hover:text-violet-700',
  }

  return (
    <div className={`rounded-xl border p-5 ${colors[color].replace('text-', 'border-').split(' ')[1]} bg-card hover:bg-muted/20 transition-colors`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{desc}</p>
      <a href={href} className={`text-sm font-medium transition-colors ${linkColors[color]}`}>
        {action}
      </a>
    </div>
  )
}
