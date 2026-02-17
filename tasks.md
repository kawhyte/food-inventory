# Food Inventory App — Development Roadmap

## Phase 1: Backend & Auth Foundation ← CURRENT
- [x] Set up Supabase client and environment variables
- [x] Execute SQL to create tables and Row Level Security (RLS) policies
- [ ] Implement basic Auth and Profile/Household linking

## Phase 2: Core Inventory CRUD ← CURRENT
- [x] Build UI for manual entry, location viewing, and status toggling
- [x] Implement realtime subscriptions for sync
- Note: Future option to add card/table view toggle as a user preference.

## Phase 3: Barcode Scanning Integration
- [ ] Integrate html5-qrcode
- [ ] Connect to OpenFoodFacts API to fetch product name/image

## Phase 4: Advanced Features
- [ ] Receipt OCR parsing
- [ ] Push Notifications for expiring items
