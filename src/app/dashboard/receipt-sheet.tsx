"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createItems } from "@/app/dashboard/actions";
import type { LocationRow } from "@/lib/types";

interface ReceiptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: string[];
  locations: LocationRow[];
}

export function ReceiptSheet({
  open,
  onOpenChange,
  items,
  locations,
}: ReceiptSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [locationId, setLocationId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset state whenever the sheet opens with new items
  useEffect(() => {
    if (open) {
      const initialChecked: Record<string, boolean> = {};
      const initialNames: Record<string, string> = {};
      items.forEach((name, i) => {
        const key = `${i}`;
        initialChecked[key] = true;
        initialNames[key] = name;
      });
      setChecked(initialChecked);
      setNames(initialNames);
      setLocationId("");
      setExpiryDate("");
      setServerError(null);
    }
  }, [open, items]);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const canSubmit = checkedCount > 0 && locationId !== "";

  function handleSubmit() {
    setServerError(null);
    const toAdd = items
      .map((_, i) => ({ key: `${i}`, name: names[`${i}`]?.trim() }))
      .filter(({ key, name }) => checked[key] && name);

    startTransition(async () => {
      const result = await createItems(
        toAdd.map(({ name }) => ({
          name: name!,
          location_id: locationId,
          expiry_date: expiryDate || undefined,
        }))
      );
      if (result.error) {
        setServerError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>
            Add from Receipt
            {checkedCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {checkedCount} item{checkedCount !== 1 ? "s" : ""} selected
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No items were detected on this receipt.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((_, i) => {
                const key = `${i}`;
                return (
                  <div key={key} className="flex items-center gap-3 py-2.5">
                    <input
                      type="checkbox"
                      id={`item-${key}`}
                      checked={checked[key] ?? true}
                      onChange={(e) =>
                        setChecked((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="size-4 rounded border-border accent-primary flex-shrink-0"
                    />
                    <Input
                      value={names[key] ?? ""}
                      onChange={(e) =>
                        setNames((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      disabled={!checked[key]}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Shared location + expiry for all selected items */}
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label>Location (required)</Label>
              <Select onValueChange={setLocationId} value={locationId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Expiry date (optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              `Add ${checkedCount} item${checkedCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
