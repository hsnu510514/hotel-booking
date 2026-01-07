import { describe, it, expect } from 'bun:test'
import { calculateNights, calculateTotalPrice } from './pricing'

describe('Pricing Utilities', () => {
    describe('calculateNights', () => {
        it('should calculate 1 night for same day', () => {
            const date = new Date('2024-01-01')
            expect(calculateNights(date, date)).toBe(1)
        })

        it('should calculate correct number of nights', () => {
            const from = new Date('2024-01-01')
            const to = new Date('2024-01-03')
            expect(calculateNights(from, to)).toBe(2)
        })
    })

    describe('calculateTotalPrice', () => {
        it('should calculate total for multiple items with quantities', () => {
            const items = [
                { price: 100, quantity: 1, nights: 2 }, // Room
                { price: '50', quantity: 2 },           // Meals
                { price: 30, quantity: 3 }              // Activities
            ]
            // (100 * 1 * 2) + (50 * 2 * 1) + (30 * 3 * 1) = 200 + 100 + 90 = 390
            expect(calculateTotalPrice(items)).toBe('390.00')
        })

        it('should handle zero quantities', () => {
            const items = [{ price: 100, quantity: 0 }]
            expect(calculateTotalPrice(items)).toBe('0.00')
        })

        it('should handle string prices correctly', () => {
            const items = [{ price: '120.50', quantity: 1 }]
            expect(calculateTotalPrice(items)).toBe('120.50')
        })
    })
})
