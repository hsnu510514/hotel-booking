import { createServerFn } from "@tanstack/react-start"
import { db } from "@/utils/db"
// Schema imports
import { roomTypes, mealOptions, activities, users, bookings, bookingItems } from "@/db/schema"
import { eq, desc, sql, and, gte, gt, lte, like, ilike, inArray, or, exists } from "drizzle-orm"
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

// --- Bookings Oversight ---

const bookingFilterSchema = z.object({
    search: z.string().optional(),
    dateRange: z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional()
    }).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    status: z.array(z.enum(['confirmed', 'cancelled', 'completed'])).optional(),
    type: z.enum(['all', 'room', 'meal', 'activity']).optional()
})

export const getAllBookings = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(bookingFilterSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()

        const conditions = []

        // Text Search
        if (data.search) {
            conditions.push(or(
                ilike(users.name, `%${data.search}%`),
                ilike(users.email, `%${data.search}%`)
            ))
        }

        // Date Range (Overlap logic or simple check-in range?)
        // Let's use Check-In range for simplicity in admin view
        if (data.dateRange?.from) {
            conditions.push(gte(bookings.checkIn, data.dateRange.from))
        }
        if (data.dateRange?.to) {
            conditions.push(lte(bookings.checkOut, data.dateRange.to))
        }

        // Price
        if (data.minPrice !== undefined) {
            conditions.push(gte(bookings.totalPrice, data.minPrice.toString()))
        }
        if (data.maxPrice !== undefined) {
            conditions.push(lte(bookings.totalPrice, data.maxPrice.toString()))
        }

        // Status
        if (data.status && data.status.length > 0) {
            conditions.push(inArray(bookings.status, data.status))
        }

        // Type Filter (Bookings containing at least one item of type X)
        if (data.type && data.type !== 'all') {
            conditions.push(exists(
                db.select()
                    .from(bookingItems)
                    .where(and(
                        eq(bookingItems.bookingId, bookings.id),
                        eq(bookingItems.type, data.type)
                    ))
            ))
        }

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
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(bookings.createdAt))
    })

// Get booking items by type (for Rooms/Meals/Activities tabs)
const bookingItemFilterSchema = z.object({
    type: z.enum(['room', 'meal', 'activity']),
    search: z.string().optional(),
    dateRange: z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional()
    }).optional(),
})

export const getBookingItems = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(bookingItemFilterSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()

        const conditions = [eq(bookingItems.type, data.type)]

        if (data.search) {
            conditions.push(or(
                ilike(users.name, `%${data.search}%`),
                ilike(users.email, `%${data.search}%`)
            )!)
        }

        if (data.dateRange?.from) {
            conditions.push(gte(bookingItems.startDate, data.dateRange.from))
        }
        if (data.dateRange?.to) {
            conditions.push(lte(bookingItems.endDate, data.dateRange.to))
        }

        // Join bookingItems with bookings and users to get guest info
        const results = await db.select({
            id: bookingItems.id,
            bookingId: bookingItems.bookingId,
            type: bookingItems.type,
            itemId: bookingItems.itemId,
            price: bookingItems.price,
            quantity: bookingItems.quantity,
            startDate: bookingItems.startDate,
            endDate: bookingItems.endDate,
            guestName: users.name,
            guestEmail: users.email,
            bookingStatus: bookings.status,
        })
            .from(bookingItems)
            .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
            .leftJoin(users, eq(bookings.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(bookingItems.startDate))

        // Enrich with item names
        const enriched = await Promise.all(results.map(async (item) => {
            let itemName = 'Unknown'
            if (item.type === 'room') {
                const [room] = await db.select({ name: roomTypes.name }).from(roomTypes).where(eq(roomTypes.id, item.itemId))
                itemName = room?.name || 'Unknown Room'
            } else if (item.type === 'meal') {
                const [meal] = await db.select({ name: mealOptions.name }).from(mealOptions).where(eq(mealOptions.id, item.itemId))
                itemName = meal?.name || 'Unknown Meal'
            } else if (item.type === 'activity') {
                const [act] = await db.select({ name: activities.name }).from(activities).where(eq(activities.id, item.itemId))
                itemName = act?.name || 'Unknown Activity'
            }
            return { ...item, itemName }
        }))

        return enriched
    })


