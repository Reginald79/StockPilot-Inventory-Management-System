# StockPilot — Inventory Management (Expo + Supabase)

Universal React app (web / iOS / Android) with Supabase backend. See `DESIGN.md` for architecture, ERD, and RLS details.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_functions_triggers.sql`
   - `supabase/migrations/0003_rls.sql`
   - `supabase/migrations/0004_transfers.sql`
   - `supabase/seed.sql` (optional starter data — includes the default location, which is required)
3. If you skip the seed, at minimum create a default location:
   ```sql
   insert into public.locations (name, is_default) values ('Main Warehouse', true);
   ```

## 2. Run the app

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key (Project Settings → API)
npm run web            # or: npm run ios / npm run android
```

## 3. Create your admin account

1. Sign up in the app (new users default to the `staff` role).
2. Promote yourself in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Manage other users' roles from **More → Users & roles** in the app.

## 4. Deploy web to Vercel

```bash
npm run build:web      # outputs static site to ./dist
```

- **Via dashboard:** import the repo in Vercel; Build command `npx expo export -p web`, Output directory `dist`. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
- **Via CLI:** `npx vercel deploy dist --prod`.
- Add a rewrite so client-side routes work — `vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

## 5. Mobile builds

`npx eas build` (requires an Expo account) for iOS/Android store builds; Expo Go works for development.

## Security model (summary)

- All enforcement is in Postgres RLS — the client checks in `lib/permissions.ts` are UI conveniences only.
- Stock quantities are never written by the client: sales, receiving, and adjustments go through SECURITY DEFINER RPCs that append to the `stock_movements` ledger; a trigger maintains `inventory`.
- Roles: `admin` (everything), `manager` (products, suppliers, POs, adjustments, reports), `staff` (record sales, view stock).
