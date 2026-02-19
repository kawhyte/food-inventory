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
