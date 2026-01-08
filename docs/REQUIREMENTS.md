# Project Overview

This application facilitates the order and delivery process involving four key roles: Customer, Vendor, Manager, and Delivery Driver. The workflow includes order placement, acceptance by the vendor, notification of the manager for shipping, and final delivery to the customer.

# Key Requirements

## 1. Payment Handling & Timing

1. **Wallet Payment (Prepaid)**:
   * **Placement**: Total amount (Order Subtotal + Delivery Fee + Tip) is immediately deducted from the customer's wallet.
   * **SHIPPED**: Wallet credits occur at the shipping stage:
     * **Vendor**: Receives (Subtotal - Admin Commission).
     * **Driver**: Receives (Driver Portion of Delivery Fee + 100% of Tip).
     * **Admin**: Receives (Vendor Commission + Admin Portion of Delivery Fee).

2. **Cash on Delivery (COD)**:
   * **Placement**: No wallet deduction.
   * **DELIVERED**: Wallet credits occur *only* when the order is marked complete:
     * **Vendor, Driver, Admin**: Credited as per the Wallet Payment split.
     * **Driver Debt**: The full amount collected in cash (Subtotal + Fee + Tip) is recorded as a debt against the Driver's wallet balance.

## 2. Commission & Pricing Logic

1. **Delivery Fee Calculation**:
   * Calculated as `Distance (km) * Delivery_Fee_Per_Km`.
   * **Floor**: Must never be lower than `min_delivery_fee`.

2. **Admin Commission (Vendor)**:
   * Taken as a percentage of the order subtotal.
   * Waived if the vendor is on a premium/paid subscription plan (Price > 0).

3. **Admin Commission (Delivery)**:
   * The platform takes a percentage cut (`driver_commission_rate`) from the delivery fee.
   * **Driver Safety Floor**: The driver must receive at least `min_delivery_pay`. If the platform cut would push the driver below this floor, the platform commission is reduced to prioritize the driver's minimum pay.

4. **Tips**:
   * **Wallet**: 100% digital credit to the Driver's wallet.
   * **COD**: Tips are kept by the driver **physically in hand** at the time of delivery. They are NOT credited to the driver's digital wallet and are NOT included in the driver's debt calculation.
   * Neither the platform nor the vendor takes any share of the tips.
   * Verified separately in ledgers for transparency.

## 3. Financial Safety & Safeguards

1. **Driver Debt Limit**:
   * Drivers have a configurable `max_driver_debt` limit.
   * Managers are **prevented from assigning** new COD orders to a driver if their current debt + the new order total exceeds this limit.

2. **Negative Balance Prevention**:
   * Wallet transactions are atomic.
   * System ensures that refunds and reversals are handled strictly based on the order's state.

## 4. Cancellations and Refunds

1. **Pre-Shipping Cancellations**:
   * Wallet orders: Full refund to the customer (including tip).
   * COD orders: No wallet action needed.

2. **Post-Shipping Cancellations**:
   * Wallet orders: Platform reverses vendor/driver/admin credits and refunds the customer.
   * Tips are only reversed if the order never reached the delivery attempt.

3. **Post-Delivery (Completed)**:
   * Financial transactions are final. No automated reversals.


