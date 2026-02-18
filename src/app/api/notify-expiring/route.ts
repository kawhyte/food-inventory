import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { NextResponse } from "next/server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function formatBody(names: string[]): string {
  const suffix = names.length === 1 ? "expires" : "expire";
  if (names.length <= 2) return `${names.join(", ")} ${suffix} in 3 days`;
  const [first, second, ...rest] = names;
  return `${first}, ${second} and ${rest.length} more ${suffix} in 3 days`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Items expiring in exactly 3 days that are still active
  const targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: expiringItems, error: itemsError } = await supabase
    .from("items")
    .select("name, household_id")
    .eq("expiry_date", targetDate)
    .in("status", ["available", "low"]);

  if (itemsError) {
    console.error("Failed to fetch expiring items:", itemsError);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!expiringItems?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Group item names by household
  const byHousehold = new Map<string, string[]>();
  for (const item of expiringItems) {
    const list = byHousehold.get(item.household_id) ?? [];
    list.push(item.name as string);
    byHousehold.set(item.household_id as string, list);
  }

  let totalSent = 0;
  const staleEndpoints: string[] = [];

  for (const [householdId, itemNames] of byHousehold) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, subscription")
      .eq("household_id", householdId);

    if (!subs?.length) continue;

    const payload = JSON.stringify({
      title: "Food Inventory",
      body: formatBody(itemNames),
    });

    for (const row of subs) {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          payload
        );
        totalSent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription is expired or gone — remove it
          staleEndpoints.push(row.endpoint as string);
        } else {
          console.error("Push send failed:", err);
        }
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
  }

  return NextResponse.json({
    sent: totalSent,
    households: byHousehold.size,
    staleRemoved: staleEndpoints.length,
  });
}
