"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  /** Threshold in px before refresh triggers (default: 80) */
  threshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ pulling, setPulling ] = useState(false);
  const [ pullDistance, setPullDistance ] = useState(0);
  const [ refreshing, setRefreshing ] = useState(false);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate if scrolled to the very top
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pullingRef.current || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        // Apply resistance — feels more natural
        const distance = Math.min(diff * 0.5, threshold * 1.5);
        setPullDistance(distance);
        setPulling(true);
      }
    },
    [refreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{
          height: pulling || refreshing ? pullDistance : 0,
          maxHeight: threshold + 20,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {refreshing ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-6 h-6 text-gray transition-transform duration-200"
              style={{ transform: `rotate(${progress * 180}deg)` }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          <span className="text-xs text-gray">
            {refreshing
              ? "Actualizando..."
              : progress >= 1
              ? "Suelta para actualizar"
              : "Tira hacia abajo"}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
