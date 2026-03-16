# Fetchmart Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`  
**Last Updated:** January 15, 2026

---

## Table of Contents

1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Stores](#stores)
5. [Products](#products)
6. [Orders](#orders)
7. [Riders](#riders)
8. [Delivery](#delivery)
9. [Payments](#payments)
10. [Storage](#storage)
11. [WebSocket Events](#websocket-events)
12. [Error Responses](#error-responses)
13. [Data Models](#data-models)

---

## Health Check

### GET /health

Check the health status of all services.

**Authentication:** None required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T08:00:50.293Z",
  "services": {
    "app": { "status": "up" },
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

## Authentication

### POST /auth/register

Register a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8 characters)",
  "name": "string (required)",
  "phone": "string (optional)",
  "role": "CUSTOMER | STORE | RIDER (required)"
}
```

**Response (201 Created):**
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string"
}
```

**Errors:**
- `409 Conflict` - Email already exists

---

### POST /auth/login

Authenticate user and get tokens.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string"
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

### POST /auth/refresh

Refresh access token using refresh token.

**Authentication:** None required

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### POST /auth/logout

Logout and invalidate refresh token.

**Authentication:** Bearer Token (JWT)

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password

Request password reset email.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account exists, a reset email has been sent"
}
```

---

### POST /auth/reset-password

Reset password using token from email.

**Authentication:** None required

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 characters)"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Errors:**
- `400 Bad Request` - Invalid or expired token

---

## Users

### GET /users/me

Get current user profile.

**Authentication:** Bearer Token (JWT)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string | null",
  "role": "CUSTOMER | STORE | RIDER",
  "status": "ACTIVE | SUSPENDED",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

---

### PATCH /users/me

Update current user profile.

**Authentication:** Bearer Token (JWT)

**Request Body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string | null",
  "role": "CUSTOMER | STORE | RIDER",
  "status": "ACTIVE | SUSPENDED",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

---

## Stores

### POST /stores

Create a new store.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `STORE`

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "latitude": "number (required, -90 to 90)",
  "longitude": "number (required, -180 to 180)",
  "address": "string (optional)",
  "phone": "string (optional)",
  "openingHours": "object (optional, e.g., {\"mon\": \"9:00-17:00\"})"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "ownerUserId": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "number",
  "longitude": "number",
  "address": "string | null",
  "phone": "string | null",
  "logoUrl": "string | null",
  "isActive": true,
  "openingHours": "object | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `409 Conflict` - User already owns a store

---

### GET /stores/nearby

Find stores near a location.

**Authentication:** Bearer Token (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| latitude | number | Yes | Latitude (-90 to 90) |
| longitude | number | Yes | Longitude (-180 to 180) |
| radiusKm | number | No | Search radius in km (default: 10) |

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string | null",
    "latitude": "number",
    "longitude": "number",
    "address": "string | null",
    "logoUrl": "string | null",
    "isActive": true,
    "distance": "number (km)"
  }
]
```

---

### GET /stores/:storeId

Get store details by ID.

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| storeId | uuid | Store ID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "ownerUserId": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "number",
  "longitude": "number",
  "address": "string | null",
  "phone": "string | null",
  "logoUrl": "string | null",
  "isActive": true,
  "openingHours": "object | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `404 Not Found` - Store not found

---

### PATCH /stores/:storeId

Update store details.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Must be store owner

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| storeId | uuid | Store ID |

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "address": "string (optional)",
  "phone": "string (optional)",
  "logoUrl": "string (optional)",
  "isActive": "boolean (optional)",
  "openingHours": "object (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "ownerUserId": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "number",
  "longitude": "number",
  "address": "string | null",
  "phone": "string | null",
  "logoUrl": "string | null",
  "isActive": "boolean",
  "openingHours": "object | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `403 Forbidden` - Not store owner
- `404 Not Found` - Store not found

---

### GET /stores/:storeId/products

Get all products for a store.

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| storeId | uuid | Store ID |

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "storeId": "uuid",
    "name": "string",
    "description": "string | null",
    "price": "decimal",
    "imageUrl": "string | null",
    "category": "string | null",
    "stockQuantity": "integer",
    "isAvailable": "boolean",
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime"
  }
]
```

---

## Products

### POST /products

Create a new product.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `STORE`

**Request Body:**
```json
{
  "storeId": "uuid (required)",
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required, > 0)",
  "imageUrl": "string (optional)",
  "category": "string (optional)",
  "stockQuantity": "integer (optional, default: 0)",
  "isAvailable": "boolean (optional, default: true)"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "storeId": "uuid",
  "name": "string",
  "description": "string | null",
  "price": "decimal",
  "imageUrl": "string | null",
  "category": "string | null",
  "stockQuantity": "integer",
  "isAvailable": "boolean",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `403 Forbidden` - Not store owner
- `404 Not Found` - Store not found

---

### GET /products/:productId

Get product details.

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| productId | uuid | Product ID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "storeId": "uuid",
  "name": "string",
  "description": "string | null",
  "price": "decimal",
  "imageUrl": "string | null",
  "category": "string | null",
  "stockQuantity": "integer",
  "isAvailable": "boolean",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "store": {
    "id": "uuid",
    "name": "string"
  }
}
```

**Errors:**
- `404 Not Found` - Product not found

---

### PATCH /products/:productId

Update product details.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Must be store owner

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| productId | uuid | Product ID |

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "price": "number (optional)",
  "imageUrl": "string (optional)",
  "category": "string (optional)",
  "stockQuantity": "integer (optional)",
  "isAvailable": "boolean (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "storeId": "uuid",
  "name": "string",
  "description": "string | null",
  "price": "decimal",
  "imageUrl": "string | null",
  "category": "string | null",
  "stockQuantity": "integer",
  "isAvailable": "boolean",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `403 Forbidden` - Not store owner
- `404 Not Found` - Product not found

---

### DELETE /products/:productId

Delete a product.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Must be store owner

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| productId | uuid | Product ID |

**Response (200 OK):**
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `403 Forbidden` - Not store owner
- `404 Not Found` - Product not found

---

## Orders

### POST /orders

Create a new order.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `CUSTOMER`

**Request Body:**
```json
{
  "storeId": "uuid (required)",
  "items": [
    {
      "productId": "uuid (required)",
      "quantity": "integer (required, >= 1)"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "customerUserId": "uuid",
  "storeId": "uuid",
  "riderId": "uuid | null",
  "status": "CREATED",
  "totalAmount": "decimal",
  "paymentReference": "string | null",
  "assignedAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "orderItems": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "string",
      "unitPrice": "decimal",
      "quantity": "integer"
    }
  ]
}
```

**Errors:**
- `400 Bad Request` - Store not active, product unavailable, or insufficient stock
- `404 Not Found` - Store or product not found

---

### GET /orders/my

Get current user's orders.

**Authentication:** Bearer Token (JWT)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "customerUserId": "uuid",
    "storeId": "uuid",
    "riderId": "uuid | null",
    "status": "OrderStatus",
    "totalAmount": "decimal",
    "paymentReference": "string | null",
    "assignedAt": "ISO 8601 datetime | null",
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime",
    "store": {
      "id": "uuid",
      "name": "string"
    },
    "orderItems": [...]
  }
]
```

---

### GET /orders/:orderId

Get order details.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Must be order customer, store owner, or assigned rider

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | uuid | Order ID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "customerUserId": "uuid",
  "storeId": "uuid",
  "riderId": "uuid | null",
  "status": "OrderStatus",
  "totalAmount": "decimal",
  "paymentReference": "string | null",
  "assignedAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "store": {...},
  "customer": {...},
  "rider": {...},
  "orderItems": [...]
}
```

**Errors:**
- `403 Forbidden` - Not authorized
- `404 Not Found` - Order not found

---

### PATCH /orders/:orderId/status

Update order status (store operations).

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `STORE`, must be store owner

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | uuid | Order ID |

**Request Body:**
```json
{
  "status": "PAID | STORE_ACCEPTED | PREPARING | READY | CANCELLED"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "OrderStatus",
  ...
}
```

**Errors:**
- `400 Bad Request` - Invalid status transition
- `403 Forbidden` - Not store owner
- `404 Not Found` - Order not found

---

## Riders

### POST /riders/onboard

Create rider profile.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`

**Request Body:** None required

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "isAvailable": false,
  "currentLatitude": "number | null",
  "currentLongitude": "number | null",
  "lastPingAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `409 Conflict` - Rider profile already exists

---

### PATCH /riders/availability

Toggle rider availability.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`

**Request Body:**
```json
{
  "isAvailable": "boolean (required)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "isAvailable": "boolean",
  "currentLatitude": "number | null",
  "currentLongitude": "number | null",
  "lastPingAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `404 Not Found` - Rider profile not found

---

### POST /riders/location

Update rider GPS location.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`

**Request Body:**
```json
{
  "latitude": "number (required, -90 to 90)",
  "longitude": "number (required, -180 to 180)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "isAvailable": "boolean",
  "currentLatitude": "number",
  "currentLongitude": "number",
  "lastPingAt": "ISO 8601 datetime",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `404 Not Found` - Rider profile not found

---

### GET /riders/me

Get current rider profile.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "isAvailable": "boolean",
  "currentLatitude": "number | null",
  "currentLongitude": "number | null",
  "lastPingAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Errors:**
- `404 Not Found` - Rider profile not found

---

## Delivery

### POST /delivery/orders/:orderId/assign-rider

Manually assign a rider to an order.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `STORE`, must be store owner

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | uuid | Order ID |

**Request Body:**
```json
{
  "riderId": "uuid (required)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "ASSIGNED",
  "riderId": "uuid",
  "assignedAt": "ISO 8601 datetime",
  "store": {...},
  "rider": {
    "id": "uuid",
    "user": {
      "name": "string",
      "phone": "string"
    }
  }
}
```

**Errors:**
- `400 Bad Request` - Order not in READY status or rider not available
- `403 Forbidden` - Not store owner
- `404 Not Found` - Order or rider not found

---

### PATCH /delivery/orders/:orderId/status

Update delivery status (rider operations).

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`, must be assigned rider

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | uuid | Order ID |

**Request Body:**
```json
{
  "status": "PICKED_UP | EN_ROUTE | ARRIVED | COMPLETED"
}
```

**Valid Status Transitions:**
- `ASSIGNED` → `PICKED_UP`
- `PICKED_UP` → `EN_ROUTE`
- `EN_ROUTE` → `ARRIVED`
- `ARRIVED` → `COMPLETED`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "OrderStatus",
  "store": {...},
  "orderItems": [...]
}
```

**Errors:**
- `400 Bad Request` - Invalid status transition
- `403 Forbidden` - Not assigned rider
- `404 Not Found` - Order not found

---

### GET /delivery/my-deliveries

Get rider's active deliveries.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Role must be `RIDER`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "status": "ASSIGNED | PICKED_UP | EN_ROUTE | ARRIVED",
    "totalAmount": "decimal",
    "assignedAt": "ISO 8601 datetime",
    "store": {
      "id": "uuid",
      "name": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "customer": {
      "name": "string",
      "phone": "string"
    },
    "orderItems": [...]
  }
]
```

---

## Payments

### POST /payments/orders/:orderId/initiate

Initiate payment for an order.

**Authentication:** Bearer Token (JWT)  
**Authorization:** Must be order customer

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | uuid | Order ID |

**Request Body:** None required

**Response (200 OK):**
```json
{
  "success": true,
  "reference": "string",
  "authorizationUrl": "string (redirect URL for payment)",
  "accessCode": "string"
}
```

**Errors:**
- `400 Bad Request` - Order not in CREATED status
- `403 Forbidden` - Not order customer
- `404 Not Found` - Order not found

---

### GET /payments/verify/:reference

Verify payment status.

**Authentication:** None required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| reference | string | Payment reference |

**Response (200 OK):**
```json
{
  "success": true,
  "reference": "string",
  "status": "PENDING | SUCCESS | FAILED | ABANDONED | REFUNDED",
  "amount": "number",
  "currency": "string",
  "paidAt": "ISO 8601 datetime | null"
}
```

---

### POST /payments/webhook/korah

Korah Pay webhook endpoint.

**Authentication:** Signature verification via `x-korah-signature` header

**Request Body:**
```json
{
  "event": "charge.success | charge.failed",
  "data": {
    "reference": "string",
    "amount": "number",
    "currency": "string",
    ...
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

---

## Storage

### POST /storage/upload-url

Get a signed URL for file upload.

**Authentication:** Bearer Token (JWT)

**Request Body:**
```json
{
  "folder": "string (required, e.g., 'stores', 'products')",
  "filename": "string (required)",
  "contentType": "string (required, e.g., 'image/jpeg')"
}
```

**Response (200 OK):**
```json
{
  "uploadUrl": "string (signed URL for PUT request)",
  "publicUrl": "string (public CDN URL after upload)",
  "key": "string (file key/path)",
  "expiresAt": "ISO 8601 datetime"
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket server with JWT authentication.

**URL:** `ws://localhost:3000`

**Authentication:** Pass JWT token in handshake:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

### Subscribe to Channels

**Subscribe to Order Updates:**
```javascript
socket.emit('subscribe:order', { orderId: 'uuid' });
```

**Subscribe to Store Updates (STORE role only):**
```javascript
socket.emit('subscribe:store', { storeId: 'uuid' });
```

**Subscribe to Rider Updates (RIDER role only):**
```javascript
socket.emit('subscribe:rider', { riderId: 'uuid' });
```

### Events Received

| Event | Description | Payload |
|-------|-------------|---------|
| `order_status_changed` | Order status updated | `{ orderId, newStatus }` |
| `rider_assigned` | Rider assigned to order | `{ orderId, rider: { id, name, phone } }` |
| `rider_location_update` | Rider location changed | `{ riderId, latitude, longitude, timestamp }` |
| `delivery_completed` | Delivery finished | `{ orderId, completedAt }` |
| `new_order_assigned` | New order for rider | `{ orderId, store: { id, name } }` |

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": "number",
  "message": "string | string[]",
  "error": "string"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or business rule violation |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Response when exceeded:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## Data Models

### User Roles
```
CUSTOMER - Can create orders, view stores/products
STORE    - Can manage store, products, accept orders
RIDER    - Can accept deliveries, update location
```

### User Status
```
ACTIVE    - Normal account
SUSPENDED - Account disabled
```

### Order Status Lifecycle
```
CREATED        → Initial state after order creation
PAID           → Payment verified
STORE_ACCEPTED → Store confirmed the order
PREPARING      → Store is preparing the order
READY          → Order ready for pickup
ASSIGNED       → Rider assigned to order
PICKED_UP      → Rider picked up the order
EN_ROUTE       → Rider on the way to customer
ARRIVED        → Rider arrived at destination
COMPLETED      → Delivery completed
CANCELLED      → Order cancelled (can happen from CREATED to READY)
```

### Payment Status
```
PENDING   - Payment initiated, awaiting completion
SUCCESS   - Payment successful
FAILED    - Payment failed
ABANDONED - Customer abandoned payment
REFUNDED  - Payment refunded
```

---

## Environment Variables

Required environment variables for the API:

```env
# Application
APP_PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/market_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Payment (Korah Pay)
KORAH_PUBLIC_KEY=your-public-key
KORAH_SECRET_KEY=your-secret-key
KORAH_WEBHOOK_SECRET=your-webhook-secret

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

---

## Example Workflows

### Customer Order Flow
1. `POST /auth/login` - Authenticate
2. `GET /stores/nearby` - Find nearby stores
3. `GET /stores/:storeId/products` - Browse products
4. `POST /orders` - Create order
5. `POST /payments/orders/:orderId/initiate` - Pay for order
6. Subscribe to WebSocket `order:{orderId}` for updates
7. Track order status via WebSocket events

### Store Owner Flow
1. `POST /auth/login` - Authenticate
2. `POST /stores` - Create store (first time)
3. `POST /products` - Add products
4. Subscribe to WebSocket `store:{storeId}` for new orders
5. `PATCH /orders/:orderId/status` - Accept/prepare orders
6. `POST /delivery/orders/:orderId/assign-rider` - Assign rider

### Rider Flow
1. `POST /auth/login` - Authenticate
2. `POST /riders/onboard` - Create rider profile (first time)
3. `PATCH /riders/availability` - Go online
4. `POST /riders/location` - Update location periodically
5. Subscribe to WebSocket `rider:{riderId}` for assignments
6. `GET /delivery/my-deliveries` - View active deliveries
7. `PATCH /delivery/orders/:orderId/status` - Update delivery status

---

*Documentation generated for Fetchmart Backend v1.0.0*
