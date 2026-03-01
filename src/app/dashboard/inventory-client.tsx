"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useInfiniteInventory } from "@/hooks/use-infinite-inventory";
import { Home, Plus, Settings, ShoppingBasket, ScanLine, Loader2, ReceiptText, X, LayoutGrid, List, Search, ArrowUpDown, Archive, ShoppingCart } from "lucide-react";
import { NotificationBell } from "./notification-bell";

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
import { ShoppingList } from "@/app/dashboard/shopping-list";
import { ProfileSettings } from "@/app/dashboard/profile-settings";
import { deleteItem, decrementItemQuantity, addToShoppingList } from "@/app/dashboard/actions";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { GroupedItem, LocationRow, CategoryRow, ScanResult } from "@/lib/types";
import { getGracePeriodDays } from "@/lib/expiration-rules";

const BarcodeScanner = dynamic(
  () => import("./barcode-scanner").then((m) => ({ default: m.BarcodeScanner })),
  { ssr: false }
);

interface InventoryClientProps {
  locations: LocationRow[];
  categories: CategoryRow[];
  householdId: string;
  displayName: string;
  email: string;
}

export function InventoryClient({
  locations,
  categories,
  householdId,
  displayName,
  email,
}: InventoryClientProps) {
  const { items, isLoading, hasMore, loadMore, reset } = useInfiniteInventory(householdId);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedItem | null>(null);
  const [detailItem, setDetailItem] = useState<GroupedItem | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<GroupedItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<string[]>([]);
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping'>('pantry');
  const [activeLocation, setActiveLocation] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "quantity">("name");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [listRef] = useAutoAnimate();

  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  // Realtime subscription — reset and re-fetch from page 0 when items change
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
          reset();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, reset]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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

  async function handleConsume(item: GroupedItem) {
    const result = await decrementItemQuantity(item.id, item.quantity);
    if (result.deleted) {
      toast(`${item.name} finished.`, {
        action: { label: "Add to List", onClick: () => addToShoppingList(item) },
      });
    }
  }

  async function handleToss(item: GroupedItem) {
    await deleteItem(item.id);
    toast(`${item.name} removed.`, {
      action: { label: "Add to List", onClick: () => addToShoppingList(item) },
    });
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

  // Extract shopping items
  const shoppingItems = items.filter((item) => item.status === "shopping");

  // Derive groupedItems from hook items
  const rawGroupedItems: Record<string, GroupedItem[]> = {};
  for (const item of items) {
    const loc = item.locations?.name ?? "Uncategorized";
    if (!rawGroupedItems[loc]) rawGroupedItems[loc] = [];
    rawGroupedItems[loc].push(item);
  }

  // Process items: filter by search, sort, and filter by location
  const processedGroups: Record<string, GroupedItem[]> = {};

  Object.entries(rawGroupedItems).forEach(([locationName, items]) => {
    // Filter shopping items out of pantry view, then filter by search query
    const filtered = items
      .filter((item) => item.status !== 'shopping')
      .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort the filtered items
    const EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;
    const now = new Date();
    const nowMs = now.getTime();
    let sorted = [...filtered];
    sorted.sort((a, b) => {
      // Priority 0: expired AND perishable (hard expiration — always top)
      // Priority 1: expiring within 48h but not yet expired
      // Priority 2: everything else (including past-best-by orange items)
      const aMs = a.expiry_date ? new Date(a.expiry_date).getTime() : null;
      const bMs = b.expiry_date ? new Date(b.expiry_date).getTime() : null;

      const getPriority = (ms: number | null, categoryName?: string | null, locationName?: string | null) => {
        if (ms === null) return 2;
        const daysPast = ms < nowMs
          ? Math.floor((nowMs - ms) / (1000 * 3600 * 24))
          : 0;
        const graceDays = getGracePeriodDays(categoryName, locationName);
        const hardExpired = ms < nowMs && daysPast > graceDays;
        if (hardExpired) return 0;
        if (ms - nowMs <= EXPIRING_SOON_MS) return 1;
        return 2;
      };

      const aPriority = getPriority(aMs, a.categories?.name, a.locations?.name);
      const bPriority = getPriority(bMs, b.categories?.name, b.locations?.name);
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Secondary: apply active sortBy
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "quantity") return b.quantity - a.quantity;
      if (sortBy === "expiry") {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }
      return 0;
    });

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
      <div className="sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingBasket className="size-5 text-primary" />
          Food Inventory
        </h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
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
          <div
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm cursor-pointer border border-primary/30 select-none"
            title="Account"
            role="button"
          >
            {initials}
          </div>
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

      {activeTab === 'pantry' ? (
        <>
          {/* Search and Sort */}
          <div className="flex items-center gap-2 px-4 py-2 sticky top-[57px] z-30 bg-background border-b">
            {/* Search bar - growing container */}
            <div className="flex-1 relative ">
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
            <div className="sticky top-[101px] z-30 bg-background border-b flex items-center">
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
          <div className="pb-28 md:pb-8">
            {isLoading && items.length === 0 ? (
              <div className="flex justify-center py-24">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasItems ? (
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
                  <ItemCard key={item.id} item={item} onEdit={setEditingItem} onOpenDetail={setDetailItem} onConsume={handleConsume} onToss={handleToss} />
                ))}
              </div>
            )}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-6 flex justify-center">
              {isLoading && items.length > 0 && (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-xs text-muted-foreground">End of inventory</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <ShoppingList items={shoppingItems} />
      )}

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
        onConsume={handleConsume}
        onToss={handleToss}
      />

      {/* Item action menu */}
      <ItemActionMenu
        item={actionMenuItem}
        open={actionMenuItem !== null}
        onOpenChange={(open) => !open && setActionMenuItem(null)}
        onEdit={handleEditFromActionMenu}
        onDelete={handleDeleteFromActionMenu}
      />

      {/* Profile settings sheet */}
      <ProfileSettings open={profileOpen} onOpenChange={setProfileOpen} displayName={displayName} email={email} />

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-background border-t z-50 pb-[env(safe-area-inset-bottom)] flex items-center justify-around h-16 px-2">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex flex-col items-center gap-1 text-xs px-4 py-2 ${activeTab === 'pantry' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Archive className="size-5" />
          <span>Pantry</span>
        </button>

        {/* Breakout FAB */}
        <button
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-4 border-background z-50 active:scale-95 transition-transform"
          onClick={() => setActionMenuOpen(true)}
        >
          <Plus className="size-6" />
        </button>

        {/* Spacer to keep flex layout symmetric */}
        <div className="w-14" />

        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 text-xs px-4 py-2 ${activeTab === 'shopping' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <ShoppingCart className="size-5" />
          <span>Shopping</span>
        </button>
      </nav>
    </main>
  );
}
