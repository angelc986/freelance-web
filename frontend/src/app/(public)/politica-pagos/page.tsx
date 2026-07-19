import Link from "next/link";

export default function PoliticaPagosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-light to-white">
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
          Política de pagos
        </h1>
        <p className="text-gray text-sm mb-10">
          Última actualización: Julio 2026
        </p>

        <div className="space-y-6 text-sm text-gray leading-relaxed">
          <Section num="1" title="Moneda y pagos">
            <p>Todos los pagos en TurnoGO se realizan en USDT (Tether) sobre la red Polygon. Esto garantiza pagos rápidos, seguros y con costos mínimos de transacción, sin necesidad de cuentas bancarias tradicionales.</p>
          </Section>

          <Section num="2" title="Protección de pago (Escrow)">
            <p>Cuando un contratista acepta a un trabajador, el monto acordado se retiene automáticamente en la plataforma. El pago solo se libera al trabajador cuando el contratista confirma que el trabajo fue completado satisfactoriamente. Este sistema protege a ambas partes:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li><strong>El contratista</strong> paga solo cuando el trabajo está bien hecho</li>
              <li><strong>El trabajador</strong> tiene la garantía de que el pago está asegurado</li>
            </ul>
          </Section>

          <Section num="3" title="Comisiones">
            <p>TurnoGO cobra una comisión por cada trabajo completado. La comisión se descuenta automáticamente del pago total antes de liberar los fondos al trabajador. El porcentaje exacto se muestra de forma transparente antes de confirmar cada trabajo.</p>
          </Section>

          <Section num="4" title="Retiro de fondos">
            <p>Los trabajadores pueden retirar sus USDT a cualquier wallet externa compatible con la red Polygon en cualquier momento. No hay montos mínimos ni máximos para retiros. Las transacciones en la blockchain pueden tener costos de gas mínimos que corren por cuenta del trabajador.</p>
          </Section>

          <Section num="5" title="Disputas">
            <p>Si surge un desacuerdo sobre la calidad del trabajo, TurnoGO actúa como mediador. El proceso de disputa incluye:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>El trabajador o contratista puede abrir una disputa desde la plataforma</li>
              <li>Ambas partes presentan evidencia (fotos, mensajes, check-in)</li>
              <li>TurnoGO revisa el caso y emite una resolución en un máximo de 48 horas</li>
              <li>La resolución puede ser: pago completo, pago parcial o devolución al contratista</li>
            </ul>
          </Section>

          <Section num="6" title="Cancelaciones">
            <p>Si el trabajador cancela después de ser aceptado, puede afectar su calificación y el pago se devuelve al contratista. Si el contratista cancela, el pago retenido se devuelve íntegramente al contratista sin costo. Cancelaciones repetidas pueden resultar en suspensión de la cuenta.</p>
          </Section>

          <Section num="7" title="Seguridad">
            <p>TurnoGO utiliza contratos inteligentes auditados para la retención y liberación de pagos. Esto significa que ni siquiera TurnoGO puede acceder a los fondos retenidos sin la autorización de las partes involucradas o una resolución de disputa válida.</p>
          </Section>

          <Section num="8" title="Transparencia">
            <p>Todas las transacciones son visibles en el historial de la plataforma. Cada pago, retiro y comisión queda registrado y disponible para consulta en cualquier momento desde la sección de Wallet.</p>
          </Section>

          <Section num="9" title="Modificaciones">
            <p>TurnoGO puede modificar esta política de pagos en cualquier momento. Los cambios serán notificados a los usuarios con al menos 7 días de anticipación. El uso continuo de la plataforma después de los cambios constituye aceptación.</p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
          <Link href="/privacidad" className="text-sm text-primary hover:text-primary-dark transition-colors">
            ← Política de privacidad
          </Link>
          <Link href="/terminos" className="text-sm text-primary hover:text-primary-dark transition-colors">
            Términos de uso →
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
