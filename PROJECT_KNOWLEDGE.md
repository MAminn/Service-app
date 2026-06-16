# Milano Home Services — Project Knowledge

> Source of truth for the codebase. Read this before generating code, in any new session, and before any architectural decision. If a request conflicts with this doc, flag it instead of silently complying.

## What this is
A **company-owned** home services / home facilities mobile app for **Milano, Lombardia, Italy**. The company provides the services directly. **This is NOT a marketplace** of independent providers — do not build provider onboarding, provider bidding, or provider payout logic.

## Scope (authoritative)
- **Active:** mobile app only (iOS + Android).
- **Canceled:** standalone marketing website, custom web admin dashboard.
- **Admin** lives **inside the mobile app**, role-gated. A backend/API still exists — that is infrastructure, not the canceled "dashboard."
- Do not reintroduce website/web-dashboard scope unless explicitly told to.

## Core principles
1. **Nothing business-critical is hardcoded.** Services, categories, prices, zones, and translatable text are **data**, managed by admin and stored server-side. Milano is a seeded zone, not a constant.
2. **Built to expand** to more zones/cities. All location logic keys off the `zones` table.
3. **Mobile-first operations system**, not a prototype. Favor clean, scalable structure over shortcuts.

## Languages & localization
- Primary: **Italian**. Also **English** and **Arabic**.
- i18next + react-i18next. **Arabic requires RTL** — handle layout direction from day one.
- User-facing catalog text (category/service names, descriptions) is stored as i18n JSONB fields, editable by admin.

## Tech stack
- **React Native (Expo)** + EAS (OTA updates).
- **Supabase**: Postgres, Auth, Storage, Row-Level Security, Realtime.
- **TanStack Query** for data fetching.
- **Stripe** for online payments (EU/SCA compliant). **Cash-on-delivery** = order flag, no provider.
- **Expo Notifications** (APNs/FCM) for push.
- **i18next** for localization.

## Identity model
- **No mandatory customer sign-up.** Guest submits a request with name + phone + email + address.
- **Phone number = lightweight identity key** for order tracking and notifications.
- **Admin users** authenticate (Supabase Auth) and carry a role; admin mode is unlocked by role, never shipped open.

## Data model (core entities)
- `service_categories` (i18n name, icon, sort_order, active)
- `services` (category_id, i18n name/description, base_price, price_unit, active)
- `zones` (name, city, active)
- `orders` (customer snapshot, service_id, zone_id, details, notes, status, payment_method, payment_status, scheduled_at, timestamps)
- `order_status_history` (order_id, status, changed_by, at)
- `complaints` (order_id, message, status, timestamps)
- `customers` (optional, phone-keyed)
- `admin_users` (role, auth binding)

Order status enum: `pending → reviewing → accepted/rejected → in_progress → completed` (+ `cancelled`). Every transition writes to `order_status_history`.

## Branding
White-label for now. Centralize colors/typography in a theme file so final branding drops in without touching screens.

## Pricing
Placeholder base prices, seeded. All prices admin-editable. Never hardcode a price in a screen.

## Security baseline
- RLS on all tables. Customers can only read their own order (by phone token); admin role can manage.
- Never expose service-role keys in the app. Sensitive operations go through secure backend functions.

## Milestones
- **M1** — Foundation + customer request flow (browse → submit → track by phone). Seeded data, i18n+RTL, schema.
- **M2** — Admin mode: order review/accept/reject, status updates, catalog & zone management.
- **M3** — Notifications + payments (Stripe + COD), complaints.
