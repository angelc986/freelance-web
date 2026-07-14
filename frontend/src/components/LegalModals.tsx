"use client";

import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  tab?: "terms" | "privacy";
  onClose: () => void;
}

export default function LegalModals({ open, tab = "terms", onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-modal-enter modal-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center z-10"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tabs */}
        <div className="pt-8 px-7 pb-0">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-5">
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "terms"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray hover:text-dark"
              }`}
            >
              Términos de uso
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "privacy"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray hover:text-dark"
              }`}
            >
              Política de privacidad
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-7 pb-6">
          {activeTab === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-gray leading-relaxed">
      <div>
        <h3 className="font-semibold text-dark text-base mb-2">1. Aceptación de los términos</h3>
        <p>Al registrarte y usar TurnoGO, aceptas estos términos de uso. Si no estás de acuerdo, no uses la plataforma.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">2. ¿Cómo funciona TurnoGO?</h3>
        <p>TurnoGO conecta a trabajadores con personas o negocios que necesitan ayuda temporal. Los contratistas publican trabajos y los trabajadores pueden postularse. Los pagos se manejan en USDT a través de la plataforma y están protegidos hasta que ambas partes confirmen.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">3. Responsabilidades del trabajador</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Debes ser mayor de edad (18+)</li>
          <li>Debes cumplir con el trabajo que aceptaste</li>
          <li>Debes asistir puntualmente al lugar y horario acordado</li>
          <li>Si no puedes asistir, debes cancelar con anticipación</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">4. Responsabilidades del contratista</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Debes describir el trabajo con precisión</li>
          <li>Debes pagar el monto acordado una vez completado el trabajo</li>
          <li>El pago queda retenido en la plataforma hasta que apruebes el trabajo</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">5. Protección de pagos</h3>
        <p>Cuando un contratista acepta a un trabajador, los USDT quedan retenidos en la plataforma. El pago se libera solo cuando el contratista confirma que el trabajo fue completado satisfactoriamente. En caso de disputa, TurnoGO mediará para resolver el conflicto.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">6. Comisiones</h3>
        <p>TurnoGO cobra una comisión por cada trabajo completado. La comisión se descuenta automáticamente del pago antes de liberarlo al trabajador. El porcentaje se muestra antes de confirmar cada trabajo.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">7. Cancelaciones</h3>
        <p>Si el trabajador cancela después de ser aceptado, puede afectar su calificación. Si el contratista cancela, el pago retenido se devuelve íntegramente. Cancelaciones repetidas pueden resultar en suspensión de la cuenta.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">8. Conducta prohibida</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Está prohibido acordar pagos fuera de la plataforma</li>
          <li>Está prohibido crear cuentas falsas</li>
          <li>Está prohibido acosar o discriminar a otros usuarios</li>
          <li>El incumplimiento resulta en suspensión permanente</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">9. Modificaciones</h3>
        <p>TurnoGO puede modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios. El uso continuo de la plataforma después de los cambios constituye aceptación.</p>
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4 text-sm text-gray leading-relaxed">
      <div>
        <h3 className="font-semibold text-dark text-base mb-2">1. Información que recopilamos</h3>
        <p>Recopilamos la información que nos proporcionas al registrarte: nombre completo, correo electrónico, número de teléfono, cédula de identidad y foto de perfil. También recopilamos datos de uso como tu ubicación (para geocerca), historial de trabajos y calificaciones.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">2. ¿Para qué usamos tu información?</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Crear y gestionar tu cuenta</li>
          <li>Conectarte con trabajos o trabajadores adecuados</li>
          <li>Verificar tu identidad y referencias</li>
          <li>Procesar pagos y proteger las transacciones</li>
          <li>Mejorar la plataforma y la experiencia de usuario</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">3. Protección de tu información</h3>
        <p>Tu cédula de identidad se almacena de forma encriptada (hash). Los datos sensibles como contraseñas también están encriptados. Usamos conexiones seguras (HTTPS) en toda la plataforma.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">4. Compartir información</h3>
        <p>No vendemos tu información personal a terceros. Tu nombre, foto y calificaciones son visibles para otros usuarios de la plataforma cuando postulas a un trabajo o cuando un contratista busca trabajadores. Tu número de teléfono se comparte solo cuando un trabajo es confirmado.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">5. Retención de datos</h3>
        <p>Conservamos tu información mientras tengas una cuenta activa. Si eliminas tu cuenta, tus datos personales se eliminan en un plazo de 30 días. El historial de transacciones se conserva por razones legales y fiscales.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">6. Tus derechos</h3>
        <p>Puedes acceder, corregir o eliminar tus datos personales desde la configuración de tu cuenta. Si tienes dudas sobre tu privacidad, contáctanos a través de la plataforma.</p>
      </div>

      <div>
        <h3 className="font-semibold text-dark text-base mb-2">7. Cookies</h3>
        <p>Usamos cookies esenciales para el funcionamiento de la plataforma (sesión, autenticación). No usamos cookies de rastreo publicitario.</p>
      </div>
    </div>
  );
}
