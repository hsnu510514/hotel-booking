import { describe, it, expect } from "bun:test"
import { calculateTotalPrice, calculateNights } from "./pricing"

describe("Pricing Utilities", () => {
    describe("calculateNights", () => {
        it("should calculate correct number of nights for a standard range", () => {
            const from = new Date("2024-01-01")
            const to = new Date("2024-01-04") // 3 nights
            expect(calculateNights(from, to)).toBe(3)
        })

        it("should return 1 night for same-day selection", () => {
            const from = new Date("2024-01-01")
            const to = new Date("2024-01-01")
            expect(calculateNights(from, to)).toBe(1)
        })

        it("should return 1 night for negative ranges", () => {
            const from = new Date("2024-01-04")
            const to = new Date("2024-01-01")
            expect(calculateNights(from, to)).toBe(1)
        })
    })

    describe("calculateTotalPrice", () => {
        it("should calculate total correctly with room, meals, and activities", () => {
            const roomPrice = 100
            const nights = 3
            const meals = [25, 35]
            const activities = [50]

            // (100 * 3) + 25 + 35 + 50 = 410
            const total = calculateTotalPrice(roomPrice, nights, meals, activities)
            expect(total).toBe("410.00")
        })

        it("should handle string prices correctly", () => {
            const roomPrice = "150.50"
            const nights = 2
            const meals = ["20.00", "15.75"]
            const activities: string[] = []

            // (150.50 * 2) + 20.00 + 15.75 = 301.00 + 35.75 = 336.75
            const total = calculateTotalPrice(roomPrice, nights, meals, activities)
            expect(total).toBe("336.75")
        })

        it("should work with only room price", () => {
            const total = calculateTotalPrice(200, 1, [], [])
            expect(total).toBe("200.00")
        })
    })
})
