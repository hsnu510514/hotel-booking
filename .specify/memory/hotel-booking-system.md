# Feature Specification: Hotel Booking System

**Feature Branch**: `001-hotel-booking-system`  
**Created**: 2025-12-28  
**Status**: Draft  
**Input**: User description: "Build an application that can book rooms, meals, and activities. it has user page and admin page. on user page, user got to login to book, but allow viewing in guest mode. user can book, cancel the rooms, meals, and activities when the login. on admin page, admin can add, edit, remove the type of rooms, meals, and activities. besides, it can also edit the bookings which have already been made. it should also have a panel to show the current status of booking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Browsing (Priority: P1)
As a guest, I want to view available rooms, meals, and activities without logging in, so I can see what is offered before deciding to book.

**Why this priority**: Fundamental to the user journey; users need to see offerings before they can interact further.

**Independent Test**: Verify that a non-logged-in user can access the landing page and see lists of rooms, meals, and activities.

**Acceptance Scenarios**:
1. **Given** a new visitor, **When** they navigate to the home page, **Then** they see a list of available rooms, meals, and activities.
2. **Given** a visitor on the room details page, **When** they click "Book Now", **Then** they are redirected to the login/signup page.

---

### User Story 2 - User Booking & Management (Priority: P1)
As a registered user, I want to log in and book rooms, meals, and activities, and also have the ability to cancel my bookings.

**Why this priority**: This is the core functionality of the application.

**Independent Test**: Log in as a user, book a room, verify it appears in "My Bookings", then cancel it and verify it is removed.

**Acceptance Scenarios**:
1. **Given** a logged-in user, **When** they select a room and click "Confirm Booking", **Then** the booking is saved and they see a confirmation.
2. **Given** a user with an active booking, **When** they click "Cancel Booking", **Then** the booking is removed from their list.

---

### User Story 3 - Admin Resource Management (Priority: P2)
As an admin, I want to add, edit, and remove rooms, meals, and activities so that I can manage the hotel's inventory.

**Why this priority**: Essential for keeping the application's data current and relevant.

**Independent Test**: Log in as admin, create a new activity, verify it appears for users, edit its price, and then delete it.

**Acceptance Scenarios**:
1. **Given** an admin on the management dashboard, **When** they add a new "Room Type", **Then** it becomes available for users to book.
2. **Given** an existing "Meal Option", **When** the admin edits its description, **Then** the updated description is visible to all users.

---

### User Story 4 - Admin Booking Oversight (Priority: P2)
As an admin, I want to see a status panel of all bookings and be able to edit or modify any booking made by any user.

**Why this priority**: Necessary for operational management and handling user requests or errors manually.

**Independent Test**: Navigate to admin dashboard, view the status panel, select a user's booking, change the date, and verify the user sees the updated date.

**Acceptance Scenarios**:
1. **Given** multiple user bookings, **When** the admin views the status panel, **Then** they see a summary of all active, pending, and cancelled bookings.
2. **Given** a user's booking, **When** the admin modifies the "Activity" details inside that booking, **Then** the change is reflected in the system.

---

### User Story 5 - Integrated Multi-Step Booking (Priority: P1)
As a user, I want a unified booking flow that allows me to select activities, rooms, and meals in a specific sequence, seeing real-time availability for each, so I can plan my entire stay on one page.

**Acceptance Scenarios**:
1. **Given** the booking page, **When** I first select a date range for activities, **Then** only activities available in that range are shown with their remaining capacity.
2. **Given** selected activities, **When** I move to the room section, **Then** the date range defaults to my activity range and shows available room quantities.
3. **Given** a room selection, **When** I choose meals, **Then** I can pick specific dates for each meal, defaulting to my arrival date.

---

### User Story 6 - Admin Advanced Management (Priority: P2)
As an admin, I want to manage bookings via dedicated tabs (Rooms/Meals/Activities) and search/filter by multiple criteria, so that I can quickly find specific records and view their full details.

**Acceptance Scenarios**:
1. **Given** the admin dashboard, **When** I click the "Rooms" tab, **Then** I only see room bookings.
2. **Given** a list of bookings, **When** I search by "check-in date" range AND "status=confirmed", **Then** the list is filtered to match both criteria.
3. **Given** a specific booking row, **When** I click it, **Then** a detailed view appears showing every item, price, and date in that booking.

### User Story 7 - Daily Operations & Reporting (Priority: P2)
As an admin, I want to export daily manifests for all resources or specific ones, so I can provide physical lists to staff (e.g., kitchen, housekeeping, activity coordinators).

**Acceptance Scenarios**:
1. **Given** the inventory dashboard, **When** I click "Export All", **Then** a single PDF containing guest lists for all resources with bookings is downloaded.
2. **Given** a specific resource view, **When** I click the download button, **Then** a PDF for just that resource is generated.
3. **Given** a guest with a Chinese name, **When** the PDF is generated, **Then** the name is displayed correctly (not as squares/question marks).

---

