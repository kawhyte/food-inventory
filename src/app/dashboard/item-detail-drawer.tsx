"use client";

import { Package, MapPin, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { GroupedItem } from "@/lib/types";

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface ItemDetailDrawerProps {
  item: GroupedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: GroupedItem) => void;
}

export function ItemDetailDrawer({ item, open, onOpenChange, onEdit }: ItemDetailDrawerProps) {
  if (!item) return null;

  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

  function handleEdit() {
    if (!item) return;
    onEdit(item);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Item Details</SheetTitle>
          <SheetDescription>View item details and edit</SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image */}
          <div className="bg-muted flex items-center justify-center aspect-square">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-full object-contain"
              />
            ) : (
              <Package className="size-20 text-muted-foreground/40" />
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            {/* Item Name */}
            <h2 className="text-xl font-bold">{item.name}</h2>

            {/* Location */}
            {item.locations?.name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span className="text-sm">{item.locations.name}</span>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={item.status} />
            </div>

            {/* Expiry Date */}
            {daysUntil !== null && (
              <div
                className={`text-sm ${
                  daysUntil <= 0
                    ? "text-destructive"
                    : daysUntil <= 3
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1">
                  {daysUntil <= 3 && daysUntil > 0 && (
                    <TriangleAlert className="size-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {daysUntil <= 0
                      ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
                      : daysUntil <= 3
                      ? `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`
                      : `Expires ${new Date(item.expiry_date!).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            )}

            {/* Category */}
            {item.categories?.name && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Category:</span> {item.categories.name}
              </div>
            )}

            {/* Barcode */}
            {item.barcode && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Barcode:</span> {item.barcode}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="p-6 pt-0">
          <Button onClick={handleEdit} className="w-full">
            Edit Details
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
