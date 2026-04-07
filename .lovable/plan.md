

# Why Dummy Data Is Still Showing

## Problem
Backend files are sitting in `server/` folder but **zero API calls** exist in the frontend. Every component uses hardcoded data:
- `Dashboard.tsx` — 6 plans hardcoded (line 49+)
- `DashboardData.ts` — dummy transactions, pool stats, plan badges
- `AdminPanel.tsx` — gift codes stored in local state
- `ReferralEngine.tsx` — fake referral tree
- `ProfilePanel.tsx` — static user data

Search for `fetch`, `axios`, `supabase`, `api.get` in the frontend = **0 results**. The frontend has never been connected to any backend.

## What Needs to Happen

### Step 1: Create API Service Layer
Create `src/lib/api.ts` with functions like `getPlans()`, `enrollInPlan()`, `getUserProfile()`, `getTransactions()`, etc. that call the Express backend endpoints.

### Step 2: Add Environment Config
Add `VITE_API_URL` env variable pointing to `http://localhost:4000/api` (or wherever the backend runs).

### Step 3: Connect Each Component to Real APIs
| Component | Replace | With API Call |
|-----------|---------|---------------|
| Dashboard | `plansData` array | `GET /api/plans` |
| Dashboard | balance, totalEarned | `GET /api/user/profile` |
| Dashboard | transactions | `GET /api/transactions` |
| Dashboard | pool stats | `GET /api/pools` |
| ReferralEngine | fake tree | `GET /api/referrals/tree` |
| AdminPanel | local gift codes | `GET/POST /api/admin/gift-codes` |
| ProfilePanel | static profile | `GET /api/user/profile` |

### Step 4: Add Loading States & Error Handling
Show skeleton loaders while data loads, toast on errors.

### Step 5: Auth Integration
Add wallet connect → login flow so API calls have user context (JWT token in headers).

## Important Note
Backend bhi abhi **run nahi ho raha** — it's just files. Tujhe pehle Kali me backend start karna hoga (PostgreSQL setup, `npm run dev`), tab frontend connect hoga. 

**Kya yeh plan sahi hai? Ya pehle backend Kali pe chalao, phir frontend connect karo?**

