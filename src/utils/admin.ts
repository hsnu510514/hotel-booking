import { createServerFn } from "@tanstack/react-start"
import { db } from "@/utils/db"
import { roomTypes, mealOptions, activities, users, bookings } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { getSession } from "@/utils/session"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"

// --- Auth Helper ---
async function ensureAdmin() {
    const session = await getSession()
    if (!session || (session.user as any).role !== 'admin') {
        throw new Error("Unauthorized: Admin access required.")
    }
}

// ... (rooms, meals, activities functions remain same)

// --- Bookings Oversight ---

export const getAllBookings = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureAdmin()

        return await db.select({
            id: bookings.id,
            guestName: users.name,
            guestEmail: users.email,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            totalPrice: bookings.totalPrice,
            status: bookings.status,
            createdAt: bookings.createdAt,
        })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .orderBy(desc(bookings.createdAt))
    })

const updateStatusSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['confirmed', 'cancelled', 'completed'])
})

export const updateBookingStatus = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(updateStatusSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()
        return await db.update(bookings)
            .set({ status: data.status })
            .where(eq(bookings.id, data.id))
            .returning()
    })

export const getAdminStats = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureAdmin()

        const [totalRevenue] = await db.select({
            sum: sql<number>`sum(CAST(${bookings.totalPrice} AS NUMERIC))`
        }).from(bookings).where(eq(bookings.status, 'confirmed'))

        const [activeBookings] = await db.select({
            count: sql<number>`count(*)`
        }).from(bookings).where(eq(bookings.status, 'confirmed'))

        const [guestCount] = await db.select({
            count: sql<number>`count(*)`
        }).from(users)

        return {
            totalRevenue: totalRevenue.sum || 0,
            activeBookings: activeBookings.count || 0,
            guestCount: guestCount.count || 0,
            occupancyRate: "82%" // Dynamic calculation would require availability logic, mocking for now
        }
    })

// --- Rooms ---
const roomSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().nullable(),
    pricePerNight: z.string(),
    capacity: z.number(),
    imageUrl: z.string().nullable(),
})

export const upsertRoom = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(roomSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()

        if (data.id) {
            return await db.update(roomTypes)
                .set(data)
                .where(eq(roomTypes.id, data.id))
                .returning()
        }
        return await db.insert(roomTypes).values(data as any).returning()
    })

export const deleteRoom = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(z.object({ id: z.string().uuid() })))
    .handler(async ({ data }) => {
        await ensureAdmin()
        return await db.delete(roomTypes).where(eq(roomTypes.id, data.id))
    })

// --- Meals ---
const mealSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().nullable(),
    price: z.string(),
    imageUrl: z.string().nullable(),
})

export const upsertMeal = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(mealSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()

        if (data.id) {
            return await db.update(mealOptions)
                .set(data)
                .where(eq(mealOptions.id, data.id))
                .returning()
        }
        return await db.insert(mealOptions).values(data as any).returning()
    })

export const deleteMeal = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(z.object({ id: z.string().uuid() })))
    .handler(async ({ data }) => {
        await ensureAdmin()
        return await db.delete(mealOptions).where(eq(mealOptions.id, data.id))
    })

// --- Activities ---
const activitySchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().nullable(),
    price: z.string(),
    duration: z.string().nullable(),
    imageUrl: z.string().nullable(),
})

export const elevateToAdmin = createServerFn({ method: "POST" }).handler(async () => {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Not logged in");

    // In a real app, this would be highly protected. 
    // Here we allow it for development purposes.
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, session.user.id))
    return { success: true }
})

export const upsertActivity = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(activitySchema))
    .handler(async ({ data }) => {
        await ensureAdmin()

        if (data.id) {
            return await db.update(activities)
                .set(data)
                .where(eq(activities.id, data.id))
                .returning()
        }
        return await db.insert(activities).values(data as any).returning()
    })

export const deleteActivity = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(z.object({ id: z.string().uuid() })))
    .handler(async ({ data }) => {
        await ensureAdmin()
        return await db.delete(activities).where(eq(activities.id, data.id))
    })
