"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { GroupedItem } from "@/lib/types";

interface ItemActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GroupedItem | null;
  onEdit: (item: GroupedItem) => void;
  onDelete: (item: GroupedItem) => void;
}

export function ItemActionMenu({ open, onOpenChange, item, onEdit, onDelete }: ItemActionMenuProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset confirmation when sheet closes
  useEffect(() => {
    if (!open) {
      setConfirmingDelete(false);
    }
  }, [open]);

  function handleEdit() {
    if (!item) return;
    onEdit(item);
    onOpenChange(false);
  }

  function handleDelete() {
    if (!item) return;

    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
    } else {
      onDelete(item);
      setConfirmingDelete(false);
      onOpenChange(false);
    }
  }

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-6">
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>Choose an action</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-3">
          {/* Edit Button */}
          <Button
            variant="ghost"
            className="w-full h-14 justify-start gap-3 text-base"
            onClick={handleEdit}
          >
            <Pencil className="size-5" />
            Edit Item
          </Button>

          {/* Delete Button */}
          <Button
            variant={confirmingDelete ? "destructive" : "outline"}
            className="w-full h-14 justify-start gap-3 text-base"
            onClick={handleDelete}
          >
            {confirmingDelete ? (
              <>
                <AlertCircle className="size-5" />
                Confirm Delete?
              </>
            ) : (
              <>
                <Trash2 className="size-5" />
                Delete Item
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
