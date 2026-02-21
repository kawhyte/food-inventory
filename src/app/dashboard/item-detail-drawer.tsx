"use client";

import { ShoppingBag, MapPin, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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

        {/* Sheet Handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image */}
          <div className="relative h-48 bg-gradient-to-b from-muted/30 to-background rounded-b-3xl overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-contain p-6"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="size-20 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="px-6 py-4 space-y-1">
            <h2 className="text-2xl font-bold">{item.name}</h2>
            {item.categories && (
              <p className="text-muted-foreground">{item.categories.name}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="px-6 grid grid-cols-2 gap-3 pb-4">
            {/* Quantity/Unit Card */}
            <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Quantity</p>
              <p className="text-2xl font-bold">
                {item.quantity} {item.unit || 'units'}
              </p>
            </div>

            {/* Expiry Date Card */}
            <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Expires</p>
              <p className="text-base font-semibold">
                {item.expiry_date
                  ? format(new Date(item.expiry_date), 'MMM d, yyyy')
                  : 'No date set'}
              </p>
            </div>

            {/* Location Card (full width) */}
            {item.locations && (
              <div className="col-span-2 bg-muted/30 p-4 rounded-2xl space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="text-lg font-semibold">{item.locations.name}</p>
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
