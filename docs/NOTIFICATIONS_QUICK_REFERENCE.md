# Order Notifications - Quick Reference

## Setup

### 1. Run the SQL Migration

```bash
psql -U your_user -d your_database -f prisma/migrations/notification_templates.sql
```

Or execute the SQL directly in your database client.

### 2. Verify Templates

```sql
SELECT key, value FROM settings WHERE key LIKE 'notification_template_order_%';
```

## How It Works

### Order Creation → Vendor Notification

```typescript
// Automatically triggered in OrdersService.create()
await notificationService.sendVendorNotification(
  vendorId,
  'notification_template_order_placed',
  orderId,
  orderStatus
);
```

### Order Status Update → Customer Notification

```typescript
// Automatically triggered in OrdersService.updateStatus()
await notificationService.sendOrderNotification(
  customerId,
  `notification_template_order_${status.toLowerCase()}`,
  orderId,
  orderStatus
);
```

## Template Key Convention

**Pattern**: `notification_template_order_{status}`

**Examples**:
- `notification_template_order_placed` → Vendor receives when order created
- `notification_template_order_accepted` → Customer receives when vendor accepts
- `notification_template_order_shipped` → Customer receives when order ships
- `notification_template_order_completed` → Customer receives when delivered

## Adding a New Status

### Step 1: Add to Prisma Schema

```prisma
enum OrderStatus {
  // ... existing statuses
  NEW_STATUS @map("New Status Display Name")
}
```

### Step 2: Run Prisma Migration

```bash
npx prisma migrate dev --name add_new_order_status
npx prisma generate
```

### Step 3: Add Notification Template

```sql
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_new_status',
 '{"subject":"Status Title","message":"Status description for customer"}',
 NOW(), NOW());
```

### Step 4: Done!

No code changes needed. The system will automatically use the new template.

## Customizing Templates

### Update Existing Template

```sql
UPDATE settings 
SET value = '{"subject":"Updated Title","message":"Updated message"}',
    updated_at = NOW()
WHERE key = 'notification_template_order_placed';
```

### Template Format

```json
{
  "subject": "Notification Title (max ~50 chars)",
  "message": "Notification body text (max ~200 chars)"
}
```

## Testing

### Test Vendor Notification

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer {customer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "vendor-uuid",
    "products": [...],
    "addressId": "address-uuid",
    "paymentMethod": "cash"
  }'
```

Expected: Vendor receives push notification with "New Order Received" title.

### Test Customer Notification

```bash
curl -X PATCH http://localhost:3000/orders/{orderId}/status \
  -H "Authorization: Bearer {vendor_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED"
  }'
```

Expected: Customer receives push notification with "Order Accepted" title.

## Troubleshooting

### No Notification Received

1. **Check FCM token exists**:
   ```sql
   SELECT id, email, fcm_token FROM users WHERE id = 'user-uuid';
   SELECT id, title, fcm_token FROM vendors WHERE id = 'vendor-uuid';
   ```

2. **Check template exists**:
   ```sql
   SELECT * FROM settings WHERE key = 'notification_template_order_placed';
   ```

3. **Check server logs**:
   ```bash
   tail -f server.log | grep -i notification
   ```

4. **Verify Firebase config**:
   - Ensure `config/fcm.ts` has valid service account credentials
   - Check Firebase console for project status

### Template Not Found

If you see "Notification template not found" in logs:

```sql
-- List all notification templates
SELECT key FROM settings WHERE key LIKE 'notification_template_%';

-- Add missing template
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_your_status',
 '{"subject":"Title","message":"Message"}',
 NOW(), NOW());
```

### Invalid JSON in Template

```sql
-- Check template JSON validity
SELECT key, value FROM settings 
WHERE key LIKE 'notification_template_%'
AND value::json IS NULL;

-- Fix invalid JSON
UPDATE settings 
SET value = '{"subject":"Valid Title","message":"Valid message"}'
WHERE key = 'notification_template_order_placed';
```

## Best Practices

### 1. Keep Messages Concise

- **Subject**: 30-50 characters
- **Message**: 100-200 characters
- Mobile notifications have limited space

### 2. Be User-Friendly

- Use clear, actionable language
- Avoid technical jargon
- Include relevant context

### 3. Test Before Production

- Test all status transitions
- Verify on both iOS and Android
- Check notification appearance

### 4. Monitor Logs

```bash
# Watch for notification errors
tail -f server.log | grep -E "(notification|FCM)"
```

### 5. Backup Templates

```sql
-- Export templates
COPY (
  SELECT key, value FROM settings 
  WHERE key LIKE 'notification_template_%'
) TO '/tmp/notification_templates_backup.csv' CSV HEADER;
```

## API Reference

### NotificationService Methods

```typescript
// Send notification to customer
await notificationService.sendOrderNotification(
  userId: string,
  templateKey: string,
  orderId: string,
  orderStatus: string
);

// Send notification to vendor
await notificationService.sendVendorNotification(
  vendorId: string,
  templateKey: string,
  orderId: string,
  orderStatus: string
);
```

### Template Structure

```typescript
interface NotificationTemplate {
  subject: string;  // Notification title
  message: string;  // Notification body
}
```

### FCM Payload

```typescript
{
  notification: {
    title: string,    // From template.subject
    body: string      // From template.message
  },
  data: {
    orderId: string,
    orderStatus: string
  }
}
```

## Support

For issues or questions:
1. Check the full documentation: `docs/ORDER_NOTIFICATIONS.md`
2. Review server logs for error messages
3. Verify database templates are correctly formatted
4. Ensure FCM tokens are valid and up-to-date
