# Food Inventory App — Development Roadmap

## Phase 1: Backend & Auth Foundation
- [x] Set up Supabase client and environment variables
- [x] Execute SQL to create tables and Row Level Security (RLS) policies
- [x] Implement basic Auth and Profile/Household linking

## Phase 2: Core Inventory CRUD
- [x] Build UI for manual entry, location viewing, and status toggling
- [x] Implement realtime subscriptions for sync
- Note: Future option to add card/table view toggle as a user preference.

## Phase 3: Barcode Scanning Integration
- [x] Integrate html5-qrcode camera overlay
- [x] Connect to OpenFoodFacts API to fetch product name/image
- [x] Store barcode on items table (run supabase/add-barcode.sql)
- [x] Pre-fill Add Item sheet from scan result

## Phase 4: Push Notifications
- [x] Install web-push + @types/web-push
- [x] Generate VAPID keys (set in .env.local and Vercel env vars)
- [x] Run supabase/add-push-subscriptions.sql in Supabase SQL Editor
- [x] Add push + notificationclick handlers to src/sw.ts
- [x] Create src/lib/push.ts (subscribe/unsubscribe utilities)
- [x] Create src/app/api/notify-expiring/route.ts (cron handler)
- [x] Create vercel.json (daily cron at 18:00 UTC)
- [x] Add Bell button to dashboard header (src/app/dashboard/inventory-client.tsx)

## Phase 5: Receipt OCR Parsing
- [x] Install @google/generative-ai
- [x] Add GEMINI_API_KEY to .env.local and Vercel environment variables
- [x] Create src/app/api/parse-receipt/route.ts (Gemini 2.0 Flash image parsing)
- [x] Add createItems bulk server action to actions.ts
- [x] Create src/app/dashboard/receipt-sheet.tsx (review + bulk add UI)
- [x] Add ReceiptText button + file input to inventory-client.tsx
- [x] Implement client-side image compression for receipt uploads

## Phase 6: Native App UI (Iteration 1 - Navigation)
- [x] Create mobile bottom navigation bar (Inventory, Add Item, Settings).
- [x] Create mobile Action Menu (Bottom Sheet) triggered by the "Add Item" nav button.
- [x] Migrate "Scan Barcode", "Upload Receipt", and "Add Manually" into the Action Menu for mobile.
- [x] Keep standalone action buttons in the top header for desktop (`md:flex`).
- [x] Update empty state UI to reflect responsive changes.

## Phase 7: Native App UI (Iteration 2 - Item Display & Tabs)
- [x] Create horizontal, scrollable location tabs.
- [x] Create a `ItemCard` component for grid display (showing image, name, quantity, and status).
- [x] Implement a Grid vs. List view toggle state in `inventory-client.tsx`.
- [x] Apply 2-column CSS grid (`grid-cols-2`) on mobile, scaling up for desktop.

## Phase 8: Native App UI (Iteration 3 - Swipe Gestures)
- [x] Add touch event tracking (`onTouchStart`, `onTouchMove`, `onTouchEnd`) to `ItemRow.tsx`.
- [x] Implement horizontal translation (slide effect) based on touch delta.
- [x] Reveal a "Delete" action button underneath when swiping left.
- [x] Reveal an "Edit" action button underneath when swiping right.
- [x] Add desktop fallback (e.g., buttons visible on hover or tap-to-edit).

## Phase 9: Native App UI (Iteration 4 - Item Details & Card Actions)
- [x] Create `ItemDetailDrawer.tsx` (Read-only view with high-res image and quick stats).
- [x] Update `ItemCard.tsx` with a `...` top-right button for Edit/Delete actions.
- [x] Update `ItemRow.tsx` so tapping the row opens the Detail Drawer, not the Edit form.
- [x] Wire up `selectedDetailItem` state in `inventory-client.tsx`.

## Phase 10: Native App UI (Iteration 5 - Fluid Animations)
- [ ] Install `@formkit/auto-animate` for layout transitions.
- [ ] Add `useAutoAnimate` hook to list and grid containers in `inventory-client.tsx` for smooth filtering and toggling.
- [ ] Add tactile tap animations (`active:scale-[0.98] transition-transform`) to `ItemCard` and `ItemRow`.

## Phase 11: Native App UI (Iteration 6 - Search & Sort)
- [x] Add Search input state and Sorting dropdown state.
- [x] Create a derived state/memo to filter and sort `groupedItems` dynamically.
- [x] Implement Mucho-style UI: Rounded search input with integrated icon, plus a single icon button to trigger sort options.
- [x] Handle null/empty expiry dates gracefully during sorting.

## Phase 12: Native App UI (Iteration 7 - Bottom Nav Polish)
- [x] Update bottom nav items to "Pantry" and "Shopping".
- [x] Style the central "Add" button as an elevated, overlapping Floating Action Button (Mucho style).

