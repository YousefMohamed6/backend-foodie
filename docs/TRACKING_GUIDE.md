# Live Order & Driver Tracking Integration

This document describes how live tracking is implemented for orders, allowing customers to see the driver's location in real-time.

---

## Overview

The live tracking system utilizes WebSockets (Socket.IO) to broadcast real-time driver GPS coordinates. Customers "watch" a specific order to receive these updates.

### Tracking Workflow

1. **Connection**: The application connects to the tracking namespace when the live tracking screen is opened.
2. **Identification**: The application sends an identifier for the specific order it wants to track.
3. **Observation**: The server joins the user to a dedicated room for that order.
4. **Reception**: As the driver moves, location updates (latitude, longitude, rotation) are received by the application.
5. **Update**: The application reflects these coordinates on the map, updating markers and route paths.
6. **Termination**: When the user leaves the screen, the application stops watching the order and disconnects from the tracking namespace to save resources.

---

## Technical Specifications

- **Namespace**: Dedicated namespace for order tracking.
- **Protocol**: WebSocket (Socket.IO).
- **Authentication**: JWT Bearer Token is required for secure tracking.
- **Events**:
    - Start tracking request.
    - Stop tracking request.
    - Real-time driver location update (includes coordinates and rotation).
    - Real-time order status update (for tracking status changes).

---

## Implementation Details

The implementation is divided into several layers:

### 1. Data Layer
- **DriverLocation Model**: Represents the driver's current position and heading.
- **TrackingSocketService**: Manages the low-level WebSocket connection, event emitting, and listening.

### 2. Business Logic Layer
- **LiveTrackingController**: Manages the tracking state, handles incoming socket events, calculates routes, and updates map markers. It ensures that the connection is alive only when active tracking is needed.

### 3. Presentation Layer
- **LiveTrackingScreen**: Renders the map (Google Maps or OSMap) and displays the customer, vendor, and driver locations. It reacts to updates from the controller to provide a smooth tracking experience.

---

## Best Practices Followed

- **Reconnection Handling**: The system automatically re-watches the current order if the connection is interrupted and restored.
- **Efficient Resource Usage**: Tracking is automatically stopped when the user navigates away from the tracking screen.
- **Smooth Animation**: Movement updates are handled to ensure a pleasant visual experience on the map.
- **Centralized Constants**: All socket event names and configuration values are centralized to avoid hardcoding.
