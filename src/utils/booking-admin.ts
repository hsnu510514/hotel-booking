import { db } from "@/utils/db"
import { bookings, bookingItems } from "@/db/schema"
import { createServerFn } from "@tanstack/react-start"
import { getSession } from "@/utils/session"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"

/**
 * 1. Clear all data from bookings and booking_item tables.
 * This is a dangerous operation and requires admin privileges.
 */
export const clearAllBookingData = createServerFn({ method: "POST" })
    .handler(async () => {
        const session = await getSession()

        // Ensure only admins can perform this destructive action
        if (!session || (session.user as any)?.role !== 'admin') {
            throw new Error("Unauthorized: Only administrators can clear booking data.")
        }

        try {
            return await db.transaction(async (tx) => {
                // Delete booking items first due to foreign key constraints (though cascade is set)
                await tx.delete(bookingItems)
                // Delete all bookings
                await tx.delete(bookings)

                return { success: true, message: "All booking data has been cleared." }
            })
        } catch (error: any) {
            console.error("Failed to clear booking data:", error)
            throw new Error(error.message || "Failed to clear booking data.")
        }
    })

/**
 * 2. Create raw booking data.
 * Useful for migrations, mock data generation, or specialized imports.
 */
const writeBookingSchema = z.object({
    userId: z.string(),
    checkIn: z.date(),
    checkOut: z.date(),
    status: z.enum(["confirmed", "cancelled", "completed"]).default("confirmed"),
    totalPrice: z.string(),
    items: z.array(z.object({
        type: z.enum(['room', 'meal', 'activity']),
        itemId: z.string(),
        price: z.string(),
        quantity: z.number().default(1),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }))
})

export const writeRawBookingData = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(z.array(writeBookingSchema)))
    .handler(async ({ data }) => {
        const session = await getSession()

        // Ensure admin privileges for bulk write operations
        if (!session || (session.user as any)?.role !== 'admin') {
            throw new Error("Unauthorized: Only administrators can batch write booking data.")
        }

        try {
            return await db.transaction(async (tx) => {
                const results = []

                for (const bookingData of data) {
                    // 1. Insert the booking
                    const [newBooking] = await tx.insert(bookings).values({
                        userId: bookingData.userId,
                        checkIn: bookingData.checkIn,
                        checkOut: bookingData.checkOut,
                        status: bookingData.status,
                        totalPrice: bookingData.totalPrice,
                    }).returning()

                    // 2. Insert associated items
                    if (bookingData.items.length > 0) {
                        await tx.insert(bookingItems).values(
                            bookingData.items.map(item => ({
                                bookingId: newBooking.id,
                                type: item.type,
                                itemId: item.itemId,
                                price: item.price,
                                quantity: item.quantity,
                                startDate: item.startDate || bookingData.checkIn,
                                endDate: item.endDate || bookingData.checkOut,
                            }))
                        )
                    }

                    results.push(newBooking.id)
                }

                return { success: true, count: results.length, ids: results }
            })
        } catch (error: any) {
            console.error("Failed to write booking data:", error)
            throw new Error(error.message || "Failed to write booking data.")
        }
    })
