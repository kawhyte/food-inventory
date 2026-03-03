"use client";
import { ShoppingCart, Archive } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface PostMortemModalProps {
  item: GroupedItem | null;
  onRestock: () => void;
  onGraveyard: () => void;
  onDismiss: () => void;
}

export function PostMortemModal({ item, onRestock, onGraveyard, onDismiss }: PostMortemModalProps) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pantry-ink/30 backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="bg-pantry-paper border-[3px] border-pantry-ink rounded-[18px_22px_20px_16px] shadow-[6px_6px_0px_0px_#1E293B] p-6 w-full max-w-sm flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="font-handwritten font-bold text-pantry-ink text-xl">{item.name} is gone!</p>
          <p className="font-handwritten text-pantry-ink/60 text-sm mt-1">What should we do?</p>
        </div>
        {/* Restock */}
        <button
          onClick={onRestock}
          className="w-full h-12 rounded-[12px_16px_14px_10px] border-2 border-pantry-ink bg-pantry-teal text-pantry-ink font-handwritten font-bold text-base shadow-[4px_4px_0px_0px_#1E293B] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart className="size-4" />
          Restock It
        </button>
        {/* Graveyard */}
        <button
          onClick={onGraveyard}
          className="w-full h-10 rounded-[10px_14px_12px_8px] border-2 border-pantry-ink/30 bg-transparent text-pantry-ink/60 font-handwritten font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:bg-pantry-ink/5"
        >
          <Archive className="size-4" />
          Send to Graveyard
        </button>
      </div>
    </div>
  );
}
