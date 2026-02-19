"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Home, Plus, Settings, ShoppingBasket, LogOut, ScanLine, Loader2, Bell, BellRing, ReceiptText, X, LayoutGrid, List, Search, ArrowUpDown } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { fetchProductByBarcode } from "@/lib/openfoodfacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ItemSheet } from "@/app/dashboard/item-sheet";
import { ItemRow } from "@/app/dashboard/item-row";
import { ItemCard } from "@/app/dashboard/item-card";
import { ItemDetailDrawer } from "@/app/dashboard/item-detail-drawer";
import { ItemActionMenu } from "@/app/dashboard/item-action-menu";
import { ReceiptSheet } from "@/app/dashboard/receipt-sheet";
import { signOut } from "@/app/auth/actions";
import { deleteItem } from "@/app/dashboard/actions";
import { subscribeToPush, getNotificationPermission } from "@/lib/push";
import imageCompression from "browser-image-compression";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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
  const [detailItem, setDetailItem] = useState<GroupedItem | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<GroupedItem | null>(null);
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
  const [activeLocation, setActiveLocation] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "quantity">("name");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listRef] = useAutoAnimate();

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

  function handleEditFromDetail() {
    if (!detailItem) return;
    setEditingItem(detailItem);
    setDetailItem(null);
  }

  function handleEditFromActionMenu() {
    if (!actionMenuItem) return;
    setEditingItem(actionMenuItem);
    setActionMenuItem(null);
  }

  function handleDeleteFromActionMenu(item: GroupedItem) {
    setActionMenuItem(null);
    deleteItem(item.id);
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

  // Process items: filter by search, sort, and filter by location
  const processedGroups: Record<string, GroupedItem[]> = {};

  Object.entries(groupedItems).forEach(([locationName, items]) => {
    // Filter by search query
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort the filtered items
    let sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "quantity") {
      sorted.sort((a, b) => b.quantity - a.quantity);
    } else if (sortBy === "expiry") {
      sorted.sort((a, b) => {
        // Treat null/empty as last (infinity)
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
    }

    // Only include locations with items after filtering
    if (sorted.length > 0) {
      processedGroups[locationName] = sorted;
    }
  });

  const locationNames = Object.keys(processedGroups).sort();
  const hasItems = locationNames.length > 0;
  const activeLocationNames =
    activeLocation === "All" ? locationNames : locationNames.filter((l) => l === activeLocation);
  const flatFilteredItems = activeLocationNames.flatMap((loc) => processedGroups[loc]);

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

      {/* Search and Sort */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Search bar - growing container */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-muted/50 border-none"
          />
        </div>

        {/* Sort dropdown - icon button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full shrink-0">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "expiry" | "quantity")}>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="expiry">Expiry Date</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="quantity">Quantity</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Location tabs + view toggle */}
      {hasItems && (
        <div className="sticky top-[101px] z-10 bg-background border-b flex items-center">
          <div className="flex overflow-x-auto gap-1.5 px-3 py-2 flex-1 [&::-webkit-scrollbar]:hidden">
            {["All", ...locationNames].map((loc) => (
              <Button
                key={loc}
                size="sm"
                variant={activeLocation === loc ? "default" : "ghost"}
                className="shrink-0 text-xs h-7 px-3"
                onClick={() => setActiveLocation(loc)}
              >
                {loc}
                {loc !== "All" && (
                  <span className="ml-1 opacity-60">({processedGroups[loc]?.length ?? 0})</span>
                )}
              </Button>
            ))}
          </div>
          <div className="shrink-0 px-2 border-l">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
              <span className="sr-only">{viewMode === "grid" ? "List view" : "Grid view"}</span>
            </Button>
          </div>
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
        ) : viewMode === "list" ? (
          activeLocationNames.map((locationName, index) => (
            <div key={locationName}>
              {index > 0 && <Separator />}
              <div className="px-4 pt-5 pb-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {locationName}
                  <span className="ml-2 font-normal normal-case">
                    ({processedGroups[locationName].length})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-border" ref={listRef}>
                {processedGroups[locationName].map((item) => (
                  <ItemRow key={item.id} item={item} onEdit={setEditingItem} onOpenDetail={setDetailItem} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-3 py-3" ref={listRef}>
            {flatFilteredItems.map((item) => (
              <ItemCard key={item.id} item={item} onEdit={setEditingItem} onOpenDetail={setDetailItem} onOpenActionMenu={setActionMenuItem} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Action Menu */}
      <Sheet open={actionMenuOpen} onOpenChange={setActionMenuOpen}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle>Add to Inventory</SheetTitle>
            <SheetDescription>
              Choose how you want to add items to your inventory
            </SheetDescription>
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

      {/* Item detail drawer */}
      <ItemDetailDrawer
        item={detailItem}
        open={detailItem !== null}
        onOpenChange={(open) => !open && setDetailItem(null)}
        onEdit={handleEditFromDetail}
      />

      {/* Item action menu */}
      <ItemActionMenu
        item={actionMenuItem}
        open={actionMenuItem !== null}
        onOpenChange={(open) => !open && setActionMenuItem(null)}
        onEdit={handleEditFromActionMenu}
        onDelete={handleDeleteFromActionMenu}
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
