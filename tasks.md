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
- [ ] Implement client-side image compression for receipt uploads
