"use client";

import { useState, useEffect, useRef } from "react";

export default function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    // If value is 0, just show it immediately
    if (value === 0) {
      setDisplay(0);
      return;
    }

    // Clear any previous animation
    if (timerRef.current) clearInterval(timerRef.current);

    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (current >= steps) {
        setDisplay(value);
        clearInterval(timer);
      }
    }, stepTime);

    timerRef.current = timer;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [value, duration]);

  return (
    <span>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
