# Backend API Contract Specification

## Overview
This document defines the REST API contract for the Restaurant/Foodie app backend. The API should be framework-agnostic and can be implemented in either Laravel or Node.js/NestJS.

**Base URL**: `/api/v1`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`

---

## 📡 Standard Response Format

All API responses follow a consistent structure to simplify client-side handling:

### ✅ Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "message": "Human readable error message",
  "errorCode": "ERR_ENTITY_NOT_FOUND",
  "errors": [] // Optional array of validation errors
}
```

### 🔑 Common Error Codes
| Code | Description |
|------|-------------|
| `ERR_INTERNAL` | Unexpected server error |
| `ERR_UNAUTHORIZED` | Invalid or expired token |
| `ERR_FORBIDDEN` | Missing required permissions |
| `ERR_NOT_FOUND` | Resource does not exist |
| `ERR_BAD_REQUEST` | Validation or logic error |
| `ERR_DATABASE` | Data persistence failure |
| `SUBSCRIPTION_ORDER_LIMIT_REACHED` | Vendor has reached their plan's order limit |

---

## Authentication & Authorization

### User Roles
- `customer` - End users placing orders
- `vendor` - Restaurant owners/managers
- `driver` - Delivery drivers
- `admin` - System administrators

### Authentication Endpoints

#### Register User
```
POST /api/v1/auth/register
Body: {
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "countryCode": "string",
  "role": "customer" | "vendor" | "driver"
}
Response: {
  "user": UserModel,
  "token": "string"
}
```

#### Login
```
POST /api/v1/auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "user": UserModel,
  "token": "string"
}
```

#### Social Login (Google/Apple)
```
POST /api/v1/auth/social-login
Body: {
  "provider": "google" | "apple",
  "idToken": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
Response: {
  "user": UserModel,
  "token": "string"
}
```

#### Phone Verification
```
POST /api/v1/auth/send-otp
Body: {
  "phoneNumber": "string",
  "countryCode": "string"
}
Response: {
  "verificationId": "string"
}

POST /api/v1/auth/verify-otp
Body: {
  "verificationId": "string",
  "code": "string",
  "phoneNumber": "string"
}
Response: {
  "user": UserModel,
  "token": "string"
}
```

#### Password Reset
```
POST /api/v1/auth/forgot-password
Body: {
  "email": "string"
}
Response: {
  "message": "string"
}

POST /api/v1/auth/reset-password
Body: {
  "token": "string",
  "email": "string",
  "password": "string"
}
Response: {
  "message": "string"
}
```

#### Logout
```
POST /api/v1/auth/logout
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

---

## User Management

#### Get Current User
```
GET /api/v1/user/me
Headers: Authorization: Bearer {token}
Response: UserModel
```

#### Get User by ID
```
GET /api/v1/user/{userId}
Headers: Authorization: Bearer {token}
Response: UserModel
```

#### Update User Profile
```
PATCH /api/v1/user/me
Headers: Authorization: Bearer {token}
Body: {
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "profilePictureURL": "string",
  "shippingAddress": [ShippingAddress],
  "fcmToken": "string"
}
Response: UserModel
```

#### Delete User Account
```
DELETE /api/v1/user/me
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

#### Update User Location (Driver)
```
PATCH /api/v1/user/me/location
Headers: Authorization: Bearer {token}
Body: {
  "latitude": number,
  "longitude": number,
  "rotation": number
}
Response: UserModel
```

#### Get Driver Earnings
```
GET /api/v1/drivers/earnings
Headers: Authorization: Bearer {token}
Query: {
  "period": "daily" | "monthly" | "yearly",
  "date": "ISO8601 string"
}
Response: {
  "period": string,
  "startDate": string,
  "endDate": string,
  "totalOrders": number,
  "totalDeliveryFees": number,
  "totalTips": number,
  "driverNet": number,
  "driverTotalEarnings": number,
  "platformCommission": number,
  "orders": [
    {
      "id": "string",
      "vendorName": "string",
      "deliveryCharge": number,
      "tipAmount": number,
      "driverNet": number,
      "platformCommission": number,
      "paymentMethod": "string",
      "createdAt": "string"
    }
  ]
}
```

---

## Vendors

#### Get Nearest Vendors
```
GET /api/v1/vendors/nearest
Query: {
  latitude: number,
  longitude: number,
  radius?: number (default: 10km),
  isDining?: boolean,
  categoryId?: string,
  limit?: number (default: 20)
}
Response: {
  "vendors": VendorModel[]
}
```

