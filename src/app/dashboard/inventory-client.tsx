"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Home, Plus, Settings, ShoppingBasket, LogOut, ScanLine, Loader2, Bell, BellRing, ReceiptText, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { fetchProductByBarcode } from "@/lib/openfoodfacts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ItemSheet } from "@/app/dashboard/item-sheet";
import { ItemRow } from "@/app/dashboard/item-row";
import { ReceiptSheet } from "@/app/dashboard/receipt-sheet";
import { signOut } from "@/app/auth/actions";
import { subscribeToPush, getNotificationPermission } from "@/lib/push";
import imageCompression from "browser-image-compression";
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
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
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
    setIsCompressing(true);
    setReceiptError(null);
    let compressedFile: File;
    try {
      compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1500,
        useWebWorker: true,
        initialQuality: 0.8,
      });
    } catch {
      setReceiptError("Failed to compress image. Please try again.");
      setIsCompressing(false);
      return;
    }
    setIsCompressing(false);

    setIsParsingReceipt(true);
    const formData = new FormData();
    formData.append("image", compressedFile);
    try {
      const res = await fetch("/api/parse-receipt", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setReceiptError(data.error ?? "Failed to parse receipt.");
        return;
      }
      setReceiptItems(data.items ?? []);
      setReceiptSheetOpen(true);
    } catch {
      setReceiptError("Could not reach the server. Please try again.");
    } finally {
      setIsParsingReceipt(false);
    }
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
          {/* Desktop-only action buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing || isParsingReceipt}
              title={isCompressing ? "Compressing image..." : isParsingReceipt ? "Parsing receipt..." : "Scan receipt"}
            >
              {isCompressing || isParsingReceipt ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ReceiptText className="size-4" />
              )}
              <span className="sr-only">
                {isCompressing ? "Compressing image..." : isParsingReceipt ? "Parsing receipt..." : "Scan receipt"}
              </span>
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
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" title="Sign out">
              <LogOut className="size-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Receipt parse error banner */}
      {receiptError && (
        <div className="mx-4 mt-3 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 flex items-start justify-between gap-2">
          <span>{receiptError}</span>
          <button
            onClick={() => setReceiptError(null)}
            className="shrink-0 text-destructive/70 hover:text-destructive"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Item list */}
      <div className="pb-24 md:pb-8">
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
            <ShoppingBasket className="size-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No items yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first item to get started.
              </p>
            </div>
            {/* Desktop: two buttons */}
            <div className="hidden md:flex gap-2">
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanLine className="size-4" />
                Scan barcode
              </Button>
              <Button onClick={() => { setScanData(null); setAddSheetOpen(true); }}>
                <Plus className="size-4" />
                Add item
              </Button>
            </div>
            {/* Mobile: single CTA that opens action menu */}
            <Button className="md:hidden" onClick={() => setActionMenuOpen(true)}>
              <Plus className="size-4" />
              Add to Inventory
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

      {/* Mobile Action Menu */}
      <Sheet open={actionMenuOpen} onOpenChange={setActionMenuOpen}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle>Add to Inventory</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 pt-4 pb-2">
            <Button
              size="lg"
              variant="outline"
              className="justify-start gap-3 h-14 text-base"
              onClick={() => { setActionMenuOpen(false); setScannerOpen(true); }}
            >
              <ScanLine className="size-5" />
              Scan Barcode
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="justify-start gap-3 h-14 text-base"
              onClick={() => { setActionMenuOpen(false); fileInputRef.current?.click(); }}
            >
              <ReceiptText className="size-5" />
              Upload Receipt
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="justify-start gap-3 h-14 text-base"
              onClick={() => { setActionMenuOpen(false); setScanData(null); setAddSheetOpen(true); }}
            >
              <Plus className="size-5" />
              Add Manually
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background border-t flex items-center justify-around h-16 px-2">
        <button className="flex flex-col items-center gap-1 text-xs text-primary px-4 py-2">
          <Home className="size-5" />
          <span>Inventory</span>
        </button>
        <button
          onClick={() => setActionMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground px-4 py-2"
        >
          <Plus className="size-5" />
          <span>Add Item</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-xs text-muted-foreground px-4 py-2">
          <Settings className="size-5" />
          <span>Settings</span>
        </button>
      </nav>
    </main>
  );
}
