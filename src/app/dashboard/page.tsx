import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "@/app/dashboard/inventory-client";
import type { GroupedItem, LocationRow, CategoryRow } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Get user's household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) redirect("/auth/sign-in");

  const householdId = profile.household_id;

  // Fetch items, locations, and categories in parallel
  const [itemsResult, locationsResult, categoriesResult] = await Promise.all([
    supabase
      .from("items")
      .select(
        "id, name, quantity, unit, expiry_date, status, location_id, category_id, barcode, image_url, locations(name), categories(name)"
      )
      .eq("household_id", householdId)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name")
      .eq("household_id", householdId)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name")
      .eq("household_id", householdId)
      .order("name"),
  ]);

  // Group items by location name (server-side)
  const groupedItems: Record<string, GroupedItem[]> = {};
  for (const item of (itemsResult.data ?? []) as unknown as GroupedItem[]) {
    const locationName = item.locations?.name ?? "Uncategorized";
    if (!groupedItems[locationName]) groupedItems[locationName] = [];
    groupedItems[locationName].push(item);
  }

  return (
    <InventoryClient
      groupedItems={groupedItems}
      locations={(locationsResult.data ?? []) as LocationRow[]}
      categories={(categoriesResult.data ?? []) as CategoryRow[]}
      householdId={householdId}
    />
  );
}
