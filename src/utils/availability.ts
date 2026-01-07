import { createServerFn } from "@tanstack/react-start"
import { db } from "@/utils/db"
import { roomTypes, mealOptions, activities, bookings, bookingItems } from "@/db/schema"
import { eq, and, sql, lte, gte } from "drizzle-orm"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"
import { eachDayOfInterval, startOfDay } from "date-fns"

const availabilitySchema = z.object({
    type: z.enum(['room', 'meal', 'activity']),
    dateRange: z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
    }),
})


/**
 * Calculates the remaining inventory for each item on a per-day basis.
 * Returns the MINIMUM remaining count across all days in the requested range.
 * This represents the "bottleneck" - the maximum quantity a user can book.
 */
export const getAvailableResources = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(availabilitySchema))
    .handler(async ({ data }) => {
        const { type, dateRange } = data

        try {
            // Generate all days in the requested interval
            const days = eachDayOfInterval({
                start: startOfDay(dateRange.from),
                end: startOfDay(dateRange.to)
            })

            // For each day, we need to count how many units are booked
            // A booking item covers a day if: startDate <= day AND endDate >= day
            // We'll query all booking items that overlap with ANY day in the range,
            // then process them in memory to find per-day counts.

            let overlappingItems: any[] = await db
                .select({
                    itemId: bookingItems.itemId,
                    quantity: bookingItems.quantity,
                    startDate: bookingItems.startDate,
                    endDate: bookingItems.endDate,
                    bookingCheckIn: bookings.checkIn,
                    bookingCheckOut: bookings.checkOut,
                })
                .from(bookingItems)
                .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
                .where(
                    and(
                        eq(bookings.status, 'confirmed'),
                        eq(bookingItems.type, type),
                        // Overlaps with our range at all
                        lte(sql<Date>`COALESCE(${bookingItems.startDate}, ${bookings.checkIn})`, dateRange.to.toISOString()),
                        gte(sql<Date>`COALESCE(${bookingItems.endDate}, ${bookings.checkOut})`, dateRange.from.toISOString())
                    )
                )

            // Build a map: itemId -> { day -> bookedCount }
            const itemDayBookings = new Map<string, Map<string, number>>()

            for (const item of overlappingItems) {
                const itemStart = startOfDay(item.startDate || item.bookingCheckIn!)
                const itemEnd = startOfDay(item.endDate || item.bookingCheckOut!)

                // For each day in our requested range, check if this item's booking covers it
                for (const day of days) {
                    const dayTime = day.getTime()
                    if (dayTime >= itemStart.getTime() && dayTime <= itemEnd.getTime()) {
                        // This booking covers this day
                        const dayKey = day.toISOString()
                        if (!itemDayBookings.has(item.itemId)) {
                            itemDayBookings.set(item.itemId, new Map())
                        }
                        const dayMap = itemDayBookings.get(item.itemId)!
                        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (item.quantity || 1))
                    }
                }
            }

            // Helper to find minimum remaining across all days for an item
            const getMinRemaining = (itemId: string, totalInventory: number): number => {
                const dayMap = itemDayBookings.get(itemId)
                if (!dayMap || dayMap.size === 0) {
                    return totalInventory // No bookings, full availability
                }

                let minRemaining = totalInventory
                for (const day of days) {
                    const bookedOnDay = dayMap.get(day.toISOString()) || 0
                    const remaining = totalInventory - bookedOnDay
                    minRemaining = Math.min(minRemaining, remaining)
                }
                return Math.max(0, minRemaining)
            }

            if (type === 'room') {
                const rooms = await db.select().from(roomTypes)
                return rooms.map(room => ({
                    ...room,
                    remainingCount: getMinRemaining(room.id, room.totalInventory)
                }))
            } else if (type === 'meal') {
                const meals = await db.select().from(mealOptions)
                return meals.map(meal => ({
                    ...meal,
                    remainingCount: getMinRemaining(meal.id, meal.totalInventory)
                }))
            } else {
                const acts = await db.select().from(activities)
                return acts.map(act => ({
                    ...act,
                    remainingCount: getMinRemaining(act.id, act.totalInventory)
                }))
            }
        } catch (error) {
            console.error("getAvailableResources failed:", error)
            // Return empty arrays on failure 
            return []
        }
    })


/**
 * Validates that a specific quantity can be booked for EVERY day in the given range.
 * Returns true if the booking is valid, false if any day would be overbooked.
 */
const validateAvailabilitySchema = z.object({
    type: z.enum(['room', 'meal', 'activity']),
    itemId: z.string(),
    quantity: z.number(),
    dateRange: z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
    }),
})


export const validateItemAvailability = createServerFn({ method: "POST" })
    .inputValidator(zodValidator(validateAvailabilitySchema))
    .handler(async ({ data }) => {
        const { type, itemId, quantity, dateRange } = data

        // Get the total inventory for this item
        let totalInventory = 0
        if (type === 'room') {
            const [room] = await db.select().from(roomTypes).where(eq(roomTypes.id, itemId)).limit(1)
            totalInventory = room?.totalInventory || 0
        } else if (type === 'meal') {
            const [meal] = await db.select().from(mealOptions).where(eq(mealOptions.id, itemId)).limit(1)
            totalInventory = meal?.totalInventory || 0
        } else {
            const [act] = await db.select().from(activities).where(eq(activities.id, itemId)).limit(1)
            totalInventory = act?.totalInventory || 0
        }

        // Generate all days
        const days = eachDayOfInterval({
            start: startOfDay(dateRange.from),
            end: startOfDay(dateRange.to)
        })

        // Query existing bookings for this specific item
        const existingBookings = await db
            .select({
                quantity: bookingItems.quantity,
                startDate: bookingItems.startDate,
                endDate: bookingItems.endDate,
                bookingCheckIn: bookings.checkIn,
                bookingCheckOut: bookings.checkOut,
            })
            .from(bookingItems)
            .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
            .where(
                and(
                    eq(bookings.status, 'confirmed'),
                    eq(bookingItems.type, type),
                    eq(bookingItems.itemId, itemId),
                    lte(sql<Date>`COALESCE(${bookingItems.startDate}, ${bookings.checkIn})`, dateRange.to.toISOString()),
                    gte(sql<Date>`COALESCE(${bookingItems.endDate}, ${bookings.checkOut})`, dateRange.from.toISOString())
                )
            )

        // Check each day
        for (const day of days) {
            const dayTime = day.getTime()
            let bookedOnDay = 0

            for (const booking of existingBookings) {
                const bookingStart = startOfDay(booking.startDate || booking.bookingCheckIn!).getTime()
                const bookingEnd = startOfDay(booking.endDate || booking.bookingCheckOut!).getTime()

                if (dayTime >= bookingStart && dayTime <= bookingEnd) {
                    bookedOnDay += booking.quantity
                }
            }

            const remaining = totalInventory - bookedOnDay
            if (quantity > remaining) {
                return {
                    valid: false,
                    message: `Only ${remaining} units available on ${day.toLocaleDateString()}`,
                    bottleneckDay: day.toISOString()
                }
            }
        }

        return { valid: true }
    })
