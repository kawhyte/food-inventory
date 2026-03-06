"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useInfiniteInventory } from "@/hooks/use-infinite-inventory";
import { Plus, ShoppingBasket, ScanLine, Loader2, ReceiptText, X, LayoutGrid, List, Search, ArrowUpDown, Archive, ShoppingCart, Ghost, BarChart2 } from "lucide-react";
import { NotificationBell } from "./notification-bell";

import { createClient } from "@/lib/supabase/client";
import { fetchProductByBarcode } from "@/lib/openfoodfacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ItemSheet } from "@/app/dashboard/item-sheet";
import { FoodItemCard, FoodItemCardSkeleton } from "@/app/dashboard/food-item-card";
import { ItemCard } from "@/app/dashboard/item-card";
import { ItemDetailDrawer } from "@/app/dashboard/item-detail-drawer";
import { ItemActionMenu } from "@/app/dashboard/item-action-menu";
import { ReceiptSheet } from "@/app/dashboard/receipt-sheet";
import { ShoppingList } from "@/app/dashboard/shopping-list";
import { ProfileSettings } from "@/app/dashboard/profile-settings";
import { deleteItem, decrementItemQuantity, handleItemLifecycle } from "@/app/dashboard/actions";
import { toast } from "sonner";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { vibrateLight } from "@/lib/haptics";
import { PostMortemModal } from "./post-mortem-modal";
import { GraveyardTab } from "./graveyard-tab";
import { InsightsTab } from "./insights-tab";
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

