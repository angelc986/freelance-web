import Link from "next/link";
import Logo from "@/components/Logo";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF6FF] to-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray hover:text-primary transition-all px-4 py-2 rounded-full border border-gray-200/60 hover:border-primary/30 hover:bg-primary/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary via-primary-dark to-primary pt-16 pb-20 sm:pt-20 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20 backdrop-blur-sm">
            Legal
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Términos de uso
          </h1>
          <p className="text-primary-light/80 text-sm sm:text-base max-w-xl mx-auto">
            Al usar TurnoGO aceptas estos términos. Léelos con atención.
          </p>
          <div className="mt-4 text-xs text-primary-light/60">
            Última actualización: Julio 2026
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 pb-16 sm:pb-20 relative z-10">
        <div className="space-y-5">
          <Section num="1" title="Aceptación de los términos">
            <p>
              Al registrarte, acceder o utilizar la plataforma TurnoGO 
              (en adelante, la "Plataforma"), aceptas quedar vinculado por 
              estos Términos de Uso. Si no estás de acuerdo con alguna de 
              las disposiciones aquí contenidas, abstente de utilizar la 
              Plataforma. TurnoGO se reserva el derecho de denegar el 
              acceso a cualquier usuario que incumpla estos términos.
            </p>
          </Section>

          <Section num="2" title="Descripción del servicio">
            <p>
              TurnoGO es una plataforma digital que conecta a trabajadores 
              independientes con personas o negocios que requieren servicios 
              temporales. La Plataforma actúa como intermediaria tecnológica 
              y facilitadora de pagos, pero no es empleadora ni contratista 
              de los usuarios. Todos los acuerdos laborales se celebran 
              directamente entre el contratista y el trabajador.
            </p>
          </Section>

          <Section num="3" title="Elegibilidad y registro">
            <p>Para utilizar la Plataforma debes:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Ser mayor de edad (18 años o más)</li>
              <li>Proporcionar información veraz, precisa y completa durante el registro</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>No crear múltiples cuentas sin autorización expresa de TurnoGO</li>
            </ul>
            <p className="mt-3">
              TurnoGO se reserva el derecho de verificar la identidad de 
              los usuarios y solicitar documentación adicional en cualquier 
              momento. La verificación de identidad se realiza a través de 
              Didit, nuestro proveedor de verificación KYC.
            </p>
          </Section>

          <Section num="4" title="Obligaciones del trabajador">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Cumplir con el servicio contratado en los términos acordados</li>
              <li>Asistir puntualmente al lugar y horario establecido</li>
              <li>Notificar con anticipación cualquier imposibilidad de asistencia</li>
              <li>Mantener una conducta profesional y respetuosa durante la prestación del servicio</li>
              <li>Completar el check-in y check-out a través de la geolocalización de la app</li>
            </ul>
          </Section>

          <Section num="5" title="Obligaciones del contratista">
            <ul className="list-disc list-inside space-y-1.5">
              <li>Describir el trabajo de forma clara, precisa y completa</li>
              <li>Proporcionar un entorno de trabajo seguro y condiciones adecuadas</li>
              <li>Realizar el pago del monto acordado una vez completado satisfactoriamente</li>
              <li>Responder a las solicitudes de soporte y disputas de manera oportuna</li>
            </ul>
          </Section>

          <Section num="6" title="Protección de pagos">
            <p>
              Todos los pagos en TurnoGO se realizan en USDT sobre la red 
              Polygon. Cuando un contratista acepta a un trabajador, el 
              monto acordado se retiene en un sistema de depósito en garantía 
              (escrow). El pago se libera únicamente cuando el contratista 
              confirma la finalización satisfactoria del servicio. En caso 
              de disputa, TurnoGO actuará como mediador imparcial para 
              resolver el conflicto.
            </p>
          </Section>

          <Section num="7" title="Comisiones y tarifas">
            <p>
              TurnoGO cobra una comisión por cada servicio completado. 
              La comisión se descuenta automáticamente del pago total 
              antes de liberar los fondos al trabajador. El porcentaje 
              aplicable se muestra de forma transparente antes de 
              confirmar cada trabajo. TurnoGO se reserva el derecho de 
              modificar sus tarifas con aviso previo de 15 días.
            </p>
          </Section>

          <Section num="8" title="Cancelaciones">
            <div className="space-y-3">
              <p>
                <strong>Por parte del trabajador:</strong> La cancelación 
                posterior a la aceptación del turno puede afectar 
                negativamente su calificación y visibilidad en la plataforma. 
                Cancelaciones reiteradas pueden resultar en la suspensión 
                temporal o definitiva de la cuenta.
              </p>
              <p>
                <strong>Por parte del contratista:</strong> Si el contratista 
                cancela un turno confirmado, el monto retenido se devuelve 
                íntegramente. Cancelaciones frecuentes pueden afectar la 
                reputación del contratista.
              </p>
            </div>
          </Section>

          <Section num="9" title="Conducta prohibida">
            <p>Queda estrictamente prohibido:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Acordar, solicitar o realizar pagos fuera de la plataforma</li>
              <li>Crear cuentas falsas o suplantar la identidad de terceros</li>
              <li>Realizar conductas de acoso, discriminación o violencia</li>
              <li>Utilizar la plataforma para actividades ilícitas o fraudulentas</li>
              <li>Manipular calificaciones, reseñas o el sistema de reputación</li>
            </ul>
            <p className="mt-3">
              El incumplimiento de estas disposiciones dará lugar a la 
              suspensión permanente de la cuenta y, cuando corresponda, 
              a las acciones legales pertinentes.
            </p>
          </Section>

          <Section num="10" title="Propiedad intelectual">
            <p>
              Todos los derechos de propiedad intelectual sobre la 
              Plataforma, incluyendo su diseño, código fuente, logotipos 
              y marcas, son propiedad exclusiva de TurnoGO. Queda prohibida 
              la reproducción, distribución o modificación no autorizada 
              de cualquier elemento de la Plataforma.
            </p>
          </Section>

          <Section num="11" title="Limitación de responsabilidad">
            <p>
              TurnoGO actúa únicamente como intermediario tecnológico y no 
              será responsable por daños directos, indirectos, incidentales 
              o consecuentes derivados del uso de la Plataforma o de los 
              servicios contratados a través de ella. La responsabilidad 
              máxima de TurnoGO en ningún caso excederá el monto de las 
              comisiones pagadas por el usuario en los 12 meses anteriores 
              al reclamo.
            </p>
          </Section>

          <Section num="12" title="Modificaciones">
            <p>
              TurnoGO se reserva el derecho de modificar estos términos en 
              cualquier momento. Las modificaciones serán notificadas a los 
              usuarios a través de la Plataforma o por correo electrónico 
              con al menos 15 días de anticipación. El uso continuo de la 
              Plataforma después de la entrada en vigor de las 
              modificaciones constituye la aceptación de las mismas.
            </p>
          </Section>

          <Section num="13" title="Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por las leyes de la República 
              Bolivariana de Venezuela. Cualquier controversia derivada 
              de estos términos será sometida a los tribunales competentes 
              de la ciudad de Caracas, Venezuela.
            </p>
          </Section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/privacidad" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-all px-5 py-2 rounded-full border border-primary/20 hover:bg-primary/5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Política de privacidad
          </Link>
          <Link href="/politica-pagos" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-all px-5 py-2 rounded-full border border-primary/20 hover:bg-primary/5">
            Política de pagos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm">
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark text-base mb-2">{title}</h3>
          <div className="text-sm text-gray leading-relaxed space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
