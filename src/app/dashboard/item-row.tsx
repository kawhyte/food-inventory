"use client";

import { useState, useRef } from "react";
import { TriangleAlert, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GroupedItem } from "@/lib/types";
import { deleteItem } from "./actions";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface ItemRowProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
}

export function ItemRow({ item, onEdit, onOpenDetail }: ItemRowProps) {
  const daysUntil =
    item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const touchStartX = useRef(0);
  const currentOffset = useRef(0);

  // Configuration
  const MAX_OFFSET = 80;
  const SNAP_THRESHOLD = 40;
  const OPACITY_FADE_START = 20;
  const AUTO_CLOSE_DELAY = 3000;

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return; // Ignore multi-touch
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
    currentOffset.current = swipeOffset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length > 1) return;

    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX.current;
    let newOffset = currentOffset.current + deltaX;

    // Clamp to max offset
    newOffset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, newOffset));

    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const totalDelta = Math.abs(swipeOffset - currentOffset.current);

    // Detect click vs swipe
    if (totalDelta < 5) {
      onOpenDetail(item);
      setSwipeOffset(0);
      return;
    }

    // Snap logic
    if (Math.abs(swipeOffset) > SNAP_THRESHOLD) {
      setSwipeOffset(swipeOffset > 0 ? MAX_OFFSET : -MAX_OFFSET);
    } else {
      setSwipeOffset(0);
    }
  };

  // Action handlers
  const handleEdit = () => {
    onEdit(item);
    setSwipeOffset(0);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), AUTO_CLOSE_DELAY);
    } else {
      await deleteItem(item.id);
      setSwipeOffset(0);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="relative overflow-hidden group touch-pan-y">
      {/* Background action buttons */}
      {/* Delete button (revealed on swipe left) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center pr-4 transition-opacity md:hidden"
        style={{ opacity: swipeOffset < -OPACITY_FADE_START ? 1 : 0 }}
      >
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={handleDelete}
          className="pointer-events-auto"
        >
          {confirmDelete ? (
            <span className="text-xs font-semibold">OK?</span>
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>

      {/* Edit button (revealed on swipe right) */}
      <div
        className="absolute inset-y-0 left-0 flex items-center pl-4 transition-opacity md:hidden"
        style={{ opacity: swipeOffset > OPACITY_FADE_START ? 1 : 0 }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleEdit}
          className="pointer-events-auto"
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      {/* Desktop hover buttons */}
      <div className="hidden md:flex absolute inset-y-0 right-0 items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleEdit}
          className="pointer-events-auto"
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          variant="destructive"
          size="icon-xs"
          onClick={handleDelete}
          className="pointer-events-auto"
        >
          {confirmDelete ? (
            <span className="text-[10px] font-semibold">OK?</span>
          ) : (
            <Trash2 className="size-3" />
          )}
        </Button>
      </div>

      {/* Swipeable content */}
      <div
        className={cn(
          "w-full relative bg-background",
          isDragging ? "transition-none" : "transition-all duration-300"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <button
          type="button"
          className="w-full text-left flex items-center gap-4 p-3 bg-card rounded-2xl mb-2 shadow-sm border-none active:scale-[0.98] transition-transform"
          onClick={() => onOpenDetail(item)}
        >
          {/* Product Image */}
          <img
            src={item.image_url || "https://via.placeholder.com/64?text=No+Image"}
            alt={item.name}
            className="w-16 h-16 rounded-xl object-cover bg-muted shrink-0"
          />

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-base line-clamp-1">{item.name}</p>
              <span className="px-2 py-1 bg-muted text-xs font-medium rounded-full shrink-0">
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              {item.categories?.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.categories.name}
                </p>
              )}
              {daysUntil !== null && (
                <p
                  className={`text-xs flex items-center gap-1 shrink-0 ${
                    daysUntil <= 0
                      ? "text-destructive"
                      : daysUntil <= 3
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {daysUntil <= 3 && daysUntil > 0 && (
                    <TriangleAlert className="size-3 shrink-0" />
                  )}
                  {daysUntil <= 0
                    ? `Expired ${Math.abs(daysUntil)}d ago`
                    : daysUntil <= 3
                    ? `${daysUntil}d left`
                    : new Date(item.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
