import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "@/app/dashboard/inventory-client";
import type { LocationRow, CategoryRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Get user's household_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) redirect("/auth/sign-in");

  const householdId = profile.household_id;

  // Fetch locations and categories (items are fetched client-side via infinite scroll)
  const [locationsResult, categoriesResult] = await Promise.all([
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

  return (
    <InventoryClient
      locations={(locationsResult.data ?? []) as LocationRow[]}
      categories={(categoriesResult.data ?? []) as CategoryRow[]}
      householdId={householdId}
      displayName={profile.display_name ?? ""}
      email={user.email ?? ""}
    />
  );
}