#### Get Vendor by ID
```
GET /api/v1/vendors/{vendorId}
Response: VendorModel (Includes `isSubscriptionActive` boolean)
```

#### Get Vendor Products
```
GET /api/v1/vendors/{vendorId}/products
Query: {
  foodType?: "takeaway" | "dining",
  categoryId?: string
}
Response: {
  "products": ProductModel[]
}
```

#### Get Vendor Reviews
```
GET /api/v1/vendors/{vendorId}/reviews
Query: {
  page?: number,
  limit?: number
}
Response: {
  "reviews": RatingModel[],
  "pagination": PaginationMeta
}
```

#### Create Vendor (Admin/Vendor)
```
POST /api/v1/vendors
Headers: Authorization: Bearer {token}
Body: VendorModel (create)
Response: VendorModel
```

#### Update Vendor
```
PATCH /api/v1/vendors/{vendorId}
Headers: Authorization: Bearer {token}
Body: VendorModel (partial)
Response: VendorModel
```

---

## Products

#### Get Product by ID
```
GET /api/v1/products/{productId}
Response: ProductModel
```

#### Get All Products (Vendor)
```
GET /api/v1/products
Headers: Authorization: Bearer {token} (vendor)
Query: {
  vendorId?: string,
  categoryId?: string,
  publish?: boolean
}
Response: {
  "products": ProductModel[]
}
```

#### Create Product
```
POST /api/v1/products
Headers: Authorization: Bearer {token} (vendor)
Body: ProductModel (create)
Response: ProductModel
```

#### Update Product
```
PATCH /api/v1/products/{productId}
Headers: Authorization: Bearer {token} (vendor)
Body: ProductModel (partial)
Response: ProductModel
```

#### Delete Product
```
DELETE /api/v1/products/{productId}
Headers: Authorization: Bearer {token} (vendor)
Response: {
  "message": "string"
}
```

---

## Orders

#### Create Order
```
POST /api/v1/orders
Headers: Authorization: Bearer {token}
Body: {
  "vendorID": "string",
  "products": [{
    "productId": "string",
    "quantity": number,
    "extras": [{
      "name": "string",
      "price": number
    }],
    "discountPrice": number,
    "price": number
  }],
  "address": ShippingAddress,
  "paymentMethod": "cash" | "wallet" | "card" | "other",
  "couponId": "string",
  "cashbackId": "string",
  "deliveryCharge": number,
  "tipAmount": number,
  "notes": "string",
  "takeAway": boolean,
  "scheduleTime": "ISO8601 datetime"
}
Response: OrderModel
```

#### Get User Orders
```
GET /api/v1/orders
Headers: Authorization: Bearer {token}
Query: {
  status?: string,
  page?: number,
  limit?: number
}
Response: {
  "orders": OrderModel[],
  "pagination": PaginationMeta
}
```

#### Get Order by ID
```
GET /api/v1/orders/{orderId}
Headers: Authorization: Bearer {token}
Response: OrderModel
```

#### Get Vendor Orders
```
GET /api/v1/vendors/{vendorId}/orders
Headers: Authorization: Bearer {token} (vendor)
Query: {
  status?: string,
  page?: number,
  limit?: number
}
Response: {
  "orders": OrderModel[],
  "pagination": PaginationMeta
}
```

#### Update Order Status
```
PATCH /api/v1/orders/{orderId}/status
Headers: Authorization: Bearer {token}
Body: {
  "status": "Order Placed" | "Order Accepted" | "Order Rejected" | 
           "Order Cancelled" | "Driver Pending" | "Order Completed"
}
Response: OrderModel
```

#### Assign Driver to Order
```
POST /api/v1/orders/{orderId}/assign-driver
Headers: Authorization: Bearer {token} (admin/vendor)
Body: {
  "driverId": "string"
}
Response: OrderModel
```

#### Confirm Order Pickup
```
POST /api/v1/orders/{orderId}/pickup
Headers: Authorization: Bearer {token} (driver)
Response: OrderModel
```

---

## Wallet & Transactions

#### Get Wallet Balance
```
GET /api/v1/wallet/balance
Headers: Authorization: Bearer {token}
Response: {
  "balance": number
}
```

#### Get Wallet Transactions
```
GET /api/v1/wallet/transactions
Headers: Authorization: Bearer {token}
Query: {
  startDate?: ISO8601,
  endDate?: ISO8601,
  page?: number,
  limit?: number
}
Response: {
  "transactions": WalletTransactionModel[],
  "pagination": PaginationMeta
}
```

