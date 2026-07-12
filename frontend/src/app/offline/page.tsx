import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-light">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-dark mb-2">Sin conexión</h1>
        <p className="text-sm text-gray mb-6">
          No tienes conexión a internet. Algunas páginas pueden no estar disponibles.
          Los datos se actualizarán cuando recuperes la conexión.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  );
}
