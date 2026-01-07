# Tasks: Hotel Booking System

**Input**: Design documents from `.specify/memory/hotel-booking-system.md` and `hotel-booking-plan.md`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize Bun project and install base dependencies (TanStack Start, Drizzle, Tailwind, @auth/core, @auth/drizzle-adapter)
- [x] T002 [P] Configure Tailwind CSS and shadcn/ui initial setup
- [x] T003 [P] Configure Drizzle ORM and PostgreSQL connection string in `.env`
- [x] T004 [P] Configure Auth.js session secret and OAuth credentials (Google, LINE) in `.env`
- [x] T005 Setup linting (ESLint/Biome) and project formatting rules

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T006 [P] Implement Drizzle schemas for Auth.js and Hotel entities in `db/schema.ts`
- [x] T007 [P] Implement Auth.js configuration and handlers for Google and LINE in `app/utils/auth.ts` (or equivalent)
- [x] T008 [P] Implement login/logout routes and components in `app/routes/login.tsx` using Auth.js
- [x] T009 Create database connection and migration scripts in `db/index.ts`
- [x] T010 [P] Seed the database with initial `RoomTypes`, `MealOptions`, and `Activities`

---

## Phase 3: User Story 1 - Guest Browsing (Priority: P1) 🎯 MVP

**Goal**: Allow non-logged-in users to view all available resources.

- [x] T011 [P] [US1] Build Guest View landing page in `src/routes/index.tsx`
- [x] T012 [P] [US1] Create individual list components for Rooms, Meals, and Activities in `src/components/`
- [x] T013 [US1] Implement server-side data fetching logic for resources using TanStack Query
- [x] T014 [US1] Add "Guest Mode" navigation and UI indicators

---

## Phase 4: User Story 2 - User Booking & Management (Priority: P1)
**Goal**: Logged-in users can book and cancel resources.

- [x] T015 [P] [US2] Implement Booking form and logic in `app/routes/book.tsx` (or modal)
- [x] T016 [P] [US2] Build "My Bookings" dashboard in `app/routes/dashboard.tsx`
- [x] T017 [US2] Implement "Cancel Booking" server action with validation
- [x] T018 [US2] Add cost calculation logic for combined bookings (Room + Meal + Activity)

---

## Phase 5: User Story 3 - Admin Resource Management (Priority: P2)
**Goal**: Admins can manage the hotel's inventory (CRUD).

- [x] T019 [P] [US3] Create Admin protection middleware/logic for `/admin` routes
- [x] T020 [P] [US3] Implement CRUD interfaces for Rooms in `app/routes/admin/rooms.tsx`
- [x] T021 [P] [US3] Implement CRUD interfaces for Meals in `app/routes/admin/meals.tsx`
- [x] T022 [P] [US3] Implement CRUD interfaces for Activities in `app/routes/admin/activities.tsx`

---

## Phase 6: User Story 4 - Admin Booking Oversight (Priority: P2)
**Goal**: Admin dashboard for viewing and editing all bookings.

- [x] T023 [P] [US4] Build Admin Booking Status Panel in `app/routes/admin/bookings.tsx`
- [x] T024 [P] [US4] Implement "Edit Booking" interface for admins to modify any user's booking
- [x] T025 [US4] Add summary statistics (Total Revenue, Active Bookings, Occupancy Rate) to the Admin Panel

---

## Phase 7: Polish & Performance

- [x] T026 [P] Implement transitions and hover effects as per Project Constitution
- [x] T027 Ensure 80%+ test coverage using `bun test` for core booking and calculation logic
- [x] T028 Final performance audit (interaction latency and bundle size)
- [x] T029 Accessibility (A11y) review for all UI components

## Phase 8: Enhanced Booking & Inventory

- [x] T030 Update Database Schema for inventory tracking and unit quantities
- [x] T031 Implement real-time availability calculation logic (remaining count)
- [x] T032 Redesign `book.tsx` into a multi-step, unified booking flow
- [x] T033 Update Admin CRUD forms to manage inventory counts
- [x] T034 Update Booking server functions to handle quantities and specific item dates
- [x] T035 Integrated validation to prevent overbooking during checkout

---

## Phase 9: Admin Panel Enrichment

- [x] T036 Implement "Tabbed Booking View" in `admin/bookings.tsx` (All / Rooms / Meals / Activities)
- [x] T037 Build `AdvancedSearchFilter` component (Text, DateRange, Price, Status)
- [x] T038 Fix booking detail modal not opening on row click
- [x] T039 Add `getBookingItems` backend function for item-level queries
- [x] T040 Refactor tabs: "All" shows bookings, resource tabs show booking *items* with Booking ID column
- [x] T041 Verify all tabs display correct data with proper table columns
- [x] T042 Refine Admin Dashboard resource tabs by removing "Booking ID" column as per updated requirements

---

## Phase 10: Premium UI Redesign (Post-MVP Polish)

- [x] T043 [P] **Global Theme**: Implement high-contrast "Premium" color palette (Light/Dark) and typography settings in `globals.css`
- [x] T044 [P] **Navbar**: Redesign for readability, better glassmorphism, and add Mobile "Sheet" Menu
- [x] T045 [P] **Home Page**: Implement Full-screen Hero, remove scroll indicators, and update buttons for smooth scrolling
- [x] T046 [P] **Cards**: Redesign Room/Meal/Activity cards (Square aspect, removing "Book" buttons, clickable cards, premium badges)
- [x] T047 **Assets**: Add logic for image fallbacks (e.g., `spa_activity.png`) and error handling

