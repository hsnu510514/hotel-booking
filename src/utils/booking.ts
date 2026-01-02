import { createServerFn } from "@tanstack/react-start"
import { db } from "@/utils/db"
import { bookings, bookingItems, roomTypes, mealOptions, activities as activityTable } from "@/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import { getSession } from "@/utils/session"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"

const createBookingSchema = z.object({
    roomId: z.string(),
    checkIn: z.date(),
    checkOut: z.date(),
    mealIds: z.array(z.string()),
    activityIds: z.array(z.string()),
    totalPrice: z.string(),
})

export const createBooking = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(createBookingSchema))
    .handler(async ({ data }) => {
        const session = await getSession()
        if (!session?.user?.id) {
            throw new Error("You must be logged in to create a booking.")
        }

        try {
            return await db.transaction(async (tx) => {
                // 1. Create the main booking record
                const [newBooking] = await tx.insert(bookings).values({
                    userId: session.user.id,
                    checkIn: data.checkIn,
                    checkOut: data.checkOut,
                    totalPrice: data.totalPrice,
                    status: "confirmed",
                }).returning()

                // 2. Fetch current prices for items to ensure data integrity
                const [room] = await tx.select().from(roomTypes).where(eq(roomTypes.id, data.roomId)).limit(1)

                // Add Room Item
                await tx.insert(bookingItems).values({
                    bookingId: newBooking.id,
                    type: "room",
                    itemId: data.roomId,
                    price: room.pricePerNight,
                })

                // 3. Add Meal Items
                if (data.mealIds.length > 0) {
                    const meals = await tx.select().from(mealOptions).where(inArray(mealOptions.id, data.mealIds))
                    for (const meal of meals) {
                        await tx.insert(bookingItems).values({
                            bookingId: newBooking.id,
                            type: "meal",
                            itemId: meal.id,
                            price: meal.price,
                        })
                    }
                }

                // 4. Add Activity Items
                if (data.activityIds.length > 0) {
                    const activities = await tx.select().from(activityTable).where(inArray(activityTable.id, data.activityIds))
                    for (const activity of activities) {
                        await tx.insert(bookingItems).values({
                            bookingId: newBooking.id,
                            type: "activity",
                            itemId: activity.id,
                            price: activity.price,
                        })
                    }
                }

                return { success: true, bookingId: newBooking.id }
            })
        } catch (error) {
            console.error("Booking creation failed:", error)
            throw new Error("Could not complete booking. Please try again later.")
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

            // For each booking, we might want to fetch items, but for the dashboard summary
            // this might be enough. Or we can join.
            // Simplified for now, we'll return the basic list.
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
