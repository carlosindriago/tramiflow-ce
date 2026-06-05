import type { Metadata } from 'next'
import Link from 'next/link'
/* eslint-disable */
import { Scale, Shield, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos de Servicio | TramiFlow',
  description: 'Conozca los términos y condiciones que rigen el uso de la plataforma TramiFlow.',
}

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 md:py-20">

      {/* Hero */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Scale className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-widest">Documento Legal</p>
            <h1 className="text-3xl font-bold tracking-tight">Términos de Servicio</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Al usar TramiFlow acepta estos términos. Por favor, léalos detenidamente antes de usar la plataforma.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Última actualización: 16 de abril de 2026</span>
          <span>·</span>
          <span>Versión 1.0</span>
        </div>
      </div>

      {/* Alert */}
      <div className="mb-10 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Al crear una cuenta y usar TramiFlow, confirma que leyó, entendió y acepta estos Términos de Servicio en su totalidad.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

        <Section number="1" title="Descripción del Servicio">
          <p>
            TramiFlow es una plataforma de gestión de trámites administrativos y expedientes diseñada para profesionales, estudios jurídicos, contadores y gestores. Permite centralizar documentos, gestionar vencimientos, capturar leads y automatizar notificaciones.
          </p>
          <p>
            El servicio se presta bajo un modelo de Software como Servicio (SaaS) con planes de suscripción mensual. Las funcionalidades disponibles dependen del plan contratado.
          </p>
        </Section>

        <Section number="2" title="Registro y Cuenta">
          <ul>
            <li>Debe tener al menos 18 años para crear una cuenta.</li>
            <li>La información de registro debe ser veraz, completa y actualizada.</li>
            <li>Es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>Debe notificarnos de inmediato ante cualquier uso no autorizado de su cuenta.</li>
            <li>No está permitido compartir cuentas entre múltiples usuarios sin un plan que lo contemple.</li>
          </ul>
        </Section>

        <Section number="3" title="Uso Aceptable">
          <p>Al usar TramiFlow se compromete a no:</p>
          <ul>
            <li>Usar la plataforma para actividades ilegales o fraudulentas.</li>
            <li>Subir contenido que infrinja derechos de terceros o malware.</li>
            <li>Intentar acceder a cuentas de otros usuarios o sistemas internos.</li>
            <li>Realizar ingeniería inversa o extraer código fuente de la plataforma.</li>
            <li>Sobrecargar intencionalmente los servidores mediante scraping o requests masivos automatizados.</li>
          </ul>
        </Section>

        <Section number="4" title="Planes y Facturación">
          <p>
            TramiFlow ofrece distintos planes de suscripción con diferentes límites de clientes, trámites y funcionalidades. Los precios y características de cada plan están publicados en nuestra página de precios.
          </p>
          <ul>
            <li>Los planes se facturan mensualmente o anualmente según lo elegido al contratar.</li>
            <li>Los pagos son procesados de forma segura por proveedores externos (Stripe).</li>
            <li>No realizamos reembolsos proporcionales por cancelación anticipada del período contratado.</li>
            <li>Nos reservamos el derecho de modificar precios con 30 días de anticipación.</li>
          </ul>
        </Section>

        <Section number="5" title="Privacidad y Datos">
          <p>
            El manejo de sus datos personales y los de sus clientes está regulado por nuestra{' '}
            <Link href="/privacy" className="text-emerald-600 hover:underline font-medium">Política de Privacidad</Link>.
            Actuamos como procesadores de datos bajo las instrucciones de cada organización (controlador de datos).
          </p>
          <p>
            Los documentos y datos de sus clientes son de su propiedad. TramiFlow no los comparte con terceros ni los usa para entrenar modelos de IA.
          </p>
        </Section>

        <Section number="6" title="Disponibilidad y SLA">
          <p>
            Nos comprometemos a mantener una disponibilidad del servicio del 99.5% mensual. Esto excluye ventanas de mantenimiento programado, que serán notificadas con al menos 24 horas de anticipación.
          </p>
          <p>
            No somos responsables por interrupciones causadas por proveedores externos (Supabase, Vercel, Cloudflare) o eventos de fuerza mayor.
          </p>
        </Section>

        <Section number="7" title="Propiedad Intelectual">
          <p>
            Todo el código, diseño, marca y contenido propio de TramiFlow son propiedad de TramiFlow Systems Inc. El uso de la plataforma no otorga ningún derecho de propiedad sobre estos elementos.
          </p>
          <p>
            Usted conserva todos los derechos sobre los datos y documentos que carga en la plataforma.
          </p>
        </Section>

        <Section number="8" title="Limitación de Responsabilidad">
          <p>
/* eslint-disable */
            TramiFlow se provee "como está". En ningún caso seremos responsables por daños indirectos, lucro cesante, pérdida de datos o interrupción del negocio, incluso si fuimos informados de la posibilidad de dichos daños.
          </p>
          <p>
            Nuestra responsabilidad máxima está limitada al monto pagado en los últimos 12 meses de suscripción.
          </p>
        </Section>

        <Section number="9" title="Modificaciones a los Términos">
          <p>
            Podemos modificar estos términos en cualquier momento. Se notificará por email y dentro de la plataforma con al menos 15 días de anticipación ante cambios significativos. El uso continuado del servicio después de la fecha efectiva constituye aceptación de los nuevos términos.
          </p>
        </Section>

        <Section number="10" title="Terminación">
          <p>
            Puede cancelar su cuenta en cualquier momento desde la configuración de su perfil. Conservaremos sus datos por 30 días después de la cancelación, período en el que puede exportarlos. Transcurrido ese plazo, los datos serán eliminados permanentemente.
          </p>
          <p>
            Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos, con o sin previo aviso.
          </p>
        </Section>

        <Section number="11" title="Ley Aplicable">
          <p>
            Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será sometida a los tribunales competentes de Lima, Perú, renunciando a cualquier otro fuero que pudiera corresponder.
          </p>
        </Section>

        <Section number="12" title="Contacto">
          <p>
            Para consultas sobre estos términos, puede contactarnos en{' '}
            <a href="mailto:legal@tramiflow.com" className="text-emerald-600 hover:underline">legal@tramiflow.com</a>.
          </p>
        </Section>
      </div>

      {/* CTA Footer */}
      <div className="mt-16 flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border bg-muted/30 p-6">
        <CheckCircle className="h-8 w-8 text-emerald-500 flex-shrink-0" />
        <div className="text-center sm:text-left">
          <p className="font-medium">¿Tiene preguntas sobre nuestros términos?</p>
          <p className="text-sm text-muted-foreground">Nuestro equipo de soporte está disponible para ayudarle.</p>
        </div>
        <Link
          href="/help"
          className="sm:ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Ir a Ayuda
        </Link>
      </div>
    </article>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 border border-emerald-500/20 flex-shrink-0">
          {number}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="ml-10 space-y-3 text-muted-foreground leading-relaxed text-[0.95rem]">
        {children}
      </div>
    </section>
  )
}
