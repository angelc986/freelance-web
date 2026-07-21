"use client";

import { useRouter } from "next/navigation";

export function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

export default function BackButton({ href, onClick, label }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  if (label) {
    return (
      <button
        onClick={handleClick}
        className="btn-ripple inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm text-gray font-medium rounded-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
      >
        <IconArrowLeft className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-8 h-8 rounded-xl bg-gray-100 text-gray hover:bg-gray-200 hover:text-primary transition-all flex items-center justify-center"
      aria-label="Volver"
    >
      <IconArrowLeft className="w-[18px] h-[18px]" />
    </button>
  );
}
