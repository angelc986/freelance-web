import Link from "next/link";
import Logo from "@/components/Logo";

export default function PoliticaPagosPage() {
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
            Política de pagos
          </h1>
          <p className="text-primary-light/80 text-sm sm:text-base max-w-xl mx-auto">
            Cómo funcionan los pagos, retiros, comisiones y disputas en TurnoGO.
          </p>
          <div className="mt-4 text-xs text-primary-light/60">
            Última actualización: Julio 2026
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 pb-16 sm:pb-20 relative z-10">
        <div className="space-y-5">
          <Section num="1" title="Moneda y red blockchain">
            <p>
              Todos los pagos en TurnoGO se realizan exclusivamente en 
              USDT (Tether), una moneda digital estable con paridad 1:1 
              con el dólar estadounidense. Las transacciones se procesan 
              sobre la red Polygon (MATIC), seleccionada por sus bajos 
              costos de gas, alta velocidad de confirmación y amplia 
              adopción en el ecosistema blockchain de América Latina.
            </p>
          </Section>

          <Section num="2" title="Sistema de depósito en garantía (Escrow)">
            <p>
              TurnoGO implementa un sistema de depósito en garantía 
              automatizado para proteger a ambas partes en cada transacción:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 mt-2">
              <li>Cuando un contratista acepta a un trabajador, el monto acordado se retiene automáticamente</li>
              <li>Los fondos permanecen bloqueados durante la ejecución del trabajo</li>
              <li>Al completarse el servicio, el contratista confirma la finalización satisfactoria</li>
              <li>El pago se libera automáticamente al trabajador, menos la comisión aplicable</li>
            </ol>
            <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200/60 text-green-800 text-xs">
              <strong>Importante:</strong> Ni siquiera TurnoGO puede acceder a los fondos retenidos 
              sin la autorización explícita de las partes o una resolución de disputa válida.
            </div>
          </Section>

          <Section num="3" title="Comisiones">
            <p>
              Por cada trabajo completado exitosamente, TurnoGO cobra una 
              comisión que se descuenta automáticamente del pago total antes 
              de liberar los fondos al trabajador. El porcentaje de comisión 
              se muestra de manera transparente antes de confirmar cada 
              trabajo, y varía según el tipo de servicio y el volumen de 
              transacciones del usuario.
            </p>
            <p className="mt-3">
              No existen costos ocultos ni cargos adicionales. Todas las 
              comisiones aplicables se informan claramente antes de 
              cualquier transacción.
            </p>
          </Section>

          <Section num="4" title="Retiro de fondos">
            <p>
              Los trabajadores pueden retirar sus USDT acumulados en 
              cualquier momento. El proceso de retiro funciona de la 
              siguiente manera:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Los fondos se transfieren a la wallet externa que el trabajador haya registrado</li>
              <li>No hay montos mínimos ni máximos para retiros</li>
              <li>Las transacciones en la red Polygon tienen costos de gas mínimos que corren por cuenta del trabajador</li>
              <li>El tiempo estimado de procesamiento es de 1 a 5 minutos, dependiendo de la congestión de la red</li>
            </ul>
          </Section>

          <Section num="5" title="Proceso de disputas">
            <p>
              Si surge un desacuerdo sobre la calidad del trabajo realizado, 
              cualquiera de las partes puede iniciar un proceso de disputa:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 mt-2">
              <li>El trabajador o contratista abre una disputa desde la plataforma</li>
              <li>Ambas partes presentan evidencia (fotos, mensajes, registro de check-in/check-out)</li>
              <li>TurnoGO revisa el caso de manera imparcial y emite una resolución</li>
              <li>La resolución se comunica a ambas partes en un plazo máximo de 48 horas</li>
            </ol>
            <p className="mt-3">
              Las posibles resoluciones son: pago completo al trabajador, 
              pago parcial proporcional al trabajo realizado, o devolución 
              total al contratista. La decisión de TurnoGO es final y 
              vinculante para ambas partes.
            </p>
          </Section>

          <Section num="6" title="Cancelaciones">
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60">
                <h4 className="font-medium text-dark text-sm mb-1">Cancelación por el trabajador</h4>
                <p className="text-xs">
                  Si el trabajador cancela después de ser aceptado, el 
                  pago retenido se devuelve íntegramente al contratista. 
                  La cancelación afectará la calificación del trabajador 
                  y su visibilidad en la plataforma.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60">
                <h4 className="font-medium text-dark text-sm mb-1">Cancelación por el contratista</h4>
                <p className="text-xs">
                  Si el contratista cancela un turno confirmado, el monto 
                  retenido se devuelve íntegramente. No hay penalización 
                  económica, pero cancelaciones frecuentes pueden afectar 
                  la reputación del contratista.
                </p>
              </div>
            </div>
          </Section>

          <Section num="7" title="Seguridad y cumplimiento normativo">
            <p>
              TurnoGO implementa las siguientes medidas para garantizar la 
              seguridad de las transacciones:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Contratos inteligentes auditados para la gestión de escrow</li>
              <li>Verificación KYC obligatoria (a través de Didit) para todos los usuarios</li>
              <li>Sistema de detección de fraudes y patrones sospechosos</li>
              <li>Registro de auditoría de todas las transacciones financieras</li>
              <li>Límites de transacción basados en el nivel de verificación del usuario</li>
            </ul>
          </Section>

          <Section num="8" title="Transparencia y registros">
            <p>
              Todas las transacciones realizadas en la plataforma quedan 
              registradas y disponibles para consulta en la sección Wallet 
              de tu perfil. Puedes visualizar en cualquier momento:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Historial completo de pagos recibidos y realizados</li>
              <li>Comisiones descontadas en cada transacción</li>
              <li>Estado actual de fondos retenidos en escrow</li>
              <li>Historial de retiros a wallet externa</li>
              <li>Registro de disputas y sus resoluciones</li>
            </ul>
          </Section>

          <Section num="9" title="Modificaciones a esta política">
            <p>
              TurnoGO se reserva el derecho de modificar esta política de 
              pagos en cualquier momento. Las modificaciones serán 
              notificadas a los usuarios con al menos 7 días de 
              anticipación a través de la plataforma. El uso continuo 
              de la plataforma después de la entrada en vigor de las 
              modificaciones constituye la aceptación de las mismas.
            </p>
          </Section>

          <Section num="10" title="Contacto">
            <p>
              Si tienes preguntas sobre esta política de pagos o 
              necesitas asistencia con una transacción, puedes 
              contactarnos a través de la sección de Soporte en la 
              plataforma. Respondemos a todas las consultas en un 
              plazo máximo de 24 horas hábiles.
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
          <Link href="/terminos" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-all px-5 py-2 rounded-full border border-primary/20 hover:bg-primary/5">
            Términos de uso
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
