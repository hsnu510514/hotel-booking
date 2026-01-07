import { createServerFn } from "@tanstack/react-start"
import { db } from "@/utils/db"
import { bookings, bookingItems, roomTypes, mealOptions, activities as activityTable } from "@/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import { getSession } from "@/utils/session"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"

const createBookingSchema = z.object({
    checkIn: z.date(),
    checkOut: z.date(),
    totalPrice: z.string(),
    items: z.array(z.object({
        type: z.enum(['room', 'meal', 'activity']),
        itemId: z.string(),
        quantity: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }))
})

export const createBooking = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(createBookingSchema))
    .handler(async ({ data }) => {
        const session = await getSession()
        if (!session?.user?.id) {
            throw new Error("You must be logged in to create a booking.")
        }

        // Import the validation function dynamically to avoid circular deps
        const { validateItemAvailability } = await import("@/utils/availability")

        // 1. Pre-validate all items for per-day availability
        for (const item of data.items) {
            const itemStart = item.startDate || data.checkIn
            const itemEnd = item.endDate || data.checkOut

            const validation = await validateItemAvailability({
                data: {
                    type: item.type,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    dateRange: { from: itemStart, to: itemEnd }
                }
            })

            if (!validation.valid) {
                throw new Error(validation.message || `Insufficient inventory for ${item.type}`)
            }
        }

        try {
            return await db.transaction(async (tx) => {
                // 2. Create the main booking record
                const [newBooking] = await tx.insert(bookings).values({
                    userId: session.user.id,
                    checkIn: data.checkIn,
                    checkOut: data.checkOut,
                    totalPrice: data.totalPrice,
                    status: "confirmed",
                }).returning()

                // 3. Add all items
                for (const item of data.items) {
                    let price = "0.00"

                    // Fetch current price for integrity
                    if (item.type === 'room') {
                        const [r] = await tx.select().from(roomTypes).where(eq(roomTypes.id, item.itemId)).limit(1)
                        price = r.pricePerNight
                    } else if (item.type === 'meal') {
                        const [m] = await tx.select().from(mealOptions).where(eq(mealOptions.id, item.itemId)).limit(1)
                        price = m.price
                    } else {
                        const [a] = await tx.select().from(activityTable).where(eq(activityTable.id, item.itemId)).limit(1)
                        price = a.price
                    }

                    await tx.insert(bookingItems).values({
                        bookingId: newBooking.id,
                        type: item.type,
                        itemId: item.itemId,
                        price: price,
                        quantity: item.quantity,
                        startDate: item.startDate || data.checkIn,
                        endDate: item.endDate || data.checkOut,
                    })
                }

                return { success: true, bookingId: newBooking.id }
            })
        } catch (error: any) {
            console.error("Booking creation failed:", error)
            throw new Error(error.message || "Could not complete booking. Please try again later.")
        }
    })


export const getUserBookings = createServerFn({ method: "GET" })
    .handler(async () => {
        const session = await getSession()
        if (!session?.user?.id) {
            return []
        }

        try {
            const userBookings = await db.select({
                id: bookings.id,
                checkIn: bookings.checkIn,
                checkOut: bookings.checkOut,
                status: bookings.status,
                totalPrice: bookings.totalPrice,
                createdAt: bookings.createdAt,
            })
                .from(bookings)
                .where(eq(bookings.userId, session.user.id))
                .orderBy(desc(bookings.createdAt))

            return userBookings
        } catch (error) {
            console.error("Failed to fetch user bookings:", error)
            return []
        }
    })

const cancelBookingSchema = z.object({
    bookingId: z.string(),
})

export const cancelBooking = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(cancelBookingSchema))
    .handler(async ({ data }) => {
        const session = await getSession()
        if (!session?.user?.id) {
            throw new Error("You must be logged in to cancel a booking.")
        }

        try {
            const [booking] = await db.select()
                .from(bookings)
                .where(eq(bookings.id, data.bookingId))
                .limit(1)

            if (!booking) {
                throw new Error("Booking not found.")
            }

            if (booking.userId !== session.user.id) {
                throw new Error("You do not have permission to cancel this booking.")
            }

            await db.update(bookings)
                .set({ status: 'cancelled' })
                .where(eq(bookings.id, data.bookingId))

            return { success: true }
        } catch (error: any) {
            console.error("Booking cancellation failed:", error)
            throw new Error(error.message || "Could not cancel booking. Please try again later.")
        }
    })

export const getBookingDetails = createServerFn({ method: "GET" })
    .inputValidator(zodValidator(z.object({ bookingId: z.string() })))
    .handler(async ({ data }) => {
        const session = await getSession()
        if (!session?.user?.id) {
            throw new Error("Unauthorized")
        }

        try {
            const items = await db.select()
                .from(bookingItems)
                .where(eq(bookingItems.bookingId, data.bookingId))

            const detailedItems = await Promise.all(items.map(async (item) => {
                let name = "Unknown Item"
                let description = ""

                if (item.type === 'room') {
                    const [r] = await db.select().from(roomTypes).where(eq(roomTypes.id, item.itemId)).limit(1)
                    name = r?.name || name
                    description = r?.description || ""
                } else if (item.type === 'meal') {
                    const [m] = await db.select().from(mealOptions).where(eq(mealOptions.id, item.itemId)).limit(1)
                    name = m?.name || name
                    description = m?.description || ""
                } else if (item.type === 'activity') {
                    const [a] = await db.select().from(activityTable).where(eq(activityTable.id, item.itemId)).limit(1)
                    name = a?.name || name
                    description = a?.description || ""
                    return {
                        ...item,
                        name,
                        description,
                        startTime: a?.startTime,
                        endTime: a?.endTime
                    }
                }

                return {
                    ...item,
                    name,
                    description
                }
            }))

            return detailedItems
        } catch (error) {
            console.error("Failed to fetch booking details:", error)
            return []
        }
    })
