"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingBag, MoreHorizontal, TriangleAlert } from "lucide-react";
import type { GroupedItem } from "@/lib/types";
import { getGracePeriodDays } from "@/lib/expiration-rules";

interface ItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
  onConsume: (item: GroupedItem) => void;
  onToss: (item: GroupedItem) => void;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ItemCard({ item, onEdit, onOpenDetail, onConsume, onToss }: ItemCardProps) {
  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
  const isPast = item.expiry_date ? new Date() > new Date(item.expiry_date) : false;
  const daysPast = isPast
    ? Math.floor((new Date().getTime() - new Date(item.expiry_date!).getTime()) / (1000 * 3600 * 24))
    : 0;
  const graceDays = getGracePeriodDays(item.categories?.name, item.locations?.name);
  const isHardExpired = isPast && daysPast > graceDays;
  const isSoftExpired = isPast && daysPast <= graceDays && graceDays > 0;

  const formattedExpiryDate = item.expiry_date
    ? new Date(item.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const safeDate = item.expiry_date
    ? new Date(new Date(item.expiry_date).getTime() + graceDays * 24 * 60 * 60 * 1000)
    : null;
  const formattedSafeDate = safeDate
    ? safeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="relative mt-2 overflow-visible">
      {/* Main card */}
      <div
        className="bg-white border-2 border-pantry-ink rounded-[15px_15px_30px_5px] shadow-[4px_4px_0px_0px_#1E293B] transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] overflow-hidden"
        onClick={() => onOpenDetail(item)}
      >
        {/* Image area */}
        <div className="relative aspect-square w-full">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-contain bg-pantry-paper"
            />
          ) : (
            <div className="w-full h-full bg-pantry-paper border-b-2 border-pantry-ink/30 flex items-center justify-center">
              <ShoppingBag className="size-10 text-pantry-ink/20" />
            </div>
          )}

          {/* Quantity sticker */}
          <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full border-2 border-pantry-ink bg-pantry-mustard flex items-center justify-center text-xs font-bold font-handwritten">
            {item.quantity}
          </div>
        </div>

        {/* Name strip */}
        <div className="p-2 border-t-2 border-pantry-ink">
          <p className="font-handwritten font-bold text-sm leading-tight line-clamp-2 text-pantry-ink">
            {item.name}
          </p>
          {daysUntil !== null && (
            <p
              className={`text-[10px] mt-1 flex items-center gap-1 ${
                isHardExpired
                  ? "text-destructive font-bold"
                  : isSoftExpired
                  ? "text-orange-500 font-medium"
                  : !isPast && daysUntil! <= 2
                  ? "text-destructive font-bold"
                  : !isPast && daysUntil! <= 3
                  ? "text-amber-600"
                  : "text-pantry-ink/50"
              }`}
            >
              {!isPast && daysUntil! <= 2 && daysUntil! > 0 && (
                <TriangleAlert className="size-3 shrink-0" />
              )}
              {isHardExpired
                ? `Expired (${formattedSafeDate})`
                : isSoftExpired
                ? `Safe until ${formattedSafeDate}`
                : daysUntil! <= 3
                ? `${daysUntil}d left`
                : `Best by ${formattedExpiryDate}`}
            </p>
          )}
        </div>
      </div>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full border border-pantry-ink/40 bg-white/80 flex items-center justify-center active:scale-95 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
          {!isHardExpired && (
            <DropdownMenuItem onClick={() => onConsume(item)}>Consume 1</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onToss(item)} className="text-destructive">Toss</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
