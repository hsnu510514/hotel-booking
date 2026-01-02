import {
    pgTable,
    text,
    timestamp,
    integer,
    primaryKey,
    boolean,
    decimal,
    uuid,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "@auth/core/adapters"

// --- Auth.js Tables ---

export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: text("role", { enum: ["user", "admin"] }).default("user"),
})

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => [
        {
            compoundKey: primaryKey({
                columns: [account.provider, account.providerAccountId],
            }),
        },
    ]
)

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => [
        {
            compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
        },
    ]
)

// --- Hotel Entities ---

export const roomTypes = pgTable("room_type", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
    capacity: integer("capacity").notNull(),
    imageUrl: text("image_url"),
})

export const mealOptions = pgTable("meal_option", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
})

export const activities = pgTable("activity", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    duration: text("duration"),
    imageUrl: text("image_url"),
})

export const bookings = pgTable("booking", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id),
    checkIn: timestamp("check_in", { mode: "date" }).notNull(),
    checkOut: timestamp("check_out", { mode: "date" }).notNull(),
    status: text("status", { enum: ["confirmed", "cancelled", "completed"] }).default("confirmed"),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
})

export const bookingItems = pgTable("booking_item", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
        .notNull()
        .references(() => bookings.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["room", "meal", "activity"] }).notNull(),
    itemId: uuid("item_id").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
})
