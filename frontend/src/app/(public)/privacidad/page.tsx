import Link from "next/link";
import Logo from "@/components/Logo";

export default function PrivacidadPage() {
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
            Política de privacidad
          </h1>
          <p className="text-primary-light/80 text-sm sm:text-base max-w-xl mx-auto">
            Cómo recopilamos, usamos y protegemos tu información personal.
          </p>
          <div className="mt-4 text-xs text-primary-light/60">
            Última actualización: Julio 2026
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 pb-16 sm:pb-20 relative z-10">
        <div className="space-y-5">
          <Section num="1" title="Información que recopilamos">
            <p>
              Durante el proceso de registro y uso de la Plataforma, 
              recopilamos la siguiente información:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li><strong>Datos de registro:</strong> nombre completo, correo electrónico, número de teléfono, cédula de identidad y fecha de nacimiento</li>
              <li><strong>Datos de perfil:</strong> foto de perfil, ubicación general, habilidades y preferencias laborales</li>
              <li><strong>Datos de uso:</strong> historial de trabajos, calificaciones, reseñas, geolocalización (check-in/check-out)</li>
              <li><strong>Datos de verificación:</strong> documentos de identidad, selfies y videos proporcionados durante el proceso KYC con Didit</li>
              <li><strong>Datos de pago:</strong> dirección de wallet USDT, historial de transacciones</li>
            </ul>
          </Section>

          <Section num="2" title="Finalidad del tratamiento">
            <p>Utilizamos tu información para:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Crear, gestionar y mantener tu cuenta</li>
              <li>Conectarte con oportunidades laborales o trabajadores adecuados</li>
              <li>Verificar tu identidad a través de nuestro proveedor KYC (Didit)</li>
              <li>Procesar pagos, retiros y proteger las transacciones contra fraudes</li>
              <li>Generar estadísticas anónimas para mejorar la plataforma</li>
              <li>Cumplir con obligaciones legales y regulatorias aplicables</li>
              <li>Enviar comunicaciones relacionadas con el servicio (notificaciones de trabajos, pagos, actualizaciones)</li>
            </ul>
          </Section>

          <Section num="3" title="Base legal del tratamiento">
            <p>
              El tratamiento de tus datos personales se fundamenta en las 
              siguientes bases legales:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>La ejecución del contrato de servicios de la Plataforma</li>
              <li>Tu consentimiento explícito, otorgado durante el registro</li>
              <li>El cumplimiento de obligaciones legales aplicables</li>
              <li>El interés legítimo de TurnoGO en mejorar y proteger la Plataforma</li>
            </ul>
          </Section>

          <Section num="4" title="Protección y seguridad de los datos">
            <p>
              Implementamos medidas de seguridad técnicas y organizativas 
              para proteger tu información personal, incluyendo:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Encriptación de datos sensibles (contraseñas, cédula de identidad) mediante hash SHA-256</li>
              <li>Conexiones seguras mediante protocolo HTTPS en toda la plataforma</li>
              <li>Autenticación segura con tokens JWT y refresh tokens rotativos</li>
              <li>Registro de auditoría de todas las acciones sensibles en la plataforma</li>
              <li>Limitación de acceso a datos personales solo al personal autorizado</li>
            </ul>
          </Section>

          <Section num="5" title="Compartir información con terceros">
            <p>
              No vendemos tu información personal a terceros bajo ninguna 
              circunstancia. Podemos compartir información limitada en los 
              siguientes casos:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li><strong>Con otros usuarios:</strong> tu nombre, foto y calificaciones son visibles para otros usuarios. Tu número de teléfono se comparte solo cuando un trabajo es confirmado</li>
              <li><strong>Con Didit (KYC):</strong> tus documentos de identidad se comparten con Didit exclusivamente para fines de verificación de identidad</li>
              <li><strong>Por requerimiento legal:</strong> cuando sea necesario para cumplir con una obligación legal o requerimiento de autoridad competente</li>
            </ul>
          </Section>

          <Section num="6" title="Retención de datos">
            <p>
              Conservamos tu información personal mientras mantengas una 
              cuenta activa en la Plataforma. Si eliminas tu cuenta, tus 
              datos personales se eliminan en un plazo máximo de 30 días 
              hábiles, excepto aquellos que debamos conservar por 
              obligaciones legales o fiscales (historial de transacciones, 
              registros de auditoría), que se retendrán durante el período 
              legalmente exigido.
            </p>
          </Section>

          <Section num="7" title="Tus derechos">
            <p>
              De acuerdo con la legislación aplicable, tienes los siguientes 
              derechos sobre tus datos personales:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li><strong>Acceso:</strong> solicitar una copia de los datos personales que tenemos sobre ti</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos personales</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para fines específicos</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común</li>
            </ul>
            <p className="mt-3">
              Puedes ejercer estos derechos desde la configuración de tu 
              cuenta o contactándonos a través de la plataforma. 
              Responderemos a tu solicitud en un plazo máximo de 15 días.
            </p>
          </Section>

          <Section num="8" title="Cookies y tecnologías similares">
            <p>
              Utilizamos cookies estrictamente esenciales para el 
              funcionamiento de la Plataforma, incluyendo cookies de 
              sesión y autenticación. No utilizamos cookies de rastreo, 
              publicitarias ni de terceros con fines de marketing. 
              Puedes configurar tu navegador para rechazar todas las 
              cookies, aunque esto podría afectar la funcionalidad de 
              la Plataforma.
            </p>
          </Section>

          <Section num="9" title="Menores de edad">
            <p>
              La Plataforma está dirigida exclusivamente a personas 
              mayores de 18 años. No recopilamos intencionadamente 
              información de menores de edad. Si tenemos conocimiento 
              de que un menor ha proporcionado datos personales, 
              procederemos a eliminarlos de forma inmediata.
            </p>
          </Section>

          <Section num="10" title="Modificaciones">
            <p>
              TurnoGO se reserva el derecho de modificar esta política 
              de privacidad en cualquier momento. Las modificaciones 
              sustanciales serán notificadas a los usuarios a través de 
              la Plataforma o por correo electrónico con al menos 15 
              días de anticipación. Te recomendamos revisar esta política 
              periódicamente para mantenerte informado.
            </p>
          </Section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/terminos" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-all px-5 py-2 rounded-full border border-primary/20 hover:bg-primary/5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Términos de uso
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
