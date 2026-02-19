"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface ItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
}

export function ItemCard({ item, onEdit }: ItemCardProps) {
  return (
    <button
      type="button"
      className="w-full text-left focus-visible:outline-none"
      onClick={() => onEdit(item)}
    >
      <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
        {/* Image */}
        <div className="bg-muted flex items-center justify-center aspect-square">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Package className="size-10 text-muted-foreground/40" />
          )}
        </div>
        {/* Content */}
        <div className="p-2 flex flex-col gap-1 flex-1">
          <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </p>
          <div className="mt-auto pt-1">
            <StatusBadge status={item.status} />
          </div>
        </div>
      </Card>
    </button>
  );
}