### Edge Cases
- **Inventory Shortage**: Handling cases where a user wants more units than are available for a specific date range.
- **Date Range Mismatch**: Validating that meal/activity dates fall within or logically relate to the stay duration.
- **Overlapping Bookings**: Ensuring inventory is correctly decremented **per day** across the entire booking duration. Availability display shows the **minimum** remaining count (bottleneck day) across all selected days.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide authentication (Login/Signup/Logout) for Users and Admins.
- **FR-002**: System MUST allow guests to view (Read-Only) rooms, meals, and activities.
- **FR-003**: System MUST allow authenticated users to Create and Delete (Cancel) their own bookings.
- **FR-004**: System MUST provide an Admin Dashboard for CRUD operations on Rooms, Meals, and Activities.
- **FR-005**: System MUST allow Admins to Update any booking record.
- **FR-006**: System MUST calculate total costs for bookings automatically.
- **FR-007**: System MUST provide a Status Panel (Dashboard summary) for Admins showing current booking trends and totals.
- **FR-008**: System MUST track real-time inventory for room types, meals, and activities.
- **FR-009**: System MUST support multi-unit booking (quantities) for all items.
- **FR-010**: System MUST provide an Admin Dashboard with tabs:
    - **All Reservations**: Displays full booking records (Guest, Dates, Total, Status). Clicking a row opens a detail modal.
    - **Rooms/Dining/Experiences**: Displays *booking items* of that type, with columns: Item Name, Guest, Date, Quantity, Price.
- **FR-011**: System MUST provide a detailed view for each booking, identifying all line items (Resource Name, Quantity, Dates, Prices).
- **FR-012**: System MUST provide Advanced Search capabilities on the Admin Dashboard, allowing multi-criteria filtering by:
    - Text (User Name, Email)
    - Date Range (Start/End dates)
    - Price (Greater/Less than)
    - Status (Confirmed/Cancelled)
- **FR-013**: System MUST provide an Admin Inventory Dashboard with:
    - Tabs for Rooms, Dining, and Experiences.
    - A date picker to select the specific day for inventory tracking.
    - A list of all resources in the selected category, showing: Total Inventory, Booked Count, Remaining Count.
    - "Available Resources" header MUST include an **Export All** button (see FR-014).
    - Interactivity: Clicking a resource type reveals the list of bookings using that resource on that day.
    - Drill-down: Clicking a specific booking opens the Booking Detail Modal.
    - "Guest List" card MUST display Guest Name, Email, and Pax count.
    - The "Guest List" card MUST NOT show a "Total Pax" footer.
- **FR-014**: System MUST provide Export Capabilities:
    - **Export All**: Button in "Available Resources" header. Downloads a single PDF for the selected day/tab.
        - Disabled if there are 0 bookings for the day.
        - PDF must handle auto-paging between resources.
    - **Sectional Export**: Button in "Guest List" header. Downloads PDF for specific resource.
        - Disabled if the resource has 0 bookings.
- **FR-015**: System MUST support Internationalization in PDF Exports:
    - Generated PDFs MUST correctly render UTF-8 characters (specifically Traditional Chinese) using embedded fonts (e.g., Noto Sans TC).

### Key Entities
- **User**: Represents a guest or customer. Attributes: name, email, password, role (User/Admin).
- **RoomType**: Attributes: name, description, price per night, capacity (people), total_inventory (units available **per day**).
- **MealOption**: Attributes: name, description, price, total_inventory (servings available **per day**).
- **Activity**: Attributes: name, description, price, duration, total_inventory (spots available **per day**).
- **Booking**: Links User to Room/Meal/Activity. Attributes: check_in, check_out, status (Confirmed/Cancelled), total_price.
- **BookingItem**: Links specific item to a Booking. Attributes: type (Room/Meal/Activity), quantity, unit_price, start_date, end_date.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Users can complete a multi-resource booking (Rooms + Meals + Activities) on a single page.
- **SC-002**: Admins can update the hotel inventory in under 1 minute.
- **SC-003**: All booking status changes must reflect in the database in under 500ms.
- **SC-004**: System MUST prevent overbooking by validating against real-time remaining capacity.
- **SC-005**: System UX must be consistent with the Project Constitution.

---

### User Story 8 - Premium UI/UX Overhaul (Priority: P1)
As a potential guest, I want a visually stunning, premium website experience that reflects the luxury of the hotel, so that I trust the brand and feel excited to book.

**Acceptance Scenarios**:
1. **Given** the home page, **When** it loads, **Then** I see a full-screen immersive hero section with smooth entry animations and a clear "Book Now" call to action.
2. **Given** resource cards (Rooms, Meals, Activities), **When** I view them, **Then** they appear as clean, clickable cards with high-quality imagery, square aspect ratios (for uniformity), and premium typography.
3. **Given** the navigation bar, **When** I scroll, **Then** it remains visible with a glassmorphism effect, ensuring text is legible against any background.
4. **Given** a mobile device, **When** I access the menu, **Then** it opens a smooth side-sheet navigation drawer.

## Functional Requirements (UI/UX Additions)
- **FR-016**: System MUST implement a "Premium" design theme:
    - Font Family: Sans-serif stack optimized for elegance (e.g., custom web fonts).
    - Color Palette: High-contrast "Premium Light" (warm/charcoal) and "Deep Dark" (blue-grey) modes.
    - Effects: Glassmorphism (`backdrop-blur`), subtle shadows, and smooth `hover-lift` interactions.
- **FR-017**: Home Page Layout:
    - Hero Section MUST be full-screen with parallax or gradient overlays.
    - "Features" section MUST use solid-background cards for readability.
    - "Explore" button MUST smooth-scroll to the accommodation section.
- **FR-018**: Component Enhancements:
    - **Navbar**: Sticky, high-contrast, with mobile-responsive "Sheet" menu.
    - **Cards**: "Book" buttons removed; entire card is clickable. Image fallbacks (e.g., `spa_activity.png`) MUST be implemented for missing assets.
    - **Badges**: distinct styles for prices, using `secondary` variants with backdrop blur.
