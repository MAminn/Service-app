# Milano Home Services — Mobile App (Milestone 1)

Company-owned home-services app for **Milano, Italy**. Milestone 1 delivers the
guest customer flow: browse seeded services, submit a request that lands in
Supabase as a `pending` order, and track orders by phone number.

> Read [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md) first — it is the source
> of truth for scope and architecture.

## Stack

- **React Native (Expo, TypeScript)**
- **Supabase** — Postgres + Auth + Row-Level Security
- **TanStack Query** — all data access
- **i18next / react-i18next** — Italian (default), English, Arabic with **RTL**
- Centralized white-label **theme** (no hardcoded colors in screens)

## What's in M1

- Customer flow: **Categories → Services → Service detail → Request form →
  Confirmation**, plus **Track order** by phone.
- Catalog (categories, services, prices) and zones come **from the database** —
  nothing business-critical is hardcoded.
- i18n catalog text stored as JSONB `{ it, en, ar }`.
- RLS: public can read active catalog, insert `pending` orders, and track their
  own orders via a phone-derived token (SECURITY DEFINER RPC).

**Not in M1:** admin UI, Stripe, push notifications.

## Project structure

```
src/
  components/   Reusable UI (Button, TextField, StatusBadge, States, ...)
  hooks/        TanStack Query hooks (categories, services, zones, orders)
  i18n/         i18next config, RTL helper, locale JSON, localized-field helper
  lib/          supabase client, query client, validation, formatting
  navigation/   Stack navigator + route param types
  screens/      Customer flow screens
  theme/        theme.ts (white-label colors / spacing / typography)
  types/        Domain entity types
supabase/
  migrations/   0001_init.sql  (schema, enums, triggers, RLS, tracking RPC)
  seed.sql      Categories, services, Milano zone
```

## Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine)
- Expo Go on a device, or an iOS/Android emulator

## 1. Set up Supabase

1. Create a project at <https://supabase.com>.
2. In the **SQL Editor**, run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`

   (Or, with the Supabase CLI: `supabase db push` then run the seed file.)

3. From **Project Settings → API**, copy the **Project URL** and the
   **anon public** key.

## 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The `EXPO_PUBLIC_` prefix is required so Expo exposes the values to the app.
The anon key is safe to ship — every table is protected by RLS. **Never** put
the service-role key in the app.

## 3. Install & run

```bash
npm install
npm start
```

Then press `i` (iOS), `a` (Android), or scan the QR code with Expo Go.

```bash
npm run typecheck   # tsc --noEmit
```

## Verifying the flow

1. **Browse**: open the app → pick a category → pick a service → view detail.
2. **Request**: tap _Request service_, fill the form (name, phone, email,
   address, zone), submit. Invalid phone/email are blocked client-side.
3. **Confirm**: you get an order reference (e.g. `MHS-1A2B3C4D`). The matching
   row appears in Supabase `orders` with `status = 'pending'` and a row in
   `order_status_history`.
4. **Track**: from the confirmation screen (or the link on the home screen),
   enter the phone number to see your order and its current status.

## Localization & RTL

- Device language is auto-detected; falls back to Italian.
- Use the language chips on the home screen to switch it / en / ar.
- Switching to Arabic flips layout direction via `I18nManager`. A native
  LTR↔RTL flip fully applies after an app reload (standard React Native
  behavior).

## Security notes

- All tables have RLS enabled.
- Public role: read active catalog, insert `pending` orders only, and call
  `get_orders_by_phone(text)` to retrieve **only** orders matching the supplied
  phone (token derived inside the SECURITY DEFINER function).
- The `orders` table is **not** directly selectable by the anon role.