#### Top Up Wallet
```
POST /api/v1/wallet/topup
Headers: Authorization: Bearer {token}
Body: {
  "amount": number,
  "paymentMethod": "string",
  "paymentGateway": "fawaterak" | "stripe" | "paypal" | etc.
}
Response: {
  "transaction": WalletTransactionModel,
  "paymentUrl": "string" (if redirect required)
}
```

---

## Withdrawals & Payout Accounts

### 💸 Withdrawal Requests

#### Create Withdrawal Request
```
POST /api/v1/withdraw
Headers: Authorization: Bearer {token} (vendor/driver/manager)
Body: {
  "amount": number,
  "payoutAccountId"?: "string",
  "accountDetails"?: object (if accountId not provided)
}
Response: {
  "id": "string",
  "userId": "string",
  "amount": number,
  "status": "PENDING",
  "createdAt": "ISO8601"
}
```

#### Get My Withdrawal History
```
GET /api/v1/withdraw/history
Headers: Authorization: Bearer {token} (vendor/driver/manager)
Query: {
  page?: number,
  limit?: number
}
Response: {
  "requests": WithdrawalRequestModel[],
  "pagination": PaginationMeta
}
```

#### [Admin] Get Pending Requests
```
GET /api/v1/withdraw/pending
Headers: Authorization: Bearer {token} (admin)
Response: WithdrawalRequestModel[]
```

#### [Admin] Approve Request
```
POST /api/v1/withdraw/approve/{id}
Headers: Authorization: Bearer {token} (admin)
Response: { "success": true }
```

#### [Admin] Reject Request
```
POST /api/v1/withdraw/reject/{id}
Headers: Authorization: Bearer {token} (admin)
Body: { "reason": "string" }
Response: { "success": true }
```

#### [Admin] Complete Request (Finalize & Debit)
```
POST /api/v1/withdraw/complete/{id}
Headers: Authorization: Bearer {token} (admin)
Response: { "success": true }
```

### 💳 Payout Accounts

#### Get Saved Payout Accounts
```
GET /api/v1/withdraw/accounts
Headers: Authorization: Bearer {token} (vendor/driver/manager)
Response: PayoutAccountModel[]
```

#### Create Payout Account
```
POST /api/v1/withdraw/accounts
Headers: Authorization: Bearer {token} (vendor/driver/manager)
Body: {
  "method": "bank_transfer" | "paypal" | "stripe" | "vodafone_cash",
  "details": object,
  "isDefault": boolean
}
Response: PayoutAccountModel
```

#### Update Payout Account
```
PATCH /api/v1/withdraw/accounts/{id}
Headers: Authorization: Bearer {token}
Body: {
  "details"?: object,
  "isDefault"?: boolean
}
Response: PayoutAccountModel
```

#### Delete Payout Account
```
DELETE /api/v1/withdraw/accounts/{id}
Headers: Authorization: Bearer {token}
Response: { "success": true }
```

---

## Coupons & Cashback

#### Get Home Coupons
```
GET /api/v1/coupons/home
Response: {
  "coupons": CouponModel[]
}
```

#### Get Vendor Coupons
```
GET /api/v1/vendors/{vendorId}/coupons
Query: {
  isPublic?: boolean
}
Response: {
  "coupons": CouponModel[]
}
```

#### Validate Coupon
```
POST /api/v1/coupons/validate
Headers: Authorization: Bearer {token}
Body: {
  "code": "string",
  "vendorId": "string",
  "orderAmount": number
}
Response: {
  "valid": boolean,
  "coupon": CouponModel,
  "discount": number
}
```

#### Create Coupon (Vendor/Admin)
```
POST /api/v1/coupons
Headers: Authorization: Bearer {token}
Body: CouponModel (create)
Response: CouponModel
```

#### Update Coupon
```
PATCH /api/v1/coupons/{couponId}
Headers: Authorization: Bearer {token}
Body: CouponModel (partial)
Response: CouponModel
```

