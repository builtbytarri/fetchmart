# FetchMart — Tasks Requiring Your Input

These items were identified in the audit but cannot be completed without a decision or credential from you.
Go through each section and let me know what you'd like to do.

---

## 🔑 Auth & Account

| # | Item | What we need from you |
|---|------|-----------------------|
| A1 | **Forgot password link** | A working email-delivery service (SMTP/SendGrid/Mailgun) and your domain. Currently the `/auth/forgot-password` endpoint exists in the backend but the email body has a placeholder reset URL. |
| A2 | **OTP / phone verification** | A choice of SMS provider (Twilio, Termii, Africastalking, etc.) and API credentials so we can send OTP codes to phone numbers. |
| A3 | **Google Sign-In** | A Google OAuth client ID (from Google Cloud Console). |
| A4 | **Apple Sign-In** | An Apple Developer team ID, service ID, and key file. |

---

## 🖼️ Product Images

| # | Item | What we need from you |
|---|------|-----------------------|
| P1 | **Image upload endpoint** | A cloud storage choice: Cloudinary, AWS S3, Firebase Storage, or similar. Currently `imageUrl` is stored as a free-text field — there is no upload endpoint. We need a provider + credentials to wire one up. |

---

## 📍 Saved Addresses

| # | Item | What we need from you |
|---|------|-----------------------|
| S1 | **Multi-address support** | Right now each user has ONE delivery address (stored on the `User` model). Do you want multiple saved addresses per customer (e.g. Home, Work, Other)? This would require a new `Address` table in the DB. |

---

## 🏍️ Rider Enhancements

| # | Item | What we need from you |
|---|------|-----------------------|
| R1 | **Vehicle info (type, plate, licence)** | The `VehicleInfo` screen is a placeholder. Do you want to store vehicle data (bike/car/truck, plate number, licence)? Needs a DB schema update and a backend endpoint. |
| R2 | **Rider offer timeout (60 s enforcement)** | If a rider does not accept or decline within 60 seconds, should the system auto-decline and offer to the next rider? Currently the timeout is shown in the UI but not enforced server-side (no NestJS job/timer). Confirm you want it enforced, and I'll add the `Bull` job. |

---

## 💳 Payments & Finance

| # | Item | What we need from you |
|---|------|-----------------------|
| F1 | **Saved payment methods** | The `PaymentMethods` screen is a placeholder. Do you want to allow customers to save card details? Flutterwave supports tokenised cards — confirm and I'll wire it up. |
| F2 | **Withdrawal minimum / fee** | When a store or rider requests a withdrawal, should there be a minimum amount (e.g. ₦1,000)? And should the platform charge a processing fee on withdrawals? |

---

## 📣 Notifications

| # | Item | What we need from you |
|---|------|-----------------------|
| N1 | **Email notifications for admin** | We discussed sending emails (e.g. for high-value order alerts, failed payouts). Confirm the provider (SendGrid, Resend, Mailgun) and we'll implement it. |
| N2 | **Notification preferences persistence** | The `NotificationsSettings` screen has toggles (push, email, SMS) but they are not persisted to the backend. Do you want these saved per-user in the DB? |

---

## 🎁 Promotions

| # | Item | What we need from you |
|---|------|-----------------------|
| PR1 | **Discount / coupon codes** | The home screen banners show promo codes (e.g. `FETCH20`). These are currently static UI. Do you want a real coupon system (create codes in admin → validate at checkout → apply discount)? |

---

## 🔍 Admin Search

| # | Item | What we need from you |
|---|------|-----------------------|
| AD1 | **Global search in admin header** | The search bar in the admin header is currently a UI stub. Should it search across orders, stores, users, and riders? Confirm scope and I'll build a `/admin/search?q=` endpoint. |

---

## 📊 Analytics

| # | Item | What we need from you |
|---|------|-----------------------|
| AN1 | **Analytics page** | The `/analytics` page is linked from the dashboard chart but does not exist yet. Do you want a dedicated analytics page with daily/weekly/monthly breakdowns of orders, revenue, top stores, and top riders? |

---

*Last updated: 15 Jun 2026*