## Phase 13: Native App UI (Iteration 8 - Vibrant Mucho Redesign)
- [x] Update global font to `Plus Jakarta Sans` for a bouncy, modern look.
- [x] Update primary CSS variables to a vibrant, punchy brand color.
- [x] Redesign `ItemRow` (List View): Image on left, details on right. Remove "Available" badge. Add Quantity/Unit.
- [x] Redesign `ItemCard` (Grid View): Softer shadows, `rounded-3xl`, prominent image. Remove badge. Add Quantity/Unit.

## Phase 14: Native App UI (Iteration 9 - Detail & Edit UX)
- [x] Add aesthetic image placeholders to Row and Card views.
- [x] Redesign `ItemDetailDrawer`: Remove status badge, add native sheet handle, highlight relevant data.
- [x] Redesign `ItemSheet` (Edit): Apply Mucho-style inset inputs (`bg-muted/50`, `rounded-2xl`, borderless).
- [x] Implement `[ - ] [ qty ] [ + ]` stepper for the quantity field.
- [x] Fix dangerous buttons: Full-width primary Save button, demote Delete to a ghost text button at the bottom.

## Phase 15: Triage Flow
- [x] Install `sonner` and wire `<Toaster position="bottom-center" />` in `layout.tsx`.
- [x] Add `decrementItemQuantity(id, currentQuantity)` server action to `actions.ts`.
- [x] Smart sort: expiring within 48h floats to top of each location group (primary sort), secondary sort by active `sortBy`.
- [x] Update expiry threshold: `daysUntil <= 2` → `text-destructive font-bold`; `daysUntil === 3` → amber; in both `item-row.tsx` and `item-card.tsx`.
- [x] Repurpose swipe-right → green Consume button (Minus icon); swipe-left → red Toss button (Trash2).
- [x] Toss/Consume-to-zero show `"{name} removed."` toast with "Restock" action.

## Phase 16: Strict vs. Flexible Freshness System
- [x] Run SQL: `ALTER TABLE items ADD COLUMN is_perishable BOOLEAN DEFAULT false;`
- [x] Add `is_perishable` to `GroupedItem` and `ItemFormValues` in `types.ts`
- [x] Add `is_perishable` to SELECT query in `page.tsx`
- [x] Add `is_perishable` to insert/update payloads in `actions.ts`
- [x] Create `src/components/ui/switch.tsx` (Radix UI Switch)
- [x] Add `is_perishable` toggle to `item-sheet.tsx` with auto-detect for fridge/cooler/refrigerator locations
- [x] Replace expiry display in `item-row.tsx`: red "Expired:" for perishable, orange "Past Best By:" for non-perishable
- [x] Replace expiry display in `item-card.tsx`: same red/orange pattern
- [x] Add freshness explanation banners in `item-detail-drawer.tsx` when item is past expiry
- [x] Update sort priority in `inventory-client.tsx`: expired+perishable (priority 0) > expiring soon (priority 1) > everything else (priority 2)

## Phase 17: USDA Smart Expiration System
- [x] Create `src/lib/expiration-rules.ts` with `getGracePeriodDays(categoryName, locationName)` using USDA-backed keyword matching
- [x] Remove `is_perishable` Switch toggle and auto-detect `useEffect` from `item-sheet.tsx`
- [x] Update `item-row.tsx`: replace `is_perishable` threshold logic with `getGracePeriodDays()`
- [x] Update `item-card.tsx`: replace `is_perishable` threshold logic with `getGracePeriodDays()`
- [x] Update `item-detail-drawer.tsx`: replace `is_perishable` threshold logic with `getGracePeriodDays()`
- [x] Update `inventory-client.tsx` `getPriority()`: replace `is_perishable` with `getGracePeriodDays()` using category/location names

## Phase 18: Native App UI (Iteration 13 — UI Copy Clarity)
- [x] Fix Quantity display to always include the unit (fallback to 'units').
- [x] Calculate `safeUntilDate` based on `expiry_date` + `gracePeriodDays`.
- [x] Update Card/Row UI to show "Safe until: [Date]" for soft-expired items.
- [x] Update Detail Drawer banners with plain-English, date-specific USDA explanations.

## Phase 19: Native App UI (Iteration 14 - Card Parity)
- [x] Pass `onConsume` and `onToss` handlers down to `ItemCard` and `ItemDetailDrawer`.
- [x] Add "Consume 1" and "Toss" to the `ItemCard` `...` DropdownMenu.
- [x] Add a Quick Actions button row to the `ItemDetailDrawer`.

## Phase 20: Native App UI (Iteration 15 - Safety Guardrails)
- [x] Hide "Consume" from `ItemDetailDrawer` if `isHardExpired` is true.
- [x] Hide "Consume" from `ItemCard` dropdown if `isHardExpired` is true.
- [x] Disable right-swipe (Consume) on `ItemRow` if `isHardExpired` is true.