#### Delete Coupon
```
DELETE /api/v1/coupons/{couponId}
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

#### Get Cashback List
```
GET /api/v1/cashback
Response: {
  "cashbacks": CashbackModel[]
}
```

#### Get Redeemed Cashbacks
```
GET /api/v1/cashback/{cashbackId}/redeemed
Headers: Authorization: Bearer {token}
Response: {
  "redeemed": CashbackRedeemModel[]
}
```

---

## Subscriptions

#### Get All Subscription Plans
```
GET /api/v1/subscriptions/plans
Response: {
  "plans": SubscriptionPlanModel[]
}
```

#### Get Subscription Plan by ID
```
GET /api/v1/subscriptions/plans/{planId}
Response: SubscriptionPlanModel
```

#### Get User Subscription History
```
GET /api/v1/subscriptions/history
Headers: Authorization: Bearer {token}
Response: {
  "history": SubscriptionHistoryModel[]
}
```

#### Subscribe to Plan
```
POST /api/v1/subscriptions/subscribe
Headers: Authorization: Bearer {token}
Body: {
  "planId": "string",
  "paymentMethod": "string"
}
Response: {
  "subscription": SubscriptionHistoryModel,
  "paymentUrl": "string" (if redirect required)
}
```

---

## Favourites

#### Get Favourite Restaurants
```
GET /api/v1/favourites/restaurants
Headers: Authorization: Bearer {token}
Response: {
  "favourites": FavouriteModel[]
}
```

#### Add Favourite Restaurant
```
POST /api/v1/favourites/restaurants
Headers: Authorization: Bearer {token}
Body: {
  "vendorId": "string"
}
Response: FavouriteModel
```

#### Remove Favourite Restaurant
```
DELETE /api/v1/favourites/restaurants/{vendorId}
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

#### Get Favourite Items
```
GET /api/v1/favourites/items
Headers: Authorization: Bearer {token}
Response: {
  "favourites": FavouriteVendorModel[]
}
```

#### Add Favourite Item
```
POST /api/v1/favourites/items
Headers: Authorization: Bearer {token}
Body: {
  "productId": "string"
}
Response: FavouriteVendorModel
```

