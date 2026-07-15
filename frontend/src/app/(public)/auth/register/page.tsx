"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/auth?screen=register"); }, [router]);
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm">Redirigiendo…</div>
    </div>
  );
}
