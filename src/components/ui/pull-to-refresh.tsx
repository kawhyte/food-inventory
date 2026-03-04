"use client";

import { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 70;

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const canPull = useRef(false);
  const pullDistRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      canPull.current = true;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!canPull.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullDistRef.current > 0) {
          pullDistRef.current = 0;
          setPullDistance(0);
        }
        return;
      }
      const dist = Math.min(delta * 0.5, THRESHOLD);
      pullDistRef.current = dist;
      setPullDistance(dist);
      e.preventDefault();
    }

    async function handleTouchEnd() {
      if (!canPull.current) return;
      canPull.current = false;
      const dist = pullDistRef.current;
      pullDistRef.current = 0;
      setPullDistance(0);

      if (dist >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        const minDelay = new Promise<void>((r) => setTimeout(r, 600));
        try {
          await Promise.all([onRefreshRef.current?.(), minDelay]);
        } finally {
          refreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const indicatorTranslateY = isRefreshing
    ? 0
    : -56 + (pullDistance / THRESHOLD) * 56;

  const rotation = (pullDistance / THRESHOLD) * 360;

  return (
    <div ref={containerRef} className="relative" style={{ overscrollBehaviorY: "contain" }}>
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 top-0 z-20 pointer-events-none"
        style={{ transform: `translateX(-50%) translateY(${indicatorTranslateY}px)` }}
      >
        <div className="w-12 h-12 flex items-center justify-center border-2 border-pantry-ink rounded-full bg-pantry-paper shadow-[2px_2px_0px_0px_#1E293B]">
          <RotateCcw
            className={cn("size-5 text-pantry-ink", isRefreshing && "animate-spin")}
            style={isRefreshing ? undefined : { transform: `rotate(${rotation}deg)` }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