function NavTab({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={() => { vibrateLight(); onClick(); }} className="relative flex flex-col items-center gap-0.5 px-3 py-2 shrink-0 active:opacity-70 transition-opacity">
      <Icon className={`size-5 ${active ? 'text-pantry-teal' : 'text-pantry-ink/40'}`} />
      <span className={`text-xs font-handwritten font-semibold ${active ? 'text-pantry-teal' : 'text-pantry-ink/40'}`}>{label}</span>
      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-[2px_4px_1px_3px] bg-pantry-teal" />}
    </button>
  );
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
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
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
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping' | 'history' | 'insights'>('pantry');
  const [postMortemItem, setPostMortemItem] = useState<GroupedItem | null>(null);
  const [showRestockConfetti, setShowRestockConfetti] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
    if (item.quantity > 1) {
      await decrementItemQuantity(item.id, item.quantity);
    } else {
      setPostMortemItem(item);
    }
  }

  function handleToss(item: GroupedItem) {
    setDetailItem(null);
    setPostMortemItem(item);
  }

  async function handlePostMortemRestock() {
    if (!postMortemItem) return;
    const id = postMortemItem.id;
    await handleItemLifecycle(id, 'RESTOCK');
    handleRemoveItem(id);
    setPostMortemItem(null);
    reset();
    setShowRestockConfetti(true);
    setTimeout(() => setShowRestockConfetti(false), 1400);
  }

  async function handlePostMortemGraveyard() {
    if (!postMortemItem) return;
    const id = postMortemItem.id;
    await handleItemLifecycle(id, 'ARCHIVE');
    handleRemoveItem(id);
    setPostMortemItem(null);
  }

  const handleRemoveItem = useCallback((id: string) => {
    setRemovedIds(prev => new Set(prev).add(id));
  }, []);

  async function handleSwipeArchive(itemId: string) {
    await handleItemLifecycle(itemId, 'ARCHIVE');
    handleRemoveItem(itemId);
    toast('Moved to graveyard');
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

  // Extract shopping items (manually added + needs_restock pantry items)
  const shoppingItems = items.filter(
    (item) => item.status === "shopping" || item.needs_restock === true
  );

  // Extract graveyard items
  const graveyardItems = items.filter((item) => item.status === "archived");

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
    // Filter shopping, archived, and needs_restock items out of pantry view, then filter by search query
    const filtered = items
      .filter((item) => item.status !== 'shopping' && item.status !== 'archived' && !item.needs_restock)
      .filter((item) => !removedIds.has(item.id))
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
      <div className="sticky top-0 z-30 bg-background px-4 py-3 flex items-center justify-between">
        <h1 className="font-handwritten font-bold text-xl text-pantry-ink flex items-center gap-2">
          <ShoppingBasket className="size-5 text-pantry-teal" />
          Pantry Pal
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 border-2 border-pantry-ink rounded-full flex items-center justify-center bg-pantry-paper">
            <NotificationBell />
          </div>
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
            className="w-9 h-9 rounded-full bg-pantry-mustard text-pantry-ink border-2 border-pantry-ink flex items-center justify-center font-bold text-sm cursor-pointer select-none"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pantry-ink/50" />
              <Input
                placeholder="Search your items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-[12px_18px_14px_16px] bg-pantry-paper border-2 border-pantry-ink text-pantry-ink placeholder:text-pantry-ink/40 focus-visible:ring-0 focus-visible:border-pantry-teal"
              />
            </div>

            {/* Sort dropdown - icon button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-[6px_12px_8px_14px] border-2 border-pantry-ink shadow-[2px_2px_0px_0px_#1E293B] bg-pantry-paper active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all shrink-0">
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
                  <button
                    key={loc}
                    onClick={() => setActiveLocation(loc)}
                    className={`shrink-0 text-xs h-7 px-3 rounded-[8px_16px_12px_6px] border-2 transition-all font-handwritten font-semibold
                      ${activeLocation === loc
                        ? 'bg-pantry-teal text-pantry-ink border-pantry-ink shadow-[2px_2px_0px_0px_#1E293B]'
                        : 'bg-pantry-paper text-pantry-ink/60 border-pantry-ink/30 hover:border-pantry-ink/60'
                      }`}
                  >
                    {loc}
                    {loc !== "All" && <span className="ml-1 opacity-60">({processedGroups[loc]?.length ?? 0})</span>}
                  </button>
                ))}
              </div>
              <div className="shrink-0 px-2 border-l">
                <button
                  className="size-8 rounded-[4px_10px_6px_12px] border-2 border-pantry-ink/40 bg-pantry-paper hover:border-pantry-ink flex items-center justify-center transition-colors"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                >
                  {viewMode === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
                  <span className="sr-only">{viewMode === "grid" ? "List view" : "Grid view"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Item list */}
          <PullToRefresh onRefresh={reset}>
          <div className="pb-28 md:pb-8">
            {isLoading && items.length === 0 ? (
              viewMode === "list" ? (
                <div className="px-4 py-4 flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, i) => <FoodItemCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="flex justify-center py-24">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )
            ) : !hasItems ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
                {/* Doodle illustration container */}
                <div className="border-2 border-pantry-ink rounded-[20px_5px_20px_5px] shadow-[4px_4px_0px_0px_#1E293B] p-6 bg-pantry-paper">
                  <Ghost className="size-16 text-pantry-teal" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-handwritten font-bold text-xl text-pantry-ink">
                    Your pantry looks a bit lonely!
                  </p>
                  <p className="text-sm text-pantry-ink/60 mt-1">
                    Tap &apos;+&apos; to add some groceries.
                  </p>
                </div>
                {/* Desktop: two buttons */}
                <div className="hidden md:flex gap-2">
                  <Button variant="outline" onClick={() => setScannerOpen(true)}>
                    <ScanLine className="size-4" /> Scan barcode
                  </Button>
                  <Button onClick={() => { setScanData(null); setAddSheetOpen(true); }}>
                    <Plus className="size-4" /> Add item
                  </Button>
                </div>
                {/* Mobile: FAB trigger */}
                <Button className="md:hidden" onClick={() => setActionMenuOpen(true)}>
                  <Plus className="size-4" /> Add to Inventory
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
                  <div className="flex flex-col gap-6 px-4 py-3 bg-pantry-paper" ref={listRef}>
                    <AnimatePresence>
                      {processedGroups[locationName]
                        .filter(item => !removedIds.has(item.id))
                        .map((item) => (
                          <motion.div
                            key={item.id}
                            exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <FoodItemCard
                              item={item}
                              onEdit={setEditingItem}
                              onOpenDetail={setDetailItem}
                              onArchive={handleSwipeArchive}
                              onRemove={handleRemoveItem}
                              onConsumed={setPostMortemItem}
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-4 py-4" ref={listRef}>
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
          </PullToRefresh>
        </>
      ) : activeTab === 'shopping' ? (
        <PullToRefresh onRefresh={reset}>
          <ShoppingList items={shoppingItems} onArchive={handleSwipeArchive} />
        </PullToRefresh>
      ) : activeTab === 'history' ? (
        <GraveyardTab items={graveyardItems} />
      ) : activeTab === 'insights' ? (
        <InsightsTab items={items} />
      ) : null}

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
        onSuccess={reset}
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

      {/* Restock confetti burst */}
      {showRestockConfetti && <ConfettiBurst />}

      {/* Post-mortem modal */}
      <PostMortemModal
        item={postMortemItem}
        onRestock={handlePostMortemRestock}
        onGraveyard={handlePostMortemGraveyard}
        onDismiss={() => setPostMortemItem(null)}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-pantry-paper border-t-[3px] border-pantry-ink z-50 pb-[env(safe-area-inset-bottom)] flex items-center justify-around h-16 px-2">
        <NavTab icon={Archive} label="Stock" active={activeTab === 'pantry'} onClick={() => setActiveTab('pantry')} />
        <NavTab icon={ShoppingCart} label="Shopping" active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} />

        {/* Center FAB */}
        <button
          className="relative -top-5 w-14 h-14 bg-pantry-mustard text-pantry-ink rounded-full flex items-center justify-center border-[3px] border-pantry-ink shadow-[3px_3px_0px_0px_#1E293B] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all z-50 shrink-0"
          onClick={() => { vibrateLight(); setActionMenuOpen(true); }}
        >
          <Plus className="size-6" />
        </button>

        <NavTab icon={Ghost} label="Graveyard" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavTab icon={BarChart2} label="Insights" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
      </nav>
    </main>
  );
}
