# FetchMart — Agent Handoff Document

**Generated:** 15 Jun 2026  
**Repo:** `/Users/skg/Work/Amarni/main`  
**Stack:** NestJS backend (`market-backend/`) · React Native Expo app (`FetchMart/`) · Next.js admin (`admin/`)  
**Payments:** Flutterwave (working)  
**Maps:** Mapbox (distance, geocoding, map picker)

Use this document to continue work without re-reading the full chat. Prior transcript: `agent-transcripts/ddfef623-7609-4b7c-88fe-8d5a5a252042.jsonl`

---

## 1. Project structure

```
main/
├── market-backend/     # NestJS + Prisma + PostgreSQL + BullMQ + Socket.io
├── FetchMart/          # Expo React Native customer/store/rider app
├── admin/              # Next.js admin dashboard
├── dev.sh              # Local dev helper script
└── TODO-review-with-user.md   # Older audit list (partially outdated — see §5)
```

**Run migrations (required for new features):**
```bash
cd market-backend && npx prisma migrate deploy && npx prisma generate
```

**Uncommitted work:** ~104 files changed vs last commit (large feature branch — not yet committed/pushed per user preference).

---

## 2. Architecture overview

### 2.1 Money flow (payments → payouts)

```
Customer pays (Flutterwave) → MAIN Flutterwave balance
         │
         ├─ On PAID: credit store wallet (DB ledger) + fund Store Pool PSA (inline)
         ├─ On COMPLETED: credit rider wallet (DB ledger) + fund Rider Pool PSA (inline)
         └─ Admin profit stays on MAIN balance (service fee + commission + admin delivery cut)
         
Store/Rider withdraws → Flutterwave Transfer with debit_subaccount = pool PSA reference
```

**Key design decisions:**
- **DB wallet ledger** = source of truth for what each store/rider is owed
- **Flutterwave Payout Subaccounts (PSA)** = shared pool wallets (`storePoolSubaccountId`, `riderPoolSubaccountId` on `PlatformSettings`)
- Rider is unknown at payment time → rider share goes to **shared Rider Pool**, not per-rider subaccount
- Pool funding is **instant inline** on credit events (`wallet.service.ts` → `pushToPool()`), NOT hourly cron
- Pool PSAs auto-created once on server boot via `WalletService.ensurePoolSubaccounts()`

**Pool PSA bug that was fixed:** Both pools originally used the same default email (`finance@fetchmart.app`); Flutterwave rejected the second. Now:
- Store pool: `store-pool@fetchmart.app`
- Rider pool: `rider-pool@fetchmart.app`

**Admin finance page:** `admin/src/app/(dashboard)/finance/page.tsx`  
**Backend:** `GET /admin/finance/overview`, `POST /admin/finance/ensure-pools`

---

### 2.2 Delivery pricing algorithm

**Central service:** `market-backend/src/pricing/pricing.service.ts`  
**Settings:** `PlatformSettings` model (admin-tunable via Settings page)

```
distanceKm = Mapbox driving distance (fallback: haversine)

extraKm = max(0, ceil(distanceKm - freeRadiusKm))
distanceFee = extraKm × perKmRate

deliveryFee = baseFee + distanceFee + (bulkyCount × bulkyItemFee) + (extraStops × extraStopFee) + nightSurcharge

serviceFee = subtotal × serviceFeePercent / 100
commissionAmount = subtotal × commissionPercent / 100
storePayout = subtotal - commissionAmount
riderPayout = deliveryFee × riderDeliverySharePercent / 100
adminProfit = serviceFee + commissionAmount + (deliveryFee - riderPayout)
total = subtotal + serviceFee + deliveryFee
```

**Quote endpoint:** `GET /delivery/quote` (used by cart before checkout)  
**Order creation:** Same math applied in `orders.service.ts` so quote = charged amount

**Mobile:** `CartScreen` fetches quote when cart/address changes; shows subtotal, service fee, delivery (with km), coupon discount, total.

---

### 2.3 Checkout flow

```
CartScreen → paymentsApi.checkout({ storeId, items, destLat, destLng, redirectUrl, couponCode? })
    → Backend: OrdersService.create (validates store verified, open, stock, address)
    → Flutterwave initiatePayment
    → Returns { orderId, authorizationUrl, reference }
    → Navigate to PaymentScreen (WebView)
    → Deep link fetchmart://payment/callback
    → verify payment → order PAID → credit store wallet + fund store pool
```

