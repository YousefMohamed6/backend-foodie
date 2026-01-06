# Order Push Notifications

## Overview

This system implements data-driven push notifications for order lifecycle events using Firebase Cloud Messaging (FCM). All notification content is stored in the database, making the system fully configurable without code changes.

## Architecture

### Components

1. **NotificationService** (`src/shared/services/notification.service.ts`)
   - Fetches notification templates from the database
   - Sends FCM notifications to users and vendors
   - Handles errors gracefully (no exceptions thrown)

2. **OrdersService** (`src/modules/orders/orders.service.ts`)
   - Triggers notifications on order creation
   - Triggers notifications on order status updates

3. **FcmService** (`src/shared/services/fcm.service.ts`)
   - Handles low-level FCM communication
   - Manages token validation and multicast sending

## Notification Triggers

### 1. Order Creation

**When**: A new order is created for the first time

**Recipient**: Vendor (the restaurant/business receiving the order)

**Template Key**: `notification_template_order_placed`

**Flow**:
```
Customer creates order
  → Order saved to database with status PLACED
  → NotificationService.sendVendorNotification() called
  → Template fetched from settings table
  → FCM notification sent to vendor's fcmToken
```

### 2. Order Status Updates

**When**: Order status changes (e.g., ACCEPTED, SHIPPED, COMPLETED)

**Recipient**: Customer (the person who placed the order)

**Template Key**: `notification_template_order_{status}` (lowercase)

**Examples**:
- `notification_template_order_accepted`
- `notification_template_order_shipped`
- `notification_template_order_completed`
- `notification_template_order_driver_pending`
- `notification_template_order_driver_accepted`

**Flow**:
```
Status updated via OrdersService.updateStatus()
  → Order status changed in database
  → NotificationService.sendOrderNotification() called
  → Template key constructed from new status
  → Template fetched from settings table
  → FCM notification sent to customer's fcmToken
```

## Database Schema

### Settings Table

Notification templates are stored in the `settings` table:

```sql
CREATE TABLE settings (
  key VARCHAR PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Template Format

Each template is stored as a JSON string in the `value` column:

```json
{
  "subject": "Order Placed",
  "message": "A new order has been placed at your restaurant"
}
```

### Example Records

```sql
INSERT INTO settings (key, value) VALUES
('notification_template_order_placed', '{"subject":"New Order","message":"You have received a new order"}'),
('notification_template_order_accepted', '{"subject":"Order Accepted","message":"Your order has been accepted"}'),
('notification_template_order_shipped', '{"subject":"Order Shipped","message":"Your order is on the way"}'),
('notification_template_order_completed', '{"subject":"Order Delivered","message":"Your order has been delivered"}'),
('notification_template_order_driver_pending', '{"subject":"Driver Assigned","message":"A driver is being assigned to your order"}'),
('notification_template_order_driver_accepted', '{"subject":"Driver En Route","message":"Your driver is on the way"}');
```

## FCM Token Management

### User Tokens

Users (customers, drivers) have an `fcmToken` field in the `users` table:

```typescript
user.fcmToken // Single token per user
```

### Vendor Tokens

Vendors have an `fcmToken` field in the `vendors` table:

```typescript
vendor.fcmToken // Single token per vendor
```

### Token Handling

- If no token exists, notification is silently skipped
- Invalid tokens are logged but don't throw errors
- System gracefully handles missing or expired tokens

## Notification Payload

FCM notifications are sent with the following structure:

```json
{
  "notification": {
    "title": "Order Placed",
    "body": "A new order has been placed"
  },
  "data": {
    "orderId": "uuid-here",
    "orderStatus": "PLACED"
  },
  "android": {
    "priority": "high"
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

## Adding New Order Statuses

To support a new order status:

1. **Add the status to Prisma schema** (if not already present)
2. **Create a notification template in the database**:
   ```sql
   INSERT INTO settings (key, value) VALUES
   ('notification_template_order_new_status', 
    '{"subject":"Status Title","message":"Status message"}');
   ```
3. **No code changes required** - the system automatically uses the template

## Key Design Principles

### 1. Data-Driven

All notification content comes from the database. The code never contains hardcoded notification text.

### 2. Key-Based

Template keys define the intent. The system doesn't interpret or map statuses - it uses the provided key directly.

### 3. Fail-Safe

- Missing templates are logged but don't crash
- Missing FCM tokens are handled gracefully
- FCM errors are caught and logged

### 4. Zero Business Logic

The notification system has no knowledge of:
- Order lifecycle stages
- Status meanings or semantics
- Business rules or workflows

It simply:
1. Receives a template key
2. Fetches the template
3. Sends the notification

## Error Handling

All errors are caught and logged without throwing exceptions:

```typescript
try {
  // Send notification
} catch (error) {
  console.error('Failed to send notification:', error);
  // Continue execution - don't block order processing
}
```

This ensures that notification failures never prevent order creation or status updates.

## Testing

### Manual Testing

1. **Create test templates**:
   ```sql
   INSERT INTO settings (key, value) VALUES
   ('notification_template_order_placed', 
    '{"subject":"Test Order","message":"This is a test notification"}');
   ```

2. **Create an order** via API
3. **Check vendor's device** for push notification
4. **Update order status** via API
5. **Check customer's device** for push notification

### Verification

Check logs for:
```
[FcmService] Push notification sent successfully to {token}
```

Or if FCM is not configured:
```
[FCM] Token: {token}, Title: {title}, Body: {body}
```

## Production Deployment

### Prerequisites

1. Firebase Admin SDK configured with service account
2. FCM tokens collected from mobile apps
3. Notification templates populated in database

### Configuration

Ensure `config/fcm.ts` has valid Firebase credentials:

```typescript
{
  fcm: {
    serviceAccount: {
      projectId: "your-project",
      privateKey: "...",
      clientEmail: "..."
    }
  }
}
```

### Database Setup

Run migration or manually insert notification templates for all order statuses your system uses.

## Limitations

- One FCM token per user/vendor (no multi-device support in current implementation)
- Notifications are fire-and-forget (no delivery confirmation)
- Template parsing errors result in skipped notifications

## Future Enhancements

Potential improvements (not currently implemented):

- Multi-device support (array of FCM tokens)
- Notification delivery tracking
- Template variable substitution (e.g., `{orderNumber}`)
- Retry logic for failed sends
- Notification preferences per user
