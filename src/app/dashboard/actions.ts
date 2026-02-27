"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from "@/lib/supabase/server";
import type { ItemFormValues, GroupedItem, AppNotification } from "@/lib/types";

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
    is_perishable: values.is_perishable ?? false,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}

export async function createItems(
  items: Array<{ name: string; location_id: string; expiry_date?: string }>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  const rows = items.map((item) => ({
    household_id: householdId,
    name: item.name,
    quantity: 1,
    unit: null,
    location_id: item.location_id,
    category_id: null,
    expiry_date: item.expiry_date ?? null,
    status: "available" as const,
    barcode: null,
    image_url: null,
  }));

  const { error } = await supabase.from("items").insert(rows);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
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
      is_perishable: values.is_perishable ?? false,
    })
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}

export async function decrementItemQuantity(
  id: string,
  currentQuantity: number
): Promise<{ deleted: boolean; error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { deleted: false, error: "Not authenticated" };

  if (currentQuantity > 1) {
    const { error } = await supabase
      .from("items")
      .update({ quantity: currentQuantity - 1 })
      .eq("id", id)
      .eq("household_id", householdId);
    if (error) return { deleted: false, error: error.message };
    return { deleted: false };
  } else {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);
    if (error) return { deleted: false, error: error.message };
    return { deleted: true };
  }
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
  revalidatePath('/dashboard');
  return {};
}

export async function processRestock(
  updates: { id: string; quantity: number; expiry_date: string }[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  for (const u of updates) {
    const { error } = await supabase
      .from("items")
      .update({
        quantity: u.quantity,
        expiry_date: u.expiry_date || null,
        status: "available",
      })
      .eq("id", u.id)
      .eq("household_id", householdId);
    if (error) return { error: error.message };
  }
  revalidatePath('/dashboard');
  return {};
}

export async function addToShoppingList(item: GroupedItem): Promise<{ error?: string }> {
  const supabase = await createClient();
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "Not authenticated" };

  const { error } = await supabase.from("items").insert({
    household_id: householdId,
    name: item.name,
    quantity: 1,
    unit: item.unit ?? null,
    location_id: item.location_id,
    category_id: item.category_id ?? null,
    status: "shopping",
    barcode: item.barcode ?? null,
    image_url: item.image_url ?? null,
  });

  if (error) return { error: error.message };
  return {};
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
}

export async function clearReadNotifications(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id)
    .eq("is_read", true);
}

export async function savePushSubscription(
  subscription: PushSubscriptionJSON
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const householdId = await getHouseholdId(supabase);
  if (!householdId) return { error: "No household" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, household_id: householdId, endpoint: subscription.endpoint, subscription },
    { onConflict: "endpoint" }
  );
  return error ? { error: error.message } : {};
}

export async function getUserProfile(): Promise<{
  householdName: string | null;
  inviteCode: string | null;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("households(name, invite_code)")
    .eq("id", user.id)
    .single();

  const household = (data as unknown as { households?: { name: string; invite_code: string } | null })?.households;
  return {
    householdName: household?.name ?? null,
    inviteCode: household?.invite_code ?? null,
  };
}

export async function triggerCronTest(): Promise<{ sent?: number; error?: string }> {
  const { headers } = await import("next/headers");
  const secret = process.env.CRON_SECRET;
  if (!secret) return { error: "CRON_SECRET not set" };
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${proto}://${host}/api/notify-expiring`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "Unknown error" };
  return { sent: data.sent };
}