#### Remove Favourite Item
```
DELETE /api/v1/favourites/items/{productId}
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

---

## Reviews & Ratings

#### Get Order Review
```
GET /api/v1/orders/{orderId}/reviews/{productId}
Headers: Authorization: Bearer {token}
Response: RatingModel
```

#### Submit Review
```
POST /api/v1/reviews
Headers: Authorization: Bearer {token}
Body: {
  "orderId": "string",
  "productId": "string",
  "vendorId": "string",
  "rating": number (1-5),
  "comment": "string",
  "reviewAttributes": object
}
Response: RatingModel
```

#### Get Vendor Review Attributes
```
GET /api/v1/vendors/{vendorId}/review-attributes
Response: ReviewAttributeModel
```

---

## Referrals

#### Get Referral Code
```
GET /api/v1/referrals/my-code
Headers: Authorization: Bearer {token}
Response: {
  "referral": ReferralModel
}
```

#### Validate Referral Code
```
POST /api/v1/referrals/validate
Body: {
  "code": "string"
}
Response: {
  "valid": boolean,
  "referral": ReferralModel
}
```

#### Apply Referral Code
```
POST /api/v1/referrals/apply
Headers: Authorization: Bearer {token}
Body: {
  "code": "string"
}
Response: {
  "referral": ReferralModel,
  "message": "string"
}
```

---

## Gift Cards

#### Get Gift Cards
```
GET /api/v1/gift-cards
Response: {
  "giftCards": GiftCardsModel[]
}
```

#### Purchase Gift Card
```
POST /api/v1/gift-cards/purchase
Headers: Authorization: Bearer {token}
Body: {
  "giftCardId": "string",
  "amount": number,
  "recipientEmail": "string",
  "message": "string"
}
Response: {
  "order": GiftCardsOrderModel,
  "paymentUrl": "string"
}
```

#### Redeem Gift Card
```
POST /api/v1/gift-cards/redeem
Headers: Authorization: Bearer {token}
Body: {
  "code": "string"
}
Response: {
  "valid": boolean,
  "giftCard": GiftCardsOrderModel,
  "amount": number
}
```

#### Get Gift Card History
```
GET /api/v1/gift-cards/history
Headers: Authorization: Bearer {token}
Response: {
  "history": GiftCardsOrderModel[]
}
```

---

## Chat & Inbox

#### Get Admin Chat Threads
```
GET /api/v1/chat/admin/threads
Headers: Authorization: Bearer {token}
Response: {
  "threads": InboxModel[]
}
```

#### Get Chat Messages
```
GET /api/v1/chat/threads/{threadId}/messages
Headers: Authorization: Bearer {token}
Query: {
  page?: number,
  limit?: number
}
Response: {
  "messages": ConversationModel[],
  "pagination": PaginationMeta
}
```

#### Send Chat Message
```
POST /api/v1/chat/messages
Headers: Authorization: Bearer {token}
Body: {
  "threadId": "string",
  "message": "string",
  "type": "text" | "image" | "video",
  "mediaUrl": "string" (optional)
}
Response: ConversationModel
```

#### Get Chat Threads (Inbox)
```
GET /api/v1/chat/threads
Headers: Authorization: Bearer {token}
Response: {
  "threads": InboxModel[]
}
```

#### Create Private Chat (Customer -> Manager)
```
POST /api/v1/chat/private-chat
Headers: Authorization: Bearer {token}
Body: {
  "managerId": "string"
}
Response: ChatChannelModel
```

---

## Private Mobile Services (Marsoul)

#### Get All Active Managers
```
GET /api/v1/marsoul
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "data": [
    {
      "managerName": "string",
      "phone": "string",
      "zoneId": "string",
      "zoneName": "string"
    }
  ]
}
```

---

## Stories

#### Get Stories
```
GET /api/v1/stories
Query: {
  vendorId?: string
}
Response: {
  "stories": StoryModel[]
}
```

#### Get Story by ID
```
GET /api/v1/stories/{storyId}
Response: StoryModel
```

#### Create/Update Story (Vendor)
```
POST /api/v1/stories
Headers: Authorization: Bearer {token} (vendor)
Body: {
  "mediaUrl": "string",
  "mediaType": "image" | "video",
  "duration": number (for video)
}
Response: StoryModel
```

#### Delete Story
```
DELETE /api/v1/stories/{storyId}
Headers: Authorization: Bearer {token} (vendor)
Response: {
  "message": "string"
}
```

---

## Advertisements

#### Get All Advertisements
```
GET /api/v1/advertisements
Response: {
  "advertisements": AdvertisementModel[]
}
```

#### Get Advertisement by ID
```
GET /api/v1/advertisements/{advertisementId}
Response: AdvertisementModel
```

#### Create Advertisement (Admin/Vendor)
```
POST /api/v1/advertisements
Headers: Authorization: Bearer {token}
Body: AdvertisementModel (create)
Response: AdvertisementModel
```

#### Update Advertisement
```
PATCH /api/v1/advertisements/{advertisementId}
Headers: Authorization: Bearer {token}
Body: AdvertisementModel (partial)
Response: AdvertisementModel
```

#### Pause/Resume Advertisement
```
PATCH /api/v1/advertisements/{advertisementId}/toggle
Headers: Authorization: Bearer {token}
Response: AdvertisementModel
```

#### Delete Advertisement
```
DELETE /api/v1/advertisements/{advertisementId}
Headers: Authorization: Bearer {token}
Response: {
  "message": "string"
}
```

---

## Categories & Zones

#### Get Vendor Categories
```
GET /api/v1/categories
Query: {
  home?: boolean
}
Response: {
  "categories": VendorCategoryModel[]
}
```

#### Get Category by ID
```
GET /api/v1/categories/{categoryId}
Response: VendorCategoryModel
```

#### Create Category (Admin)
```
POST /api/v1/categories
Headers: Authorization: Bearer {token} (admin)
Body: VendorCategoryModel (create)
Response: VendorCategoryModel
```

#### Get Zones
```
GET /api/v1/zones
Response: {
  "zones": ZoneModel[]
}
```

#### Get Tax List
```
GET /api/v1/tax
Query: {
  latitude: number,
  longitude: number
}
Response: {
  "taxes": TaxModel[]
}
```

#### Get Delivery Charge
```
GET /api/v1/delivery/charge
Query: {
  latitude: number,
  longitude: number,
  vendorId: string
}
Response: {
  "charge": DeliveryCharge
}
```

---

## Settings & Configuration

#### Get App Settings
```
GET /api/v1/settings
Response: {
  "settings": SettingsModel
}
```

#### Get Onboarding List
```
GET /api/v1/onboarding
Query: {
  appType: "customer" | "vendor" | "driver"
}
Response: {
  "onboarding": OnBoardingModel[]
}
```

#### Get Languages
```
GET /api/v1/languages
Response: {
  "languages": LanguageModel[]
}
```

#### Get Current Currency
```
GET /api/v1/currency/current
Response: CurrencyModel
```

#### Get Home Banners
```
GET /api/v1/banners
Query: {
  position: "top" | "bottom"
}
Response: {
  "banners": BannerModel[]
}
```

#### Get Payment Settings
```
GET /api/v1/payment/settings
Response: {
  "settings": PaymentSettingsModel
}
```

---

## Driver Management (Admin)

#### Get All Drivers
```
GET /api/v1/admin/drivers
Headers: Authorization: Bearer {token} (admin)
Query: {
  available?: boolean,
  verified?: boolean
}
Response: {
  "drivers": UserModel[]
}
```

#### Update Driver
```
PATCH /api/v1/admin/drivers/{driverId}
Headers: Authorization: Bearer {token} (admin)
Body: UserModel (partial)
Response: UserModel
```

#### Get Driver Documents
```
GET /api/v1/drivers/me/documents
Headers: Authorization: Bearer {token} (driver)
Response: DriverDocumentModel
```

#### Upload Driver Document
```
POST /api/v1/drivers/me/documents
Headers: Authorization: Bearer {token} (driver)
Body: {
  "documentType": "string",
  "documentUrl": "string",
  "documentNumber": "string"
}
Response: DriverDocumentModel
```

#### Get Document List
```
GET /api/v1/admin/documents
Headers: Authorization: Bearer {token} (admin)
Response: {
  "documents": DocumentModel[]
}
```

---

## File Uploads

#### Upload User Image
```
POST /api/v1/upload/user-image
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: {
  file: File
}
Response: {
  "url": "string"
}
```

#### Upload Product Image
```
POST /api/v1/upload/product-image
Headers: Authorization: Bearer {token} (vendor)
Content-Type: multipart/form-data
Body: {
  file: File
}
Response: {
  "url": "string"
}
```

#### Upload Story Media
```
POST /api/v1/upload/story
Headers: Authorization: Bearer {token} (vendor)
Content-Type: multipart/form-data
Body: {
  file: File,
  type: "image" | "video"
}
Response: {
  "url": "string",
  "duration": number (for video)
}
```

#### Upload Chat Media
```
POST /api/v1/upload/chat-media
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: {
  file: File,
  type: "image" | "video"
}
Response: {
  "url": "string",
  "thumbnailUrl": "string" (for video)
}
```

---

## Realtime Features (WebSocket)

### Orders WebSocket

**Namespace**: `/orders`

**Connection**:
```
WS ws://host:port/orders
Auth: { token: "Bearer {jwt}" } OR Headers: Authorization: Bearer {token}
```

### Client Events (Subscribe)

#### Watch Single Order
```
Event: watchOrder
Data: { orderId: string }
Response: { event: 'watching', orderId: string }
```

#### Watch Vendor Orders (Vendor Role)
Vendors subscribe using their vendorId automatically.
```
Event: watchVendorOrders
Response: { event: 'watching_vendor', vendorId: string }
```

#### Watch Zone Orders (Manager Role)
Managers subscribe using their zoneId automatically.
```
Event: watchZoneOrders
Response: { event: 'watching_zone', zoneId: string }
```

#### Stop Watching
```
Event: stopWatchOrder
Data: { orderId: string }

