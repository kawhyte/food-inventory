"use client";
import { Ghost } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface GraveyardTabProps {
  items: GroupedItem[];
}

export function GraveyardTab({ items }: GraveyardTabProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
        <Ghost className="size-16 text-pantry-ink/20" />
        <p className="font-handwritten font-bold text-pantry-ink/40 text-lg">Nothing here yet</p>
        <p className="font-handwritten text-pantry-ink/30 text-sm">Tossed or finished items will rest here.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3 pb-28">
      <p className="font-handwritten text-pantry-ink/40 text-xs px-1">{items.length} item{items.length !== 1 ? "s" : ""} archived</p>
      {items.map((item) => (
        <div
          key={item.id}
          className="opacity-50 flex items-center gap-3 p-4 border-2 border-dashed border-pantry-ink/40 rounded-[14px_18px_16px_12px]"
        >
          <Ghost className="size-5 text-pantry-ink/40 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-handwritten font-semibold text-pantry-ink truncate">{item.name}</p>
            {item.categories?.name && (
              <p className="font-handwritten text-xs text-pantry-ink/50">{item.categories.name}</p>
            )}
          </div>
          <span className="text-xs font-handwritten text-pantry-ink/40 shrink-0">
            {item.quantity} {item.unit ?? "units"}
          </span>
        </div>
      ))}
    </div>
  );
}