**Atomic checkout:** If Flutterwave fails after order create, order is deleted and stock restored (`compensateOrder`).

---

### 2.4 Order lifecycle

```
CREATED → PAID → STORE_ACCEPTED → PREPARING → READY → ASSIGNED → PICKED_UP → EN_ROUTE → ARRIVED → COMPLETED
                                                                              ↘ CANCELLED
```

**Rider assignment:** When order becomes READY, nearest available rider gets offer.  
**60s timeout:** BullMQ job `RIDER_OFFER_TIMEOUT` in `market-backend/src/jobs/rider-offer-timeout.processor.ts`
- Scheduled on assign, cancelled on accept
- On timeout: auto-decline, reset to STORE_ACCEPTED, re-assign to next rider

---

### 2.5 Store verification

- `Store.isVerified` (default false)
- Admin approves/rejects: `admin` stores page
- Unverified stores: hidden from customer `findNearby`, blocked at order creation
- Store app gated by `StoreNavigator` → `PendingVerificationScreen` until verified

---

### 2.6 Saved addresses (multi-address)

**Model:** `SavedAddress` (label, address, lat/lng, isDefault)  
**Migration:** `20260615_saved_addresses` — migrates existing user profile address as "Home"  
**API:**
- `GET/POST /users/me/addresses`
- `PATCH/DELETE /users/me/addresses/:id`
- Default address syncs to `User.address/latitude/longitude` (used at checkout)

**Mobile:** `SavedAddressesScreen` — list, add, edit, delete, set default  
**Modal:** `DeliveryAddressModal` — full-screen search + map + live GPS + label picker (Home/Work/Other)

---

### 2.7 Address / location UX (shared components)

| Component | Path | Used in |
|-----------|------|---------|
| `AddressAutocomplete` | `FetchMart/src/components/AddressAutocomplete.tsx` | Register, Edit Profile, Store settings, Cart, Saved Addresses |
| `DeliveryAddressModal` | `FetchMart/src/components/DeliveryAddressModal.tsx` | Cart checkout, Saved Addresses |
| `LocationPickerScreen` | `FetchMart/src/screens/auth/LocationPickerScreen.tsx` | Register, modal map picker |

**AddressAutocomplete features:** Mapbox geocoding, 10 results, scrollable FlatList dropdown, proximity bias, debounced search.

**LocationPickerScreen features:** Mapbox map, draggable pin, GPS recenter, zoom controls, reverse geocode. Props: `autoLocate`, `initialLocation`, `confirmLabel`.

---

## 3. What has been implemented (this chat + prior in same session)

### Backend
- [x] `PlatformSettings` + `SettingsModule` — admin pricing/payout config
- [x] `PricingService` — delivery fee + order financial breakdown
- [x] `Product.isBulky` — bulky item surcharge
- [x] Delivery quote DTO/endpoint
- [x] Order fields: `subtotal`, `serviceFee`, `deliveryFee`, `commissionAmount`, `storePayout`, `riderPayout`, `adminProfit`, etc.
- [x] Wallet module — ledger, withdrawals, bank accounts
- [x] Flutterwave provider — payments, verify, transfers, PSA create/fund/balance
- [x] Inline pool funding on store credit (PAID) and rider credit (COMPLETED)
- [x] `ensurePoolSubaccounts()` — one-time PSA creation with unique emails
- [x] Admin finance overview + ensure-pools retry
- [x] Push notifications module (`User.pushToken`, register token, send on events)
- [x] Rider offer 60s timeout (BullMQ)
- [x] Store verification (`isVerified`, admin approve/reject)
- [x] Notification preferences on User (`notifyPush`, `notifyOrderUpdates`, etc.)
- [x] Coupons (`Coupon` model, admin CRUD, validate at checkout)
- [x] Withdrawal min amount + fee percent on PlatformSettings
- [x] Admin global search `GET /admin/search?q=`
- [x] Saved addresses (`SavedAddress` model + CRUD)
- [x] Vehicle info fields on Rider (migration `20260615_vehicle_and_payment_tokens`)
- [x] Payment tokens (for saved cards — schema exists, UI may be partial)

### Admin (`admin/`)
- [x] Settings page — pricing, commission, withdrawal rules
- [x] Finance page — profit, owed amounts, pool balances, withdrawals list
- [x] Stores page — verification badges, approve/reject in actions menu
- [x] Coupons management
- [x] Global search in header (live dropdown)
- [x] Map, orders, riders, analytics, activity, help pages (exist — depth varies)

### Mobile (`FetchMart/`)
- [x] Cart — quote breakdown, promo code, delivery address modal (full-screen + map)
- [x] Payment screen with WebView + deep link callback
- [x] Order details, order history fixes (exclude CREATED/unpaid, Decimal serialization)
- [x] Home — verified stores, refetch on tab focus, favourites filter
- [x] Closed store — browse-only, block add-to-cart
- [x] Store pending verification gate
- [x] Notification settings screen (persisted)
- [x] Saved addresses screen (full CRUD) — **fixed duplicate `openAddModal` syntax error**
- [x] Floating tab bar
- [x] Bank account screen for store/rider withdrawals
- [x] Rider vehicle info screen (UI exists)

---

## 4. Known bugs / fixes applied in this chat

| Issue | Fix |
|-------|-----|
| Finance page copy implied continuous pool creation + "hourly top-up" | Updated copy; removed hourly reference |
| Rider pool PSA missing (duplicate email) | Unique emails per pool; incremental persist; `ensurePoolSubaccounts()` on finance overview |
| Checkout address modal was bottom sheet only | Full-screen `DeliveryAddressModal` with map/GPS |
| Address autocomplete dropdown not scrollable | FlatList + max height + proximity bias |
| SavedAddressesScreen syntax error | Duplicate `openAddModal` renamed to `handleDeleteAddress` |
| Order history empty/wrong | Exclude CREATED orders, serialize Decimals, fix navigation |

---

## 5. NOT done / needs user input / incomplete

### Blocked on user credentials/decisions (`TODO-review-with-user.md`)
| ID | Item | Status |
|----|------|--------|
| A1 | Forgot password email delivery | Backend endpoint exists; email provider needed |
| A2 | OTP / phone verification SMS | Needs Twilio/Termii/etc. |
| A3 | Google Sign-In | Needs OAuth client ID |
| A4 | Apple Sign-In | Needs Apple Developer credentials |
| P1 | Product image upload | `imageUrl` is text field; needs Cloudinary/S3/R2 credentials |
| N1 | Email notifications for admin | Needs email provider |
| F1 | Saved payment methods (customer) | Schema may exist; PaymentMethods screen likely placeholder |
| AN1 | Dedicated analytics page depth | Page exists; may need richer breakdowns |

### Implemented since TODO doc was written (mark as DONE)
- S1 Multi-address → **DONE** (`SavedAddress`)
- N2 Notification preferences persistence → **DONE**
- PR1 Coupon system → **DONE**
- AD1 Admin global search → **DONE**
- F2 Withdrawal min/fee → **DONE**
- R2 Rider offer 60s timeout → **DONE**

### Likely follow-ups (not explicitly requested)
- [ ] Wire **cart checkout** to pick from saved addresses list (currently only changes profile address via modal)
- [ ] Commit + push the large uncommitted diff
- [ ] Run `prisma migrate deploy` on production/staging if not done
- [ ] Test rider pool PSA creation on live Flutterwave after migration
- [ ] PaymentMethods screen for customers (tokenized cards)
- [ ] Product image upload pipeline
- [ ] E2E tests for checkout → payout → withdrawal
- [ ] Update `TODO-review-with-user.md` to reflect completed items

---

## 6. Key files reference

### Backend
| Area | Files |
|------|-------|
| Schema | `market-backend/prisma/schema.prisma` |
| Pricing | `market-backend/src/pricing/pricing.service.ts` |
| Orders | `market-backend/src/orders/orders.service.ts` |
| Payments | `market-backend/src/payments/payments.service.ts` |
| Flutterwave | `market-backend/src/payments/providers/flutterwave.provider.ts` |
| Wallet/pools | `market-backend/src/wallet/wallet.service.ts` |
| Finance API | `market-backend/src/wallet/finance.controller.ts` |
| Settings | `market-backend/src/settings/` |
| Coupons | `market-backend/src/coupons/` |
| Notifications | `market-backend/src/notifications/` |
| Rider timeout | `market-backend/src/jobs/rider-offer-timeout.processor.ts` |
| Saved addresses | `market-backend/src/users/users.service.ts` (list/create/update/delete) |
| Admin | `market-backend/src/admin/admin.service.ts` |

### Mobile
| Area | Files |
|------|-------|
| Cart/checkout | `FetchMart/src/screens/customer/CartScreen.tsx` |
| Payment | `FetchMart/src/screens/customer/PaymentScreen.tsx` |
| Saved addresses | `FetchMart/src/screens/shared/SavedAddressesScreen.tsx` |
| Address modal | `FetchMart/src/components/DeliveryAddressModal.tsx` |
| Autocomplete | `FetchMart/src/components/AddressAutocomplete.tsx` |
| Map picker | `FetchMart/src/screens/auth/LocationPickerScreen.tsx` |
| API client | `FetchMart/src/api/` |
| Auth store | `FetchMart/src/store/authStore.ts` |
| Notifications hook | `FetchMart/src/hooks/useNotifications.ts` |

### Admin
| Area | Files |
|------|-------|
| API | `admin/src/lib/api.ts` |
| Finance | `admin/src/app/(dashboard)/finance/page.tsx` |
| Settings | `admin/src/app/(dashboard)/settings/page.tsx` |
| Stores | `admin/src/app/(dashboard)/stores/page.tsx` |
| Search | `admin/src/components/layout/header.tsx` |

---

## 7. Database migrations (Jun 2026 batch)

```
20260612093500_delivery_pricing_payout_splits
20260614_push_notifications
20260614_rider_accept_decline
20260615_store_verification
20260615_vehicle_and_payment_tokens
20260615_prefs_search_coupons_withdrawal
20260615_saved_addresses
```

---

## 8. API endpoints cheat sheet (new/changed)

```
# Delivery
GET  /delivery/quote?storeId=&destLat=&destLng=&items[]=...

# Payments
POST /payments/checkout          # atomic order + Flutterwave
POST /payments/verify/:reference

# Wallet
GET  /wallet/me
POST /wallet/withdraw
POST /wallet/bank-account

# Admin finance
GET  /admin/finance/overview
POST /admin/finance/ensure-pools
GET  /admin/finance/withdrawals

# Settings (admin)
GET/PATCH /admin/settings

# Coupons
POST /coupons/validate
GET/POST/PATCH/DELETE /admin/coupons

# Users
GET/PATCH /users/me
GET/PATCH /users/me/notifications
GET/POST /users/me/addresses
PATCH/DELETE /users/me/addresses/:id

# Admin
GET /admin/search?q=
POST /admin/stores/:id/verify
POST /admin/stores/:id/reject

# Notifications
POST /notifications/register-token
```

---

## 9. PlatformSettings fields (pricing)

```
deliveryBaseFee, freeRadiusKm, perKmRate, bulkyItemFee, extraStopFee
nightSurcharge, nightStartHour, nightEndHour
serviceFeePercent, commissionPercent, riderDeliverySharePercent
withdrawalMinAmount, withdrawalFeePercent
storePoolSubaccountId, riderPoolSubaccountId
```

---

## 10. Suggested next tasks for continuing agent

1. **Verify migrations applied** — run `prisma migrate deploy`, confirm `saved_addresses` table exists
2. **Cart + saved addresses integration** — let user pick from saved list at checkout, not only edit profile address
3. **PaymentMethods screen** — wire Flutterwave tokenization if user wants saved cards
4. **Image uploads** — once user picks storage provider, add upload endpoint + mobile picker
5. **Commit strategy** — user has not asked to commit; large diff is uncommitted. Ask before committing.
6. **QA checklist:**
   - Full checkout with coupon
   - Store withdrawal from pool
   - Rider withdrawal after completed delivery
   - Add/edit/delete saved address + set default
   - Store verification gate
   - Rider 60s timeout re-offer

---

## 11. Environment / config notes

- Mobile API base URL: `FetchMart/src/constants/config.ts`
- Mapbox token: same config file (`MAPBOX_ACCESS_TOKEN`)
- Flutterwave keys: `market-backend` env validation in `src/config/env.validation.ts`
- App deep link scheme: `fetchmart://` (see `app.json`)

---

*End of handoff. For full conversation context, search transcript `ddfef623-7609-4b7c-88fe-8d5a5a252042` for keywords: pool wallet, saved addresses, delivery pricing, verification, rider timeout, coupon.*
