"use client";
import { useMemo } from "react";
import { DoodleStar } from "@/components/ui/doodle-star";

const STAR_COLORS = ['#2DD4BF', '#FBBF24', '#FB7185'];

export function ConfettiBurst() {
  const stars = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      tx: Math.round(Math.random() * 300 - 150),
      ty: -(Math.round(Math.random() * 200 + 200)),
      rot: Math.round(Math.random() * 360),
      delay: i * 45 + Math.round(Math.random() * 70),
      duration: 750 + Math.round(Math.random() * 350),
      size: 14 + Math.round(Math.random() * 10),
      color: STAR_COLORS[i % 3],
    }))
  , []);

  return (
    <div className="fixed bottom-[12vh] left-1/2 -translate-x-1/2 pointer-events-none z-[51]">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute animate-confetti-star"
          style={{
            '--tx': `${s.tx}px`,
            '--ty': `${s.ty}px`,
            '--rot': `${s.rot}deg`,
            '--duration': `${s.duration}ms`,
            animationDelay: `${s.delay}ms`,
          } as React.CSSProperties}
        >
          <DoodleStar color={s.color} size={s.size} />
        </div>
      ))}
    </div>
  );
}