Event: stopWatchVendorOrders

Event: stopWatchZoneOrders
```

### Server Events (Subscribe)

| Event | Recipient | Description |
|-------|-----------|-------------|
| `orderUpdated` | Order room subscribers | Order data changed |
| `customerOrderUpdated` | Customer (authorId) | Customer's own orders |
| `vendorOrderUpdated` | Vendor (vendorId) | Vendor's orders |
| `driverOrderUpdated` | Driver (driverId) | Driver's assigned orders |
| `zoneOrderUpdated` | Manager (zoneId) | Zone orders for managers |
| `orderDriverLocationUpdated` | Order room | Driver location update |

### Role-Based Order Updates

| Role | Subscription Method | Orders Received |
|------|-------------------|-----------------|
| Customer | Auto (authorId room) | Own orders only |
| Vendor | `watchVendorOrders` | Orders by vendorId |
| Manager | `watchZoneOrders` | Orders in assigned zone |
| Driver | Auto (driverId room) | Assigned orders only |


---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## Pagination

All list endpoints support pagination:
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)

Response:
{
  "data": [],
  "pagination": {
    "currentPage": number,
    "perPage": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

---

## Rate Limiting

- Public endpoints: 60 requests/minute
- Authenticated endpoints: 120 requests/minute
- File upload endpoints: 10 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1640995200
```

