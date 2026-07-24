"use client";

import { useId } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const gradientId = useId();
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 36, text: "text-xl" },
    lg: { icon: 48, text: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <div className="relative" style={{ width: s.icon, height: s.icon }}>
        <svg
          className="logo-svg"
          width={s.icon}
          height={s.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>

          <circle cx="24" cy="24" r="22" fill={`url(#${gradientId})`} />

          {/* Stylized "T" that also looks like a target/location */}
          <path
            d="M15 16h18M24 16v16"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Motion arc (suggesting "GO" - movement) */}
          <path
            d="M33 28c3-2.5 4-6 3.5-9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Dot at end of arc (speed line) */}
          <circle cx="36.5" cy="19" r="1.5" fill="white" opacity="0.6" />

          {/* Small accent dot */}
          <circle cx="24" cy="24" r="3" fill="white" opacity="0.3" />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`}>
          Turno<span className="text-primary">GO</span>
        </span>
      )}
    </div>
  );
}
