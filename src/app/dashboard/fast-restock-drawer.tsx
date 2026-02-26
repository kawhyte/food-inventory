"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { processRestock } from "./actions";
import type { GroupedItem } from "@/lib/types";

interface FastRestockDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemsToRestock: GroupedItem[];
  onComplete: () => void;
}

export function FastRestockDrawer({
  open,
  onOpenChange,
  itemsToRestock,
  onComplete,
}: FastRestockDrawerProps) {
  const [drafts, setDrafts] = useState<
    Record<string, { quantity: number; expiry_date: string }>
  >({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, { quantity: number; expiry_date: string }> = {};
    for (const item of itemsToRestock) {
      init[item.id] = { quantity: item.quantity ?? 1, expiry_date: "" };
    }
    setDrafts(init);
  }, [itemsToRestock]);

  function setQuantity(id: string, qty: number) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: Math.max(1, qty) },
    }));
  }

  function setExpiryDate(id: string, date: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], expiry_date: date },
    }));
  }

  async function handleSave() {
    setSaving(true);
    const updates = Object.entries(drafts).map(([id, d]) => ({ id, ...d }));
    const result = await processRestock(updates);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onComplete();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] p-0 flex flex-col rounded-t-3xl"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

        <SheetHeader className="sr-only">
          <SheetTitle>Fast Restock</SheetTitle>
          <SheetDescription>
            Set quantities and expiration dates before saving to pantry.
          </SheetDescription>
        </SheetHeader>

        <h2 className="text-xl font-bold px-4 pt-3 pb-2">
          Set Expiration Dates
        </h2>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {itemsToRestock.map((item) => {
            const draft = drafts[item.id];
            if (!draft) return null;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 bg-muted/30 rounded-2xl mb-3"
              >
                <span className="font-bold text-base">{item.name}</span>
                <div className="flex gap-3">
                  {/* Quantity stepper */}
                  <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2">
                    <button
                      onClick={() => setQuantity(item.id, draft.quantity - 1)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {draft.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.id, draft.quantity + 1)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Date input */}
                  <input
                    type="date"
                    value={draft.expiry_date}
                    onChange={(e) => setExpiryDate(item.id, e.target.value)}
                    className="flex-1 bg-background rounded-xl px-4 py-2 text-sm border-none outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 pt-0">
          <Button
            className="w-full h-14 rounded-full text-lg"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save to Pantry"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
