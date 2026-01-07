import { differenceInDays, isSameDay } from 'date-fns'

/**
 * Calculates the number of nights between two dates.
 * Ensures at least 1 night is returned if the dates are valid.
 */
export function calculateNights(from: Date, to: Date): number {
    if (isSameDay(from, to)) return 1
    const diff = differenceInDays(to, from)
    return Math.max(1, diff)
}

export type PricingItem = {
    price: string | number;
    quantity: number;
    nights?: number; // Applied to rooms only
}

/**
 * Calculates the total price for a booking based on rooms, meals, and activities.
 */
export function calculateTotalPrice(items: PricingItem[]): string {
    const total = items.reduce((acc, item) => {
        const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price
        const multiplier = item.nights || 1
        return acc + (unitPrice * item.quantity * multiplier)
    }, 0)

    return total.toFixed(2)
}
