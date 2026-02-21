"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MoreHorizontal, TriangleAlert } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface ItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
  onOpenActionMenu: (item: GroupedItem) => void;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ItemCard({ item, onEdit, onOpenDetail, onOpenActionMenu }: ItemCardProps) {
  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

  return (
    <div className="relative">
      <Card
        className="border-none shadow-sm rounded-3xl overflow-hidden bg-card h-full flex flex-col hover:bg-muted/50 transition-colors active:scale-[0.98] transition-transform duration-200 cursor-pointer"
        onClick={() => onOpenDetail(item)}
      >
        {/* Image */}
        <div className="bg-muted flex items-center justify-center h-32 w-full relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="size-12 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="font-bold leading-tight line-clamp-2">{item.name}</p>
          {item.categories?.name && (
            <p className="text-xs text-muted-foreground truncate">
              {item.categories.name}
            </p>
          )}
          <p className="text-xs font-medium text-muted-foreground">
            {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </p>
          {daysUntil !== null && (
            <p
              className={`text-xs mt-auto flex items-center gap-1 ${
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
      </Card>

      {/* Context Menu Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur hover:bg-background"
        onClick={(e) => {
          e.stopPropagation();
          onOpenActionMenu(item);
        }}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
