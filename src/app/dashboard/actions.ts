"use server";

import { createClient } from "@/lib/supabase/server";
import type { ItemFormValues } from "@/lib/types";

async function getHouseholdId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  return data?.household_id ?? null;
}

export async function createItem(
  values: ItemFormValues
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  const { error } = await supabase.from("items").insert({
    household_id: householdId,
    name: values.name,
    quantity: values.quantity,
    unit: values.unit ?? null,
    location_id: values.location_id,
    category_id: values.category_id ?? null,
    expiry_date: values.expiry_date ?? null,
    status: values.status,
    barcode: values.barcode ?? null,
    image_url: values.image_url ?? null,
  });

  if (error) return { error: error.message };
  return {};
}

export async function updateItem(
  id: string,
  values: ItemFormValues
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("items")
    .update({
      name: values.name,
      quantity: values.quantity,
      unit: values.unit ?? null,
      location_id: values.location_id,
      category_id: values.category_id ?? null,
      expiry_date: values.expiry_date ?? null,
      status: values.status,
      barcode: values.barcode ?? null,
      image_url: values.image_url ?? null,
    })
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) return { error: error.message };
  return {};
}

export async function deleteItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) return { error: error.message };
  return {};
}
