"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupedItem } from "@/lib/types";

const PAGE_SIZE = 15;
const FIELDS =
  "id, name, quantity, unit, expiry_date, status, location_id, category_id, barcode, image_url, is_perishable, locations(name), categories(name)";

export function useInfiniteInventory(householdId: string) {
  const [items, setItems] = useState<GroupedItem[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [version, setVersion] = useState(0);

  // Refs so loadMore callback stays stable
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const supabase = createClient();
    supabase
      .from("items")
      .select(FIELDS)
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      .then(({ data }) => {
        if (cancelled) return;
        const fetched = (data ?? []) as unknown as GroupedItem[];
        if (page === 0) {
          setItems(fetched);
        } else {
          setItems((prev) => [...prev, ...fetched]);
        }
        setHasMore(fetched.length === PAGE_SIZE);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, version, householdId]);

  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      setPage((p) => p + 1);
    }
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setPage(0);
    setVersion((v) => v + 1);
  }, []);

  return { items, isLoading, hasMore, loadMore, reset };
}
