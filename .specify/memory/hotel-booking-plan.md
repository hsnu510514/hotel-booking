# Implementation Plan: Hotel Booking System

**Branch**: `001-hotel-booking-system` | **Date**: 2025-12-28 | **Spec**: [.specify/memory/hotel-booking-system.md](file:///d:/Coding/Playground/hotel-booking/.specify/memory/hotel-booking-system.md)

## Summary
Build a comprehensive Hotel Booking System utilizing **TanStack Start** for the framework, **Bun** for the runtime, and **Drizzle ORM** with **PostgreSQL** for data persistence. The application will feature guest browsing, user authenticated bookings, and an admin dashboard for inventory and booking management, styled with **Tailwind CSS** and **shadcn/ui**.

## Technical Context

**Language/Version**: TypeScript (Latest)
**Runtime**: Bun
**Web Framework**: TanStack Start (Vite-based)
**Primary Dependencies**: 
- TanStack Query (Built-in to Start)
- TanStack Router (Built-in to Start)
- Auth.js (@auth/core and @auth/drizzle-adapter)
- Drizzle ORM
- Tailwind CSS
- shadcn/ui (Radix UI primitives)
- Lucide React (Icons)
- Zod (Schema validation)
**Storage**: PostgreSQL (via Drizzle)
**Testing**: Bun Test (Unit/Integration)
**Target Platform**: Web (Responsive)
**Performance Goals**: 
- Sub-200ms interaction latency (as per Constitution)
- Optimized bundle size via Vite
- Sub-500ms server-side rendering for initial load
**Constraints**: 
- Must follow Spec-Driven Development (SDD)
- 80%+ test coverage for core logic (as per Constitution)
- Fully accessible UI

## Constitution Check

- **I. Code Quality**: TypeScript and Drizzle provide strong type safety. Biome/ESLint will be enforced.
- **II. Testing**: Using `bun test` for TDD. Coverage reporting via Bun.
- **III. UX Consistency**: shadcn/ui and Tailwind ensure a unified, accessible design system.
- **IV. Performance**: Bun runtime + TanStack Start's efficient routing/data fetching.
- **V. SDD**: This plan is a direct result of the `hotel-booking-system.md` spec.

## Project Structure

```text
├── .specify/
│   ├── memory/
│   │   ├── constitution.md
│   │   └── hotel-booking-system.md
│   └── templates/
├── app/                  # TanStack Start / Router root
│   ├── components/       # Shared UI components (shadcn)
│   ├── routes/           # File-based routing
│   │   ├── __root.tsx
│   │   ├── index.tsx     # Guest view
│   │   ├── login.tsx
│   │   ├── dashboard.tsx # User dashboard
│   │   └── admin/        # Admin routes
│   └── utils/
├── db/                   # Drizzle schema and migrations
│   ├── schema.ts
│   └── index.ts
├── public/
├── tests/                # Bun test suites
├── .env.example
├── app.config.ts         # TanStack Start config
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

**Structure Decision**: Using the standard TanStack Start directory layout for a unified full-stack experience within a single repository, leveraging file-based routing and seamless server-side capabilities.

## Data Model (Initial Draft)

- **Users**: `id`, `name`, `email`, `email_verified`, `image`, `role` (user/admin)
- **Accounts**: `userId`, `type`, `provider`, `providerAccountId`, `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`
- **Sessions**: `sessionToken`, `userId`, `expires`
- **VerificationTokens**: `identifier`, `token`, `expires`
- **Rooms**: `id`, `name`, `description`, `price_per_night`, `capacity`
- **Meals**: `id`, `name`, `description`, `price`
- **Activities**: `id`, `name`, `description`, `price`, `startTime`, `endTime`
- **Bookings**: `id`, `user_id`, `check_in`, `check_out`, `status`, `total_price`
- **BookingItems**: `id`, `booking_id`, `type` (room/meal/activity), `item_id`, `price`

## Key Architectural Decisions

### Unified Cart System
- **Single Source of Truth**: All user selections (Rooms, Meals, Activities) are normalized into a single `CartItem` type.
- **State Management**:
    - `cartItems`: Persistent state for confirmed selections in the itinerary.
    - `pendingSelections`: Temporary state for user input (quantity/date) before adding to cart.
- **Unified Actions**: `addToCart`, `updateQuantity`, and `updateDate` handles all resource types polymorphically to ensure consistent behavior.

### Inventory Management Strategy
To prevent overbooking and ensure real-time accuracy:
1.  **Server-Side Bottleneck Calculation**: `getAvailableResources` (in `availability.ts`) calculates the *minimum* remaining inventory across a requested date range. This identifies the "bottleneck day" that limits the max bookable quantity.
2.  **Client-Side Real-Time Tracking**:
    - `itemDayCart` (Memoized Map): Aggregates all items currently in the `cartItems` array by resource ID and specific date.
    - `getRealRemaining` (Utility): Dynamically calculates `Available = API_Reported_Remaining - Current_Cart_Quantity` for any given date range.
3.  **UI Feedback**: The interface uses `realRemaining` to disable "Add" buttons and show "X left" badges, ensuring users cannot select more than what is physically available for their specific dates.

## Phases

### Phase 1: Environment Setup
- Initialize Bun project.
- Scaffold TanStack Start with Vite.
- Configure Tailwind CSS and shadcn/ui.
- Setup Drizzle ORM with PostgreSQL connection.

### Phase 2: Core Data & Auth
- Define Drizzle schemas for Auth.js (Users, Accounts, Sessions, VerificationTokens) and Hotel entities (Room, Meal, Activity, Booking).
- Implement Auth.js with Google and LINE OAuth providers.
- Seed initial data for RoomTypes, MealOptions, and Activities.

### Phase 3: Guest & User Flow
- Build landing page (Guest mode).
- Implement Booking flow for logged-in users.
- Create User Dashboard ("My Bookings").
- Implement Cancellation logic.

### Phase 4: Admin Dashboard
- **Build Admin Dashboard interface**:
    - **Sidebar**: Overview, Bookings, Resources (Rooms/Meals/Activities), Settings.
    - **Bookings View**: Implement **Tabbed Layout** within the main content area (All / Rooms / Meals / Activities).
    - Create **Advanced Search Filter** component (Name/Email, Dates, Price, Status).
    - Implement **Booking Detail View** (Side sheet or Modal) showing full itinerary breakdown.
- Implement CRUD for Rooms, Meals, and Activities.
- Create Booking Status Panel with summary statistics.
- Implement Admin booking edit functionality.

### Phase 5: Polish & UX
- Add animations and transitions (Framer Motion or CSS).
- Ensure A11y compliance.
- Final performance audit and test coverage verification.
