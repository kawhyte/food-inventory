"use client";

import { ShoppingBag, MapPin, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { format } from "date-fns";
import type { GroupedItem } from "@/lib/types";
import { getGracePeriodDays } from "@/lib/expiration-rules";

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
  onConsume: (item: GroupedItem) => void;
  onToss: (item: GroupedItem) => void;
}

export function ItemDetailDrawer({ item, open, onOpenChange, onEdit, onConsume, onToss }: ItemDetailDrawerProps) {
  if (!item) return null;

  const daysUntil = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;
  const isPast = item.expiry_date ? new Date() > new Date(item.expiry_date) : false;
  const daysPast = isPast
    ? Math.floor((new Date().getTime() - new Date(item.expiry_date!).getTime()) / (1000 * 3600 * 24))
    : 0;
  const graceDays = getGracePeriodDays(item.categories?.name, item.locations?.name);
  const isHardExpired = isPast && daysPast > graceDays;
  const isSoftExpired = isPast && daysPast <= graceDays && graceDays > 0;

  const formattedExpiryDate = item.expiry_date
    ? format(new Date(item.expiry_date), 'MMM d, yyyy')
    : '';
  const safeDate = item.expiry_date
    ? new Date(new Date(item.expiry_date).getTime() + graceDays * 24 * 60 * 60 * 1000)
    : null;
  const formattedSafeDate = safeDate ? format(safeDate, 'MMM d, yyyy') : '';

  function handleEdit() {
    if (!item) return;
    onEdit(item);
    onOpenChange(false);
  }

  function handleConsume() {
    if (!item) return;
    onConsume(item);
    onOpenChange(false);
  }

  function handleToss() {
    if (!item) return;
    onToss(item);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] p-0 flex flex-col bg-pantry-paper border-t-[3px] border-l-[3px] border-r-[3px] border-pantry-ink rounded-t-[24px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Item Details</SheetTitle>
          <SheetDescription>View item details and edit</SheetDescription>
        </SheetHeader>

        {/* Sheet Handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-pantry-ink/25" />

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
            <h2 className="text-2xl font-handwritten font-bold text-pantry-ink">{item.name}</h2>
            {item.categories && (
              <p className="text-muted-foreground">{item.categories.name}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="px-6 grid grid-cols-2 gap-3 pb-4">

            {/* Quantity/Unit Card */}
            <div className="bg-pantry-paper p-4 rounded-[12px_20px_8px_18px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] space-y-1">
              <p className="text-xs font-handwritten font-bold text-pantry-ink/50 uppercase tracking-wide">Quantity</p>
              <p className="text-2xl font-bold">
                {item.quantity} {item.unit || 'units'}
              </p>
            </div>

            {/* Expiry Date Card */}
            <div className="bg-pantry-paper p-4 rounded-[18px_8px_16px_10px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] space-y-1">
              <p className="text-xs font-handwritten font-bold text-pantry-ink/50 uppercase tracking-wide">Expires</p>
              <p className="text-base font-semibold">
                {item.expiry_date
                  ? format(new Date(item.expiry_date), 'MMM d, yyyy')
                  : 'No date set'}
              </p>
            </div>

            {/* Location Card (full width) */}
            {item.locations && (
              <div className="col-span-2 bg-pantry-paper p-4 rounded-[10px_16px_12px_20px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] space-y-1">
                <p className="text-xs font-handwritten font-bold text-pantry-ink/50 uppercase tracking-wide">Location</p>
                <p className="text-lg font-semibold"><MapPin className="size-3.5 inline mr-1 text-pantry-ink/50" />{item.locations.name}</p>
              </div>
            )}
          </div>

          {/* Freshness banners */}
          {isHardExpired && (
            <div className="mx-6 mb-4 bg-destructive/10 text-destructive border-2 border-destructive rounded-[10px_16px_8px_14px] p-3 text-sm font-medium flex gap-2">
              <TriangleAlert className="size-4 shrink-0 mt-0.5" />
              <span>Exceeded its USDA safe-consumption window on {formattedSafeDate}. For health and safety, this should be discarded.</span>
            </div>
          )}
          {isSoftExpired && (
            <div className="mx-6 mb-4 bg-orange-500/10 text-orange-600 border-2 border-orange-400 rounded-[14px_8px_12px_10px] p-3 text-sm font-medium flex gap-2">
              <TriangleAlert className="size-4 shrink-0 mt-0.5" />
              <span>Passed Best-By date on {formattedExpiryDate}. Based on USDA guidelines for this category, it is still safe to consume until {formattedSafeDate}.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 pb-8 pt-2 flex flex-col gap-3">
          <div className="flex gap-3">
            {!isHardExpired && (
              <button className="flex-1 h-12 rounded-[14px_12px_14px_12px] border-2 border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] bg-pantry-ink/5 text-pantry-ink font-handwritten font-bold text-base active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all" onClick={handleConsume}>Consume 1</button>
            )}
            <button className={`h-12 rounded-[12px_14px_12px_14px] border-2 border-pantry-coral shadow-[3px_3px_0px_0px_#FB7185] bg-pantry-coral/10 text-pantry-coral font-handwritten font-bold text-base active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all ${isHardExpired ? 'w-full' : 'flex-1'}`} onClick={handleToss}>Toss</button>
          </div>
          <button className="w-full h-12 rounded-[10px_18px_12px_20px] border-2 border-pantry-ink bg-pantry-teal text-pantry-ink font-handwritten font-bold text-base shadow-[3px_3px_0px_0px_#1E293B] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all" onClick={handleEdit}>Edit Details</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
