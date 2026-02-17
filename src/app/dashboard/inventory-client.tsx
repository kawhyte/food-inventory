"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBasket, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemSheet } from "@/app/dashboard/item-sheet";
import { ItemRow } from "@/app/dashboard/item-row";
import { signOut } from "@/app/auth/actions";
import type { GroupedItem, LocationRow, CategoryRow } from "@/lib/types";

interface InventoryClientProps {
  groupedItems: Record<string, GroupedItem[]>;
  locations: LocationRow[];
  categories: CategoryRow[];
  householdId: string;
}

export function InventoryClient({
  groupedItems,
  locations,
  categories,
  householdId,
}: InventoryClientProps) {
  const router = useRouter();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedItem | null>(null);

  // Realtime subscription — refresh page data when items change
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("items-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  const locationNames = Object.keys(groupedItems).sort();
  const hasItems = locationNames.length > 0;

  return (
    <main className="min-h-svh max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingBasket className="size-5 text-primary" />
          Food Inventory
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddSheetOpen(true)}>
            <Plus className="size-4" />
            Add item
          </Button>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" title="Sign out">
              <LogOut className="size-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Item list */}
      <div className="pb-8">
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
            <ShoppingBasket className="size-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No items yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first item to get started.
              </p>
            </div>
            <Button onClick={() => setAddSheetOpen(true)}>
              <Plus className="size-4" />
              Add item
            </Button>
          </div>
        ) : (
          locationNames.map((locationName, index) => (
            <div key={locationName}>
              {index > 0 && <Separator />}
              <div className="px-4 pt-5 pb-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {locationName}
                  <span className="ml-2 font-normal normal-case">
                    ({groupedItems[locationName].length})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {groupedItems[locationName].map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={setEditingItem}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Single shared sheet for add + edit */}
      <ItemSheet
        open={addSheetOpen || editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddSheetOpen(false);
            setEditingItem(null);
          }
        }}
        item={editingItem ?? undefined}
        locations={locations}
        categories={categories}
      />
    </main>
  );
}
