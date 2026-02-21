# Food Inventory PWA

## Project Context
- **Goal:** A low-friction digital food inventory Progressive Web App (PWA).
- **Users:** A 2-person household. 

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, `@serwist/next`.
- Backend: Supabase (PostgreSQL, Auth, Realtime).
- Scanning: `html5-qrcode` and OpenFoodFacts API.

## Token Efficiency & Agent Rules
- **No Conversational Filler:** Output only the requested code, plans, or direct answers. Skip greetings, summaries, and apologies.
- **Do Not Over-Engineer:** Build the simplest working POC (Proof of Concept) first. Do not add complex abstractions, configuration systems, or future-proofing unless explicitly asked.
- **Stop Output Bloat:** Do not generate unnecessary `.md` documentation files or long post-task summaries. 
- **Targeted Reading:** Do not glob or grep the entire codebase unnecessarily. Read only the specific files required for the current task.

## Architecture & Data
- **Household Sync:** All inventory and locations are tied to a shared `household_id`, NOT a specific `user_id`.
- **Database Schema:** Do not guess the schema. Read the SQL definitions located in the `supabase/` directory when database context is needed.

## Commands
- Build/Typecheck: `npm run build`
- Dev server: `npm run dev`

## Common Issues

### Native Binary Issues (Apple Silicon M1)
**Automated fix in place via `predev` and `prebuild` scripts.**

The script automatically detects when you're running Node.js in x64 mode (Rosetta) on M1 Mac and:
1. Cleans `.next` and `node_modules/.cache` directories
2. Force-installs missing arm64 binary packages:
   - `lightningcss-darwin-arm64`
   - `@tailwindcss/oxide-darwin-arm64`
3. Allows commands to run successfully

**No manual intervention needed** - just run `npm run dev` or `npm run build` and the fix applies automatically.

**Permanent Fix (Recommended):**
Install native arm64 Node.js to eliminate the root cause:
```bash
# Check current architecture
node -e "console.log(process.arch)"  # Currently shows "x64"

# Install native arm64 Node via Homebrew
brew reinstall node

# Clean and reinstall
rm -rf .next node_modules/.cache && npm ci

# Verify fix
node -e "console.log(process.arch)"  # Should show "arm64"
```

Once you install native arm64 Node.js, the predev script will detect the correct architecture and skip the fix (no overhead).