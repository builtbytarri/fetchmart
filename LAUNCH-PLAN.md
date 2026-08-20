# FetchMart — Pre-Launch Analysis & Implementation Plan

Generated 2026-08-06. Work through sections in order; P0 blocks launch.

---

## PART 1 — ANALYSIS FINDINGS

### P0-1 · Stores can withdraw money they haven't earned (financial loss)

**Severity: critical — unrecoverable real-money loss.**

`Wallet` has a single `balance` column (`schema.prisma:468`). There is no
distinction between *earned* and *provisional* funds.

The failure chain:

1. Customer pays → `payments.service.ts:238` calls `creditStoreForOrder`
   immediately at `PAID`, **before the store has even accepted the order**.
2. `wallet.service.ts:135` increments `wallet.balance` and pushes the amount
   into the Flutterwave store pool.
3. `requestWithdrawal` (`wallet.service.ts:421`) only checks
   `Number(wallet.balance) < amount`. Nothing marks the funds as provisional,
   so the store can withdraw instantly.
4. Store then declines the order (or the accept-timeout fires).
   `reverseOrderCredits` (`wallet.service.ts:220`) runs
   `balance: { decrement: amount }` with **no balance floor**.

Result: wallet balance goes negative, the customer is refunded from platform
funds, and the money already sent to the store's bank cannot be recovered.
A store can farm this deliberately: order → accept payment → withdraw → decline.

**Fix:** split the wallet into `balance` (withdrawable) and `pendingBalance`
(provisional). Credit to pending at `PAID`; promote pending → available only at
`COMPLETED`; reverse against pending. See Section A.

### P0-2 · Nobody can register — OTP is never delivered  ✅ FIXED

`auth.service.ts:360` generates and stores the code correctly, then only
`console.log`s it. There is no SMS provider anywhere in the codebase.

`RegisterScreen.tsx:105` hard-gates step 2 on `verifyOtp` with no skip path.

In production the reviewer — and every real user — is stuck on the second
screen of the app. Guaranteed App Store rejection. See Section B.

### P0-3 · Image upload is non-functional end to end

Three independent breaks:

- **Backend:** `r2.provider.ts:12` `getSignedUploadUrl` returns a plain
  concatenated URL with **no signature** — no AWS SDK, no HMAC. Any PUT to it
  is rejected by R2. `deleteFile` just logs and returns `true`.
- **Credentials:** `R2_*` values in `.env` are all `*-placeholder`.
- **Mobile:** `expo-image-picker` is not installed. `AddProductScreen.tsx` has
  no image field at all — there is no way to attach a photo to a product.

So stores cannot upload a storefront photo or any product image. Every listing
falls back to `product-placeholder.png`. See Section C.

### P0-4 · Password reset silently does nothing

`email/providers/mock.provider.ts` is the only provider — it logs and returns.
`ForgotPasswordScreen` reports success to the user regardless. Lower priority
than OTP (reviewers rarely test it) but it is a live user-facing lie.

### P1-5 · Admin cannot suspend or remove a defaulting store or rider

Client request #1. Current state:

- **Rider model has no status field whatsoever** (`schema.prisma:358-377`) —
  no `isVerified`, no `isActive`, no suspension. A rider cannot be stopped.
- **Admin riders page has zero row actions** — only pagination buttons.
- **Store** has `isVerified` (approve / revoke) but that conflates "never
  approved yet" with "banned for misconduct", and there is no delete.

See Section D.

### P1-6 · No fractional / unit-based quantities (mudu, kilo)

Client request #2.

- `Product` has no unit concept — only `price` and `stockQuantity Int`.
- `OrderItem.quantity` is `Int` (`schema.prisma:348`).
- `ProductDetailsScreen.tsx:195` steps by whole numbers with `Math.max(1, …)`.
- Cart adds by looping `for (let i = 0; i < quantity; i++)` — integer-only by
  construction.

A customer cannot buy ½ mudu of rice. See Section E.

### P1-7 · Stores must enter an exact stock count

Client request #4. `stockQuantity` is a required integer with no alternative
mode. A store selling sachets bought in bulk has to count them. Needs an
"In Stock" mode that skips counting. See Section F.

### P2-8 · Google Sign-In not configured

Deliberately removed from the build (its placeholder URL scheme caused the
ITMS-90158 rejection). The button is hidden. **Not a launch blocker** — Apple
Sign In covers the social-login requirement. Re-enable post-launch.

### P2-9 · Production secrets are development values

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` = `dev-*-change-in-production`.
  Anyone with repo access can mint tokens for any account.
- `FLUTTERWAVE_WEBHOOK_HASH=qwerttttty` — trivially guessable; webhooks are
  spoofable.
- Flutterwave IP whitelisting still not enabled → payouts and pool funding fail.

### Verified correct (no action needed)

- **Rider crediting timing is already right.** `creditRiderForOrder` is called
  only from `delivery.service.ts:345` on `COMPLETED`, and it reads
  `order.riderId` at that moment — so if an order is reassigned, the rider who
  actually delivered is the one paid. The concern about crediting on acceptance
  does not apply to the current code.
- Settlement / refund / reversal *logic* is sound and idempotent; the flaw is
  the missing pending-balance split, not the settlement paths themselves.
- No stubbed screens found outside the admin Help page ("Coming soon" badges).

---

## PART 2 — IMPLEMENTATION PLAN

### Section A · Wallet pending/available split  ✅ DONE (migration applied + verified)

**Schema**
- `Wallet`: add `pendingBalance Decimal @default(0) @db.Decimal(12,2)`.
- `Order`: add `storeSettled Boolean @default(false)`.

**Backend**
- `creditStoreForOrder` → increment `pendingBalance` (not `balance`).
- New `settleStoreForOrder(orderId)` — on `COMPLETED`, move the store payout
  from `pendingBalance` to `balance`, guarded by `storeSettled`.
- Call it from `delivery.service.ts` beside `creditRiderForOrder`.
- `creditRiderForOrder` → credit `balance` directly (already only fires at
  `COMPLETED`, so it is already earned).
- `reverseOrderCredits` → decrement `pendingBalance` when `!storeSettled`,
  else `balance`; clamp at zero and log a discrepancy rather than going
  negative.
- `requestWithdrawal` → unchanged (already reads `balance`), now correct.
- `getMyWallet` / `getFinanceOverview` → expose both figures.

**Frontend**
- Store + rider wallet screens: show "Available" and "Pending" separately.
- Admin finance: add pending column.

**Test:** pay → store declines → assert wallet never negative and withdrawal
is refused.

---

### Section B · SMS OTP (Termii)  ✅ DONE (verified in mock; needs API key to go live)

- `src/sms/` module mirroring `src/email/`: `sms.interface.ts`,
  `termii.provider.ts`, `mock.provider.ts`, `sms.service.ts`.
- Provider selected by `SMS_PROVIDER` env (`mock` in dev, `termii` in prod)
  so local development keeps the console-log behaviour.
- Env: `TERMII_API_KEY`, `TERMII_SENDER_ID`.
- `auth.service.ts:360` → replace `console.log` with `smsService.sendOtp`.
- Normalise Nigerian numbers to E.164 (`0803…` → `+234803…`) before sending —
  Termii rejects local format.
- Rate-limit: max 3 sends per phone per 15 min; the current
  `deleteMany` + `create` allows unlimited resends.
- Keep the DB record as source of truth so verification is unchanged.

---

### Section C · Image uploads  ✅ DONE (Cloudinary; needs credentials to go live)

**Backend**
- Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- Rewrite `r2.provider.ts` to issue a **real presigned PUT** URL; implement
  `deleteFile` properly.
- Validate `contentType` against an image allowlist and cap object size.
- Add DTO validation to `GetUploadUrlDto` (currently a bare class with no
  decorators — `ValidationPipe` does not check it).
- Real R2 credentials + a public bucket domain in `.env`.

**Mobile**
- `npx expo install expo-image-picker` (+ iOS photo-library usage string in
  `app.json`).
- Shared `<ImageUploadField>`: pick → request presigned URL → PUT → store the
  returned public URL.
- Wire into `AddProductScreen`, `EditProductScreen`, `CreateStoreScreen`,
  `StoreSettingsScreen`.

**Admin:** show the uploaded images in store/product tables.

---

### Section D · Suspend / delete stores and riders  ✅ DONE (migration applied + verified)

**Schema**
- New enum `AccountStatus { ACTIVE, SUSPENDED }`.
- `Store`: `status AccountStatus @default(ACTIVE)`, `suspendedReason String?`,
  `suspendedAt DateTime?`, `deletedAt DateTime?`.
- `Rider`: same four fields.
- Keep `Store.isVerified` for the approval flow — suspension is separate and
  must not be conflated with it.

**Backend**
- Admin endpoints: `POST /admin/stores/:id/suspend` (body: reason),
  `/unsuspend`, `DELETE /admin/stores/:id` (soft delete via `deletedAt`);
  identical set for riders.
- Hard delete is unsafe — orders carry FK references and financial history.
  Soft-delete only.
- Enforcement:
  - Suspended/deleted store excluded from all customer-facing store queries
    and cannot receive new orders.
  - Suspended rider cannot go available, cannot be auto-assigned, cannot
    accept offers.
  - Block at login with a clear message so the user is not left confused.
- In-flight orders on suspension: settle them through the existing
  `settleOrder` path rather than stranding the customer.

**Admin UI**
- Row action menu on both tables: Suspend (reason prompt) / Unsuspend / Delete
  with confirmation.
- Status badge column.

---

### Section E · Unit-based & fractional quantities (mudu / kg)  ✅ DONE (migration applied + verified)

**Schema**
- New enum `ProductUnit { PIECE, KG, MUDU, BAG, LITRE, PACK }`.
- `Product`: `unit ProductUnit @default(PIECE)`,
  `stepSize Decimal @default(1) @db.Decimal(6,3)`.
- `OrderItem.quantity`: `Int` → `Decimal @db.Decimal(10,3)`.
  ⚠️ Requires a data migration for existing rows — write it explicitly, do not
  let Prisma infer the cast.

**Backend**
- Order creation: validate `quantity % stepSize == 0` and `quantity > 0`.
- Line total = `unitPrice × quantity`, rounded to 2dp at the line level.
- Stock decrement must handle decimals (see Section F interaction).

**Mobile — customer**
- `ProductDetailsScreen`: when `unit !== PIECE`, replace the integer stepper
  with `stepSize` increments and quick-select chips (½, 1, 1½, 2).
- Display `₦2,500 / mudu` and the computed line total.
- Cart store: replace the `for` loop with a decimal quantity field — this is
  the change with the widest blast radius; check every `addItem` call site.

**Mobile — store**
- Unit picker + step size on Add/Edit Product.

---

### Section F · "In Stock" mode (no exact count)  ✅ DONE (migration applied + verified)

**Schema**
- New enum `StockMode { COUNTED, IN_STOCK }`.
- `Product`: `stockMode StockMode @default(COUNTED)`.

**Backend**
- `IN_STOCK` products skip stock validation and skip decrement on order.
- Availability is then driven purely by `isAvailable`.
- Restock endpoint accepts a mode switch.

**Mobile — store**
- Add/Edit Product: segmented control — "Track exact quantity" vs "In stock".
  Hide the numeric field in the second mode.
- Products list: show "In Stock" badge instead of a count.

**Mobile — customer**
- Show "In Stock" instead of "N left"; no max-quantity cap.

---

### Section G · Production hardening  ✅ DONE (code side; ops steps still yours)

- Rotate `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (`openssl rand -base64 48`).
- Strong `FLUTTERWAVE_WEBHOOK_HASH`, mirrored in the Flutterwave dashboard.
- Enable Flutterwave IP whitelisting for the VPS → unblocks payouts and the
  pool sweep.
- Redis on the VPS (BullMQ drives accept-timeout and rider-offer expiry).
- Real SMTP provider to replace the mock email provider.

---

## Suggested execution order

1. **A** — money correctness (highest risk, touches least UI)
2. **B** — OTP (unblocks registration → unblocks everything)
3. **C** — image uploads
4. **D** — suspend/delete (client request, self-contained)
5. **E + F** — quantities and stock mode (do together; both touch the product
   form and the order path)
6. **G** — hardening, then rebuild and resubmit

Sections A–D are independent and can be done in any order. E and F should be
one pass since they share migrations and the same screens.
