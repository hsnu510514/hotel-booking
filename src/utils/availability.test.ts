import { describe, it, expect, beforeEach, mock } from 'bun:test'

/**
 * Unit tests for the per-day availability calculation logic.
 * These test the algorithm conceptually without needing a live database.
 */
describe('Daily Inventory Calculation Logic', () => {

    // Helper function that mirrors the availability calculation logic
    function calculateMinRemaining(
        totalInventory: number,
        days: Date[],
        existingBookings: { quantity: number; startDate: Date; endDate: Date }[]
    ): number {
        let minRemaining = totalInventory

        for (const day of days) {
            const dayTime = day.getTime()
            let bookedOnDay = 0

            for (const booking of existingBookings) {
                if (dayTime >= booking.startDate.getTime() && dayTime <= booking.endDate.getTime()) {
                    bookedOnDay += booking.quantity
                }
            }

            const remaining = totalInventory - bookedOnDay
            minRemaining = Math.min(minRemaining, remaining)
        }

        return Math.max(0, minRemaining)
    }

    // Helper to generate days in a range
    function getDays(from: Date, to: Date): Date[] {
        const days: Date[] = []
        const current = new Date(from)
        while (current <= to) {
            days.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }
        return days
    }

    describe('calculateMinRemaining', () => {
        it('should return full inventory when no bookings exist', () => {
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-03'))
            const result = calculateMinRemaining(5, days, [])
            expect(result).toBe(5)
        })

        it('should correctly calculate remaining for a single booking', () => {
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-03'))
            const bookings = [{
                quantity: 2,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-03')
            }]
            const result = calculateMinRemaining(5, days, bookings)
            expect(result).toBe(3) // 5 - 2 = 3 on all days
        })

        it('should find the bottleneck day with partial overlap', () => {
            // Scenario:
            // - Total inventory: 5
            // - Existing booking: 2 units for Jan 2-3
            // - Checking availability for Jan 1-4
            // Jan 1: 5 remaining, Jan 2: 3 remaining, Jan 3: 3 remaining, Jan 4: 5 remaining
            // Bottleneck = 3
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-04'))
            const bookings = [{
                quantity: 2,
                startDate: new Date('2026-01-02'),
                endDate: new Date('2026-01-03')
            }]
            const result = calculateMinRemaining(5, days, bookings)
            expect(result).toBe(3)
        })

        it('should handle multiple overlapping bookings', () => {
            // Scenario:
            // - Total inventory: 5
            // - Booking A: 2 units for Jan 1-3
            // - Booking B: 1 unit for Jan 2-4
            // - Checking Jan 1-4
            // Jan 1: 5-2=3, Jan 2: 5-2-1=2, Jan 3: 5-2-1=2, Jan 4: 5-1=4
            // Bottleneck = 2
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-04'))
            const bookings = [
                { quantity: 2, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-03') },
                { quantity: 1, startDate: new Date('2026-01-02'), endDate: new Date('2026-01-04') }
            ]
            const result = calculateMinRemaining(5, days, bookings)
            expect(result).toBe(2)
        })

        it('should return 0 when fully booked on any day', () => {
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-03'))
            const bookings = [{
                quantity: 5,
                startDate: new Date('2026-01-02'),
                endDate: new Date('2026-01-02')
            }]
            const result = calculateMinRemaining(5, days, bookings)
            expect(result).toBe(0)
        })

        it('should not go below 0', () => {
            // Edge case: more booked than inventory (shouldn't happen, but handle gracefully)
            const days = getDays(new Date('2026-01-01'), new Date('2026-01-01'))
            const bookings = [{
                quantity: 10,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-01')
            }]
            const result = calculateMinRemaining(5, days, bookings)
            expect(result).toBe(0)
        })
    })
})