## Phase 21: Native App UI (Iteration 16 - Smart Restock Flow)
- [x] Add `'shopping'` to items status constraint via migration.
- [x] Add `addToShoppingList` server action in `actions.ts`.
- [x] Wire "Add to List" toast action in `handleConsume` (quantity hits 0).
- [x] Wire "Add to List" toast action in `handleToss`.

## Phase 22: Native App UI (Iteration 17 - Shopping List View)
- [x] Add `activeTab` state to `inventory-client` to swap between Pantry and Shopping views.
- [x] Create `ShoppingList` component matching Mucho's Basket design (circular checkboxes).
- [x] Implement local "in_cart" state for checked items (strikethrough text).
- [x] Add sticky "Restock X Items" button at the bottom of the shopping list.

## Phase 23: Native App UI (Iteration 18 - Fast Restock Drawer)
- [x] Create `FastRestockDrawer` using shadcn `Sheet`.
- [x] Add internal state to track draft quantities and expiration dates for restocked items.
- [x] Render Mucho-style rows with a quantity stepper and native date picker.
- [x] Wire the "Restock X Items" button to open this drawer instead of direct DB mutation.
- [x] Add `processRestock` server action to finalize dates, quantities, and status.

## Phase 24: Smart Shopping UI
- [x] Add search bar to filter shopping list items.
- [x] Add "hide in-cart" toggle to collapse checked items.
- [x] Group shopping list by category with collapsible headers.
- [x] Show a progress bar reflecting checked / total items.

## Phase 25: In-App Notification Center
- [x] Create `notifications` table in Supabase (user_id, item_id, title, message, type, is_read).
- [x] Add `AppNotification` interface to `src/lib/types.ts`.
- [x] Add `getNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `clearReadNotifications` server actions to `actions.ts`.
- [x] Create `NotificationBell` component with unread badge and Sheet inbox.
- [x] Place `<NotificationBell />` in the inventory header before the push-notification bell.

## Phase 26: Web Push & Cron
- [x] Run `notifications` table SQL migration in Supabase SQL Editor.
- [x] Run `supabase/add-push-subscriptions.sql` if `push_subscriptions` table doesn't exist.
- [x] Add `savePushSubscription` server action to `actions.ts`.
- [x] Create `PushManager` component (`push-manager.tsx`) with permission request and VAPID subscribe logic.
- [x] Render `<PushManager />` inside `NotificationBell` sheet below action buttons.
- [x] Enhance `/api/notify-expiring` cron to insert in-app `notifications` records per user after push sends.
- [x] Update `vercel.json` cron schedule to `0 13 * * *` (8:00 AM EST).

## Phase 27: Native App UI (Iteration 22 - Notification Hardening & Testing)
- [ ] Remove duplicate static Bell icon from the navigation UI.
- [ ] Add anti-spam database check to `api/notify-expiring` to prevent duplicate pushes per item.
- [ ] Add a temporary "Trigger Cron (Test)" button to the `PushManager` component.

## Phase 28: Household Sharing (Magic Link)
- [ ] Execute SQL to update `handle_new_user` trigger (see SQL below).
- [x] Update `signUp` server action to accept `invite_code`.
- [x] Update `sign-up/page.tsx` to read URL params and show an invite banner.
- [x] Create `ProfileSettings` drawer with "Copy Invite Link" and "Sign Out".
- [x] Replace LogOut button in header with User icon → opens ProfileSettings.

### SQL — Run in Supabase SQL Editor

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_code TEXT;
  v_household_id UUID;
BEGIN
  -- Check for invite code in metadata
  v_invite_code := NEW.raw_user_meta_data->>'invite_code';

  IF v_invite_code IS NOT NULL THEN
    -- Try to find household with matching invite code
    SELECT id INTO v_household_id
    FROM households
    WHERE invite_code = v_invite_code
    LIMIT 1;
  END IF;

  IF v_household_id IS NULL THEN
    -- No valid invite: create a new household
    INSERT INTO households (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Household') || '''s Household')
    RETURNING id INTO v_household_id;

    -- Seed default locations
    INSERT INTO locations (household_id, name) VALUES
      (v_household_id, 'Fridge'),
      (v_household_id, 'Freezer'),
      (v_household_id, 'Pantry'),
      (v_household_id, 'Counter');

    -- Seed default categories
    INSERT INTO categories (household_id, name) VALUES
      (v_household_id, 'Dairy'),
      (v_household_id, 'Meat'),
      (v_household_id, 'Produce'),
      (v_household_id, 'Beverages'),
      (v_household_id, 'Condiments'),
      (v_household_id, 'Snacks'),
      (v_household_id, 'Grains'),
      (v_household_id, 'Frozen'),
      (v_household_id, 'Other');
  END IF;

  -- Insert profile linked to the household
  INSERT INTO profiles (id, household_id, display_name)
  VALUES (
    NEW.id,
    v_household_id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
