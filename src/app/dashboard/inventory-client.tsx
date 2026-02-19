"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, ShoppingBasket, LogOut, ScanLine, Loader2, Bell, BellRing, ReceiptText } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { fetchProductByBarcode } from "@/lib/openfoodfacts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemSheet } from "@/app/dashboard/item-sheet";
import { ItemRow } from "@/app/dashboard/item-row";
import { ReceiptSheet } from "@/app/dashboard/receipt-sheet";
import { signOut } from "@/app/auth/actions";
import { subscribeToPush, getNotificationPermission } from "@/lib/push";
import type { GroupedItem, LocationRow, CategoryRow, ScanResult } from "@/lib/types";

const BarcodeScanner = dynamic(
  () => import("./barcode-scanner").then((m) => ({ default: m.BarcodeScanner })),
  { ssr: false }
);

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<string[]>([]);
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    setIsFetchingProduct(true);
    const result = await fetchProductByBarcode(barcode);
    setIsFetchingProduct(false);
    setScanData(result);
    setAddSheetOpen(true);
  }

  function handleSheetClose(open: boolean) {
    if (!open) {
      setAddSheetOpen(false);
      setEditingItem(null);
      setScanData(null);
    }
  }

  async function handleNotificationClick() {
    const result = await subscribeToPush();
    setNotifPermission(result);
  }

  async function handleReceiptFile(file: File) {
    setIsParsingReceipt(true);
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/parse-receipt", { method: "POST", body: formData });
    const data = await res.json();
    setIsParsingReceipt(false);
    setReceiptItems(data.items ?? []);
    setReceiptSheetOpen(true);
  }

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
          {notifPermission !== "denied" && notifPermission !== "unsupported" && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNotificationClick}
              disabled={notifPermission === "granted"}
              title={notifPermission === "granted" ? "Notifications enabled" : "Enable notifications"}
              className="relative"
            >
              {notifPermission === "granted" ? (
                <BellRing className="size-4" />
              ) : (
                <>
                  <Bell className="size-4" />
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-500" />
                </>
              )}
              <span className="sr-only">
                {notifPermission === "granted" ? "Notifications enabled" : "Enable notifications"}
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingReceipt}
            title="Scan receipt"
          >
            {isParsingReceipt ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ReceiptText className="size-4" />
            )}
            <span className="sr-only">Scan receipt</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScannerOpen(true)}
            disabled={isFetchingProduct}
            title="Scan barcode"
          >
            {isFetchingProduct ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanLine className="size-4" />
            )}
            <span className="sr-only">Scan barcode</span>
          </Button>
          <Button size="sm" onClick={() => { setScanData(null); setAddSheetOpen(true); }}>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanLine className="size-4" />
                Scan barcode
              </Button>
              <Button onClick={() => { setScanData(null); setAddSheetOpen(true); }}>
                <Plus className="size-4" />
                Add item
              </Button>
            </div>
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

      {/* Barcode scanner overlay */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Single shared sheet for add + edit */}
      <ItemSheet
        open={addSheetOpen || editingItem !== null}
        onOpenChange={handleSheetClose}
        item={editingItem ?? undefined}
        locations={locations}
        categories={categories}
        scanData={scanData ?? undefined}
      />

      {/* Receipt review sheet */}
      <ReceiptSheet
        open={receiptSheetOpen}
        onOpenChange={setReceiptSheetOpen}
        items={receiptItems}
        locations={locations}
      />

      {/* Hidden file input for receipt photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptFile(file);
          e.target.value = "";
        }}
      />
    </main>
  );
}
