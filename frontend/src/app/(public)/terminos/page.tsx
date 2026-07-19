import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-light to-white">
      {/* Nav simple */}
      <nav className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-primary">
            TurnoGO
          </Link>
          <Link
            href="/"
            className="text-sm text-gray hover:text-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
          Términos de uso
        </h1>
        <p className="text-gray text-sm mb-10">
          Última actualización: Julio 2026
        </p>

        <div className="space-y-6 text-sm text-gray leading-relaxed">
          <Section num="1" title="Aceptación de los términos">
            <p>Al registrarte y usar TurnoGO, aceptas estos términos de uso. Si no estás de acuerdo, no uses la plataforma.</p>
          </Section>

          <Section num="2" title="¿Cómo funciona TurnoGO?">
            <p>TurnoGO conecta a trabajadores con personas o negocios que necesitan ayuda temporal. Los contratistas publican trabajos y los trabajadores pueden postularse. Los pagos se manejan en USDT a través de la plataforma y están protegidos hasta que ambas partes confirmen.</p>
          </Section>

          <Section num="3" title="Responsabilidades del trabajador">
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Debes ser mayor de edad (18+)</li>
              <li>Debes cumplir con el trabajo que aceptaste</li>
              <li>Debes asistir puntualmente al lugar y horario acordado</li>
              <li>Si no puedes asistir, debes cancelar con anticipación</li>
            </ul>
          </Section>

          <Section num="4" title="Responsabilidades del contratista">
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Debes describir el trabajo con precisión</li>
              <li>Debes pagar el monto acordado una vez completado el trabajo</li>
              <li>El pago queda retenido en la plataforma hasta que apruebes el trabajo</li>
            </ul>
          </Section>

          <Section num="5" title="Protección de pagos">
            <p>Cuando un contratista acepta a un trabajador, los USDT quedan retenidos en la plataforma. El pago se libera solo cuando el contratista confirma que el trabajo fue completado satisfactoriamente. En caso de disputa, TurnoGO mediará para resolver el conflicto.</p>
          </Section>

          <Section num="6" title="Comisiones">
            <p>TurnoGO cobra una comisión por cada trabajo completado. La comisión se descuenta automáticamente del pago antes de liberarlo al trabajador. El porcentaje se muestra antes de confirmar cada trabajo.</p>
          </Section>

          <Section num="7" title="Cancelaciones">
            <p>Si el trabajador cancela después de ser aceptado, puede afectar su calificación. Si el contratista cancela, el pago retenido se devuelve íntegramente. Cancelaciones repetidas pueden resultar en suspensión de la cuenta.</p>
          </Section>

          <Section num="8" title="Conducta prohibida">
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Está prohibido acordar pagos fuera de la plataforma</li>
              <li>Está prohibido crear cuentas falsas</li>
              <li>Está prohibido acosar o discriminar a otros usuarios</li>
              <li>El incumplimiento resulta en suspensión permanente</li>
            </ul>
          </Section>

          <Section num="9" title="Modificaciones">
            <p>TurnoGO puede modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios. El uso continuo de la plataforma después de los cambios constituye aceptación.</p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
          <Link href="/privacidad" className="text-sm text-primary hover:text-primary-dark transition-colors">
            ← Política de privacidad
          </Link>
          <Link href="/politica-pagos" className="text-sm text-primary hover:text-primary-dark transition-colors">
            Política de pagos →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-gray-200/60 shadow-sm">
      <h3 className="font-semibold text-dark text-base mb-1.5">
        <span className="text-primary">{num}.</span> {title}
      </h3>
      <div className="text-gray">{children}</div>
    </div>
  );
}
