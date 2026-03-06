"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

const CATEGORIES = [
  { key: 'produce', label: 'Produce', color: '#4ADE80', hint: "Pick up some fresh greens or fruit on your next trip!" },
  { key: 'dairy',   label: 'Dairy',   color: '#7DD3FC', hint: "Maybe snag some yogurt or milk!" },
  { key: 'protein', label: 'Protein', color: '#FB7185', hint: "Grab some chicken, eggs, or beans." },
  { key: 'grains',  label: 'Grains',  color: '#FBBF24', hint: "Some pasta or rice would round things out." },
  { key: 'drinks',  label: 'Drinks',  color: '#2DD4BF', hint: "Grab some juice or sparkling water." },
  { key: 'frozen',  label: 'Frozen',  color: '#BAE6FD', hint: "Some frozen veg or meals would fill the gap!" },
] as const;

function mapCategory(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('produce') || n.includes('fruit') || n.includes('vegetable')) return 'produce';
  if (n.includes('dairy')) return 'dairy';
  if (n.includes('meat') || n.includes('seafood') || n.includes('fish') || n.includes('protein')) return 'protein';
  if (n.includes('grain') || n.includes('bread') || n.includes('bakery') || n.includes('pantry')) return 'grains';
  if (n.includes('beverage') || n.includes('drink')) return 'drinks';
  if (n.includes('frozen')) return 'frozen';
  return null;
}

function calculateDiversityScore(items: GroupedItem[]): { score: number; present: Set<string> } {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const relevant = items.filter(item => {
    if (item.status !== 'archived') return true;
    if (!item.updated_at) return false;
    return now - new Date(item.updated_at).getTime() <= sevenDays;
  });
  const present = new Set<string>();
  for (const item of relevant) {
    if (!item.categories?.name) continue;
    const cat = mapCategory(item.categories.name);
    if (cat) present.add(cat);
  }
  return { score: Math.round((present.size / 6) * 100), present };
}

// SVG layout constants
const CX = 155;
const CY = 145;
const RADII = [30, 50, 70, 90, 110, 130] as const;
const WOBBLES = [3, -4, 5, -3, 4, -5] as const;

function semiArcPath(r: number, w: number): string {
  const k = 0.5523; // cubic bezier kappa for circle approximation
  const x0 = CX - r, x1 = CX + r, yt = CY - r;
  return (
    `M ${x0} ${CY} ` +
    `C ${x0 + w} ${CY - r * k + w} ${CX - r * k - w} ${yt + w} ${CX} ${yt} ` +
    `C ${CX + r * k + w} ${yt - w} ${x1 - w} ${CY - r * k - w} ${x1} ${CY}`
  );
}

function DoodleRainbow({ present }: { present: Set<string> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className={`transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <svg viewBox="0 0 310 150" width="100%" aria-hidden="true" style={{ maxWidth: 310 }}>
        {/* Colored band fills */}
        {CATEGORIES.map((cat, i) => {
          if (!present.has(cat.key)) return null;
          return (
            <path
              key={`fill-${cat.key}`}
              d={semiArcPath(RADII[i], WOBBLES[i])}
              fill="none"
              stroke={cat.color}
              strokeWidth={20}
              strokeLinecap="butt"
            />
          );
        })}
        {/* Ink outlines */}
        {CATEGORIES.map((cat, i) => {
          const isPresent = present.has(cat.key);
          return (
            <path
              key={`arc-${cat.key}`}
              d={semiArcPath(RADII[i], WOBBLES[i])}
              fill="none"
              stroke="#1E293B"
              strokeWidth={1.5}
              strokeDasharray={isPresent ? undefined : '5 4'}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

function scoreDescriptor(score: number): string {
  if (score === 100) return 'Full rainbow!';
  if (score >= 83)   return 'Almost there';
  if (score >= 66)   return 'Great variety';
  if (score >= 50)   return 'Good mix';
  if (score >= 33)   return 'Building up';
  return 'Just getting started';
}

export function InsightsTab({ items }: { items: GroupedItem[] }) {
  const { score, present } = useMemo(() => calculateDiversityScore(items), [items]);
  const [tip, setTip] = useState<typeof CATEGORIES[number] | null>(null);

  useEffect(() => {
    const missing = CATEGORIES.filter(c => !present.has(c.key));
    setTip(missing.length > 0 ? missing[Math.floor(Math.random() * missing.length)] : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="px-4 pb-28 md:pb-8 pt-6 animate-fade-in">
      {/* Score card */}
      <div className="rounded-[12px_20px_8px_18px] border-2 border-pantry-ink shadow-[4px_4px_0px_0px_#1E293B] bg-pantry-paper p-4 flex flex-col items-center gap-3">
        <DoodleRainbow present={present} />
        <div className="text-center">
          <div className="font-handwritten font-bold text-5xl text-pantry-ink">{score}%</div>
          <div className="font-handwritten font-semibold text-pantry-ink text-base mt-0.5">{scoreDescriptor(score)}</div>
          <div className="font-handwritten text-pantry-ink/50 text-xs mt-0.5">Kitchen Diversity</div>
        </div>
        {/* Category legend — 3×2 grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 w-full px-2">
          {CATEGORIES.map(cat => {
            const isPresent = present.has(cat.key);
            return (
              <div key={cat.key} className={`flex items-center gap-1.5 font-handwritten text-sm ${isPresent ? 'text-pantry-ink' : 'text-pantry-ink/40'}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color, opacity: isPresent ? 1 : 0.4 }} />
                <span className="truncate">{cat.label}</span>
                <span className="ml-auto">{isPresent ? '✓' : '–'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chef's Tip */}
      <div className="mt-4">
        {score === 100 ? (
          <div className="rounded-[10px_18px_6px_14px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] bg-pantry-leaf/20 p-4">
            <p className="font-handwritten font-bold text-pantry-ink text-sm">
              Your pantry is a full rainbow! Great variety this week.
            </p>
          </div>
        ) : tip ? (
          <div className="rounded-[10px_18px_6px_14px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] bg-pantry-mustard/20 p-4 flex items-start gap-3">
            <Lightbulb className="size-5 text-pantry-ink shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="font-handwritten text-pantry-ink text-sm">
              <span className="font-bold">Missing {tip.label}?</span> {tip.hint}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
