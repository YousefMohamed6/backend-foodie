-- Order Notification Templates
-- These templates are used by the NotificationService to send push notifications
-- via Firebase Cloud Messaging (FCM) when orders are created or updated.

-- Template for when a new order is placed (sent to vendor)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_placed', 
 '{"subject":"New Order Received","message":"You have received a new order. Please review and accept it."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when vendor accepts the order (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_accepted',
 '{"subject":"Order Accepted","message":"Your order has been accepted and is being prepared."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when order is rejected (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_rejected',
 '{"subject":"Order Rejected","message":"Unfortunately, your order could not be accepted at this time."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when order is cancelled (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_cancelled',
 '{"subject":"Order Cancelled","message":"Your order has been cancelled."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when driver is being assigned (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_driver_pending',
 '{"subject":"Finding Driver","message":"We are finding a driver for your order."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when driver accepts the order (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_driver_accepted',
 '{"subject":"Driver Assigned","message":"A driver has been assigned and is on the way to pick up your order."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when order is shipped/picked up (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_shipped',
 '{"subject":"Order Picked Up","message":"Your order has been picked up and is on the way to you."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when order is in transit (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_in_transit',
 '{"subject":"Order In Transit","message":"Your order is currently being delivered."}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Template for when order is completed/delivered (sent to customer)
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('notification_template_order_completed',
 '{"subject":"Order Delivered","message":"Your order has been delivered. Enjoy your meal!"}',
 NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
