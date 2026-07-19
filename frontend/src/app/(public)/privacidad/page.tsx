import Link from "next/link";

export default function PrivacidadPage() {
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
          Política de privacidad
        </h1>
        <p className="text-gray text-sm mb-10">
          Última actualización: Julio 2026
        </p>

        <div className="space-y-6 text-sm text-gray leading-relaxed">
          <Section num="1" title="Información que recopilamos">
            <p>Recopilamos la información que nos proporcionas al registrarte: nombre completo, correo electrónico, número de teléfono, cédula de identidad y foto de perfil. También recopilamos datos de uso como tu ubicación (para geocerca), historial de trabajos y calificaciones.</p>
          </Section>

          <Section num="2" title="¿Para qué usamos tu información?">
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Crear y gestionar tu cuenta</li>
              <li>Conectarte con trabajos o trabajadores adecuados</li>
              <li>Verificar tu identidad y referencias</li>
              <li>Procesar pagos y proteger las transacciones</li>
              <li>Mejorar la plataforma y la experiencia de usuario</li>
            </ul>
          </Section>

          <Section num="3" title="Protección de tu información">
            <p>Tu cédula de identidad se almacena de forma encriptada (hash). Los datos sensibles como contraseñas también están encriptados. Usamos conexiones seguras (HTTPS) en toda la plataforma.</p>
          </Section>

          <Section num="4" title="Compartir información">
            <p>No vendemos tu información personal a terceros. Tu nombre, foto y calificaciones son visibles para otros usuarios de la plataforma cuando postulas a un trabajo o cuando un contratista busca trabajadores. Tu número de teléfono se comparte solo cuando un trabajo es confirmado.</p>
          </Section>

          <Section num="5" title="Retención de datos">
            <p>Conservamos tu información mientras tengas una cuenta activa. Si eliminas tu cuenta, tus datos personales se eliminan en un plazo de 30 días. El historial de transacciones se conserva por razones legales y fiscales.</p>
          </Section>

          <Section num="6" title="Tus derechos">
            <p>Puedes acceder, corregir o eliminar tus datos personales desde la configuración de tu cuenta. Si tienes dudas sobre tu privacidad, contáctanos a través de la plataforma.</p>
          </Section>

          <Section num="7" title="Cookies">
            <p>Usamos cookies esenciales para el funcionamiento de la plataforma (sesión, autenticación). No usamos cookies de rastreo publicitario.</p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
          <Link href="/terminos" className="text-sm text-primary hover:text-primary-dark transition-colors">
            ← Términos de uso
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
