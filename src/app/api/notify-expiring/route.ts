import { createClient } from "@supabase/supabase-js";
import type webpush from "web-push";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function formatBody(names: string[], label: string): string {
  const suffix = names.length === 1 ? "expires" : "expire";
  if (names.length <= 2) return `${names.join(", ")} ${suffix} ${label}`;
  const [first, second, ...rest] = names;
  return `${first}, ${second} and ${rest.length} more ${suffix} ${label}`;
}

export async function GET(request: Request) {
  const wp = (await import("web-push")).default;
  wp.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const authHeader = request.headers.get("Authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check items expiring in 1 day (tomorrow) and 3 days
  const thresholds = [
    { days: 1, label: "tomorrow" },
    { days: 3, label: "in 3 days" },
  ];

  const targetDates = thresholds.map((t) => ({
    ...t,
    date: new Date(Date.now() + t.days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  }));

  const { data: expiringItems, error: itemsError } = await supabase
    .from("items")
    .select("id, name, household_id, expiry_date")
    .in(
      "expiry_date",
      targetDates.map((t) => t.date)
    )
    .in("status", ["available", "low"]);

  if (itemsError) {
    console.error("Failed to fetch expiring items:", itemsError);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!expiringItems?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Anti-spam: skip items that already have an expiration_warning notification
  const itemIds = expiringItems.map((i) => i.id);
  const { data: alreadyNotified } = await supabase
    .from("notifications")
    .select("item_id")
    .in("item_id", itemIds)
    .eq("type", "expiration_warning");
  const notifiedSet = new Set(alreadyNotified?.map((n) => n.item_id) ?? []);
  const newItems = expiringItems.filter((i) => !notifiedSet.has(i.id));

  if (!newItems.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Map each target date string to its label
  const dateToLabel = new Map(targetDates.map((t) => [t.date, t.label]));

  // Group items by household + threshold label
  const groups = new Map<
    string,
    { householdId: string; label: string; items: typeof newItems }
  >();
  for (const item of newItems) {
    const label = dateToLabel.get(item.expiry_date as string)!;
    const key = `${item.household_id}::${label}`;
    if (!groups.has(key)) {
      groups.set(key, {
        householdId: item.household_id as string,
        label,
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  // Fetch subscriptions for all affected households in one query
  const householdIds = [
    ...new Set([...groups.values()].map((g) => g.householdId)),
  ];
  const { data: allSubs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, subscription, household_id, user_id")
    .in("household_id", householdIds);

  const subsByHousehold = new Map<string, NonNullable<typeof allSubs>>();
  for (const sub of allSubs ?? []) {
    const list = subsByHousehold.get(sub.household_id as string) ?? [];
    list.push(sub);
    subsByHousehold.set(sub.household_id as string, list);
  }

  let totalSent = 0;
  const staleEndpoints: string[] = [];

  for (const { householdId, label, items: groupItems } of groups.values()) {
    const subs = subsByHousehold.get(householdId);
    if (!subs?.length) continue;

    const names = groupItems.map((i) => i.name as string);
    const payload = JSON.stringify({
      title: "Food Inventory",
      body: formatBody(names, label),
    });

    for (const row of subs) {
      try {
        await wp.sendNotification(
          row.subscription as webpush.PushSubscription,
          payload
        );
        totalSent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          staleEndpoints.push(row.endpoint as string);
        } else {
          console.error("Push send failed:", err);
        }
      }
    }

    // Insert in-app notifications — one record per item per user
    const uniqueUserIds = [
      ...new Set(subs.map((s) => s.user_id as string).filter(Boolean)),
    ];
    if (uniqueUserIds.length > 0) {
      const insertRows = uniqueUserIds.flatMap((userId) =>
        groupItems.map((item) => ({
          user_id: userId,
          item_id: item.id,
          title: "Food Inventory",
          message: `${item.name} expires ${label}`,
          type: "expiration_warning",
        }))
      );
      await supabase.from("notifications").insert(insertRows);
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
    households: householdIds.length,
    staleRemoved: staleEndpoints.length,
  });
}
