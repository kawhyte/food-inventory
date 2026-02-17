"use client";

import { TriangleAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { GroupedItem } from "@/lib/types";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface ItemRowProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
}

export function ItemRow({ item, onEdit }: ItemRowProps) {
  const daysUntil =
    item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

  return (
    <button
      type="button"
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:bg-muted/50"
      onClick={() => onEdit(item)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{item.name}</p>
          {item.categories?.name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.categories.name}
            </p>
          )}
          {daysUntil !== null && (
            <p
              className={`text-xs mt-0.5 flex items-center gap-1 ${
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
                ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
                : daysUntil <= 3
                ? `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`
                : `Expires ${new Date(item.expiry_date!).toLocaleDateString()}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </button>
  );
}