export const getBookingDetails = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(z.object({ id: z.string() })))
    .handler(async ({ data }) => {
        await ensureAdmin()

        const [b] = await db.select({
            id: bookings.id,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            totalPrice: bookings.totalPrice,
            status: bookings.status,
            createdAt: bookings.createdAt,
            guestName: users.name,
            guestEmail: users.email,
        })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .where(eq(bookings.id, data.id))

        if (!b) return null

        // Fetch items with expanded details
        // We need names and images. We can do separate queries for each type or unions.
        // Let's do a simple approach: fetch all items, then fetch details.
        // Actually, let's use a smarter join? 
        // Or just 3 parallel queries for details?

        const items = await db.select().from(bookingItems).where(eq(bookingItems.bookingId, b.id))

        const detailedItems = await Promise.all(items.map(async (item) => {
            let details: any = {}
            if (item.type === 'room') {
                [details] = await db.select().from(roomTypes).where(eq(roomTypes.id, item.itemId))
            } else if (item.type === 'meal') {
                [details] = await db.select().from(mealOptions).where(eq(mealOptions.id, item.itemId))
            } else if (item.type === 'activity') {
                [details] = await db.select().from(activities).where(eq(activities.id, item.itemId))
            }
            return {
                ...item,
                name: details?.name || 'Unknown Item',
                imageUrl: details?.imageUrl,
                details
            }
        }))

        return { ...b, items: detailedItems }
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
    totalInventory: z.number(),
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
    totalInventory: z.number(),
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
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    totalInventory: z.number(),
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

// --- Inventory Dashboard ---

const inventoryStatusSchema = z.object({
    date: z.coerce.date(),
    type: z.enum(['room', 'meal', 'activity'])
})

export const getDailyInventoryStatus = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(inventoryStatusSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()
        const { date, type } = data

        // 1. Get all resources of the requested type
        let resources: any[] = []
        if (type === 'room') {
            resources = await db.select().from(roomTypes)
        } else if (type === 'meal') {
            resources = await db.select().from(mealOptions)
        } else if (type === 'activity') {
            resources = await db.select().from(activities)
        }

        // 2. Get all booking items active on this date
        // Logic:
        // Rooms: occupied if startDate <= date < endDate
        // Meals/Activities: occupied if startDate <= date <= endDate (usually start==end)

        let dateCondition
        if (type === 'room') {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gt(bookingItems.endDate, date) // strictly greater than check-date
            )
        } else {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gte(bookingItems.endDate, date)
            )
        }

        const activeItems = await db.select({
            itemId: bookingItems.itemId,
            quantity: bookingItems.quantity,
            status: bookings.status
        })
            .from(bookingItems)
            .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
            .where(and(
                eq(bookingItems.type, type),
                dateCondition,
                eq(bookings.status, 'confirmed') // Only count confirmed bookings
            ))

        // 3. Aggregate counts
        const bookedCounts = new Map<string, number>()
        for (const item of activeItems) {
            const current = bookedCounts.get(item.itemId) || 0
            bookedCounts.set(item.itemId, current + item.quantity)
        }

        // 4. Map to result
        return resources.map(res => {
            const booked = bookedCounts.get(res.id) || 0
            return {
                id: res.id,
                name: res.name,
                totalInventory: res.totalInventory,
                bookedCount: booked,
                remainingCount: res.totalInventory - booked
            }
        })
    })

const resourceBookingsSchema = z.object({
    date: z.coerce.date(),
    resourceId: z.string().uuid(),
    type: z.enum(['room', 'meal', 'activity'])
})

export const getBookingsForResource = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(resourceBookingsSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()
        const { date, resourceId, type } = data

        let dateCondition
        if (type === 'room') {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gt(bookingItems.endDate, date)
            )
        } else {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gte(bookingItems.endDate, date)
            )
        }

        return await db.select({
            id: bookings.id,
            guestName: users.name,
            guestEmail: users.email,
            status: bookings.status,
            quantity: bookingItems.quantity,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
        })
            .from(bookings)
            .innerJoin(bookingItems, eq(bookings.id, bookingItems.bookingId))
            .leftJoin(users, eq(bookings.userId, users.id))
            .where(and(
                eq(bookingItems.type, type),
                eq(bookingItems.itemId, resourceId),
                dateCondition,
                eq(bookings.status, 'confirmed')
            ))
            .orderBy(users.name)
    })

export const getDailyManifest = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(inventoryStatusSchema))
    .handler(async ({ data }) => {
        await ensureAdmin()
        const { date, type } = data

        let dateCondition
        if (type === 'room') {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gt(bookingItems.endDate, date)
            )
        } else {
            dateCondition = and(
                lte(bookingItems.startDate, date),
                gte(bookingItems.endDate, date)
            )
        }

        const results = await db.select({
            id: bookings.id,
            resourceId: bookingItems.itemId,
            guestName: users.name,
            guestEmail: users.email,
            status: bookings.status,
            quantity: bookingItems.quantity,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
        })
            .from(bookings)
            .innerJoin(bookingItems, eq(bookings.id, bookingItems.bookingId))
            .leftJoin(users, eq(bookings.userId, users.id))
            .where(and(
                eq(bookingItems.type, type),
                dateCondition,
                eq(bookings.status, 'confirmed')
            ))
            .orderBy(bookingItems.itemId, users.name)

        // Fetch resource names to group by
        let resourceMap = new Map<string, string>();
        let resources: any[] = []
        if (type === 'room') {
            resources = await db.select({ id: roomTypes.id, name: roomTypes.name }).from(roomTypes)
        } else if (type === 'meal') {
            resources = await db.select({ id: mealOptions.id, name: mealOptions.name }).from(mealOptions)
        } else if (type === 'activity') {
            resources = await db.select({ id: activities.id, name: activities.name }).from(activities)
        }
        resources.forEach(r => resourceMap.set(r.id, r.name))

        return results.map(r => ({
            ...r,
            resourceName: resourceMap.get(r.resourceId) || 'Unknown Resource'
        }))
    })
