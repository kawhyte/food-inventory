"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, AlertCircle, Minus, Plus } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createItem, updateItem, deleteItem } from "@/app/dashboard/actions";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import type {
  GroupedItem,
  LocationRow,
  CategoryRow,
  ItemFormValues,
  ScanResult,
} from "@/lib/types";


const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  quantity: z.number().min(0, "Must be 0 or more"),
  unit: z.string().max(20).optional(),
  location_id: z.string().min(1, "Please select a location"),
  category_id: z.string().optional(),
  expiry_date: z.string().optional(),
  status: z.enum(["available", "low", "expired", "consumed", "shopping", "archived"]),
  barcode: z.string().optional(),
  image_url: z.string().optional(),
  is_perishable: z.boolean(),
});

type ItemSchema = z.infer<typeof itemSchema>;

interface ItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: GroupedItem;
  locations: LocationRow[];
  categories: CategoryRow[];
  scanData?: ScanResult;
}

export function ItemSheet({
  open,
  onOpenChange,
  item,
  locations,
  categories,
  scanData,
}: ItemSheetProps) {
  const isEditing = !!item;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const form = useForm<ItemSchema>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "",
      location_id: "",
      category_id: "",
      expiry_date: "",
      status: "available",
      barcode: "",
      image_url: "",
      is_perishable: false,
    },
  });

  // Pre-fill form when opening in edit or scan mode
  useEffect(() => {
    if (open) {
      setServerError(null);
      setConfirmingDelete(false);
      if (item) {
        form.reset({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit ?? "",
          location_id: item.location_id ?? "",
          category_id: item.category_id ?? "",
          expiry_date: item.expiry_date ?? "",
          status: item.status,
          barcode: item.barcode ?? "",
          image_url: item.image_url ?? "",
          is_perishable: item.is_perishable ?? false,
        });
      } else {
        form.reset({
          name: scanData?.name ?? "",
          quantity: 1,
          unit: "",
          location_id: "",
          category_id: "",
          expiry_date: "",
          status: "available",
          barcode: scanData?.barcode ?? "",
          image_url: scanData?.imageUrl ?? "",
          is_perishable: false,
        });
      }
    }
  }, [open, item, scanData, form]);

  function onSubmit(raw: ItemSchema) {
    setServerError(null);

    const values: ItemFormValues = {
      name: raw.name,
      quantity: raw.quantity,
      unit: raw.unit?.trim() || undefined,
      location_id: raw.location_id,
      category_id: raw.category_id || undefined,
      expiry_date: raw.expiry_date || undefined,
      status: raw.status,
      barcode: raw.barcode?.trim() || undefined,
      image_url: raw.image_url?.trim() || undefined,
      is_perishable: raw.is_perishable,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateItem(item.id, values)
        : await createItem(values);

      if (result.error) {
        setServerError(result.error);
      } else {
        if (!isEditing) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
        router.refresh();
        onOpenChange(false);
      }
    });
  }

  function handleDelete() {
    if (!item) return;
    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (result.error) {
        setServerError(result.error);
        setConfirmingDelete(false);
      } else {
        router.refresh();
        onOpenChange(false);
      }
    });
  }

  const showScanInfo = !isEditing && !!scanData;
  const showProductNotFound = showScanInfo && !scanData.name;

  return (
    <>
      {showConfetti && <ConfettiBurst />}
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-pantry-paper border-t-[3px] border-l-[3px] border-r-[3px] border-pantry-ink border-b-0 rounded-t-[24px] max-h-[92dvh] flex flex-col p-0"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-pantry-ink/25" />
        </div>

        <SheetHeader className="px-6 pt-2 pb-4 border-b-2 border-pantry-ink/20 shrink-0">
          <SheetTitle className="font-handwritten font-bold text-xl text-pantry-ink">
            {isEditing ? "Edit item" : "Add item"}
          </SheetTitle>
          <SheetDescription>
            {isEditing ? "Update the details of this inventory item" : "Add a new item to your inventory"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Product thumbnail from scan */}
              {showScanInfo && scanData.imageUrl && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scanData.imageUrl}
                    alt="Product"
                    className="size-14 object-cover rounded"
                  />
                  <p className="text-xs text-muted-foreground">
                    Image from Open Food Facts
                  </p>
                </div>
              )}

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Whole milk"
                        {...field}
                        className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-pantry-teal text-base text-pantry-ink"
                      />
                    </FormControl>
                    {showProductNotFound && (
                      <p className="text-xs text-muted-foreground">
                        Product not found — enter name manually
                      </p>
                    )}
                    {showScanInfo && (
                      <p className="text-xs text-muted-foreground">
                        Barcode: {scanData.barcode}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity + Unit */}
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          {/* Decrement Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 shrink-0 p-0 rounded-full border-2 border-pantry-ink bg-white shadow-[2px_2px_0px_0px_#1E293B] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            onClick={() => {
                              const current = Number(field.value) || 0;
                              if (current > 0) {
                                field.onChange(current - 1);
                              }
                            }}
                          >
                            <Minus className="size-5" />
                          </Button>

                          {/* Quantity Input */}
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            {...field}
                            className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-pantry-teal text-center text-lg font-bold font-handwritten text-pantry-ink flex-1"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? 0 : e.target.valueAsNumber
                              )
                            }
                          />

                          {/* Increment Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 shrink-0 p-0 rounded-full border-2 border-pantry-ink bg-white shadow-[2px_2px_0px_0px_#1E293B] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            onClick={() => {
                              const current = Number(field.value) || 0;
                              field.onChange(current + 1);
                            }}
                          >
                            <Plus className="size-5" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="kg, L, pcs…"
                          {...field}
                          className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-pantry-teal text-base text-pantry-ink"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location */}
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus:ring-0 text-base text-pantry-ink">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus:ring-0 text-base text-pantry-ink">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry date */}
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-pantry-teal text-base text-pantry-ink"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-0 border-b-2 border-pantry-ink rounded-none h-12 px-1 focus:ring-0 text-base text-pantry-ink">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="consumed">Consumed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {serverError}
                </p>
              )}
            </div>

            <SheetFooter className="border-t-2 border-pantry-ink/20 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
              {!confirmingDelete ? (
                <>
                  {/* Primary Save Button */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-14 rounded-[12px_12px_20px_4px] text-lg font-handwritten font-bold bg-pantry-teal text-pantry-ink border-2 border-pantry-ink shadow-[4px_4px_0px_0px_#1E293B] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="animate-spin size-5 mr-2" />
                        {isEditing ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      isEditing ? "Save changes" : "Add item"
                    )}
                  </Button>

                  {/* Delete Button (only for existing items) */}
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingDelete(true)}
                      disabled={isPending}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12 mt-2"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete item
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Confirmation Message */}
                  <div className="flex items-center gap-2 w-full mb-3">
                    <AlertCircle className="size-5 text-destructive shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Delete this item permanently?
                    </p>
                  </div>

                  {/* Confirmation Actions */}
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={isPending}
                      className="flex-1 h-12 rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="flex-1 h-12 rounded-2xl"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
    </>
  );
}
