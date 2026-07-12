import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-light">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-dark mb-2">404</h1>
        <p className="text-xl font-semibold text-dark mb-2">Página no encontrada</p>
        <p className="text-sm text-gray mb-8">
          La página que buscas no existe o fue movida. Revisa la URL o vuelve al inicio.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Ir al inicio
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 text-gray hover:text-dark border border-gray-200 rounded-xl font-medium hover:border-gray-300 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
      <div className="mt-12">
        <Logo size="sm" />
      </div>
    </div>
  );
}
