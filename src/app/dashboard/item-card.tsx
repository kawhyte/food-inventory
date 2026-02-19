"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package, MoreHorizontal } from "lucide-react";
import type { GroupedItem } from "@/lib/types";

interface ItemCardProps {
  item: GroupedItem;
  onEdit: (item: GroupedItem) => void;
  onOpenDetail: (item: GroupedItem) => void;
  onOpenActionMenu: (item: GroupedItem) => void;
}

export function ItemCard({ item, onEdit, onOpenDetail, onOpenActionMenu }: ItemCardProps) {
  return (
    <div className="relative">
      <Card
        className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => onOpenDetail(item)}
      >
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

      {/* Context Menu Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
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
