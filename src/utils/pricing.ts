export interface PricingItem {
    id: string
    price: string | number
}

/**
 * Calculates the total cost of a booking.
 * 
 * @param roomPrice - Price of the room per night
 * @param nights - Number of nights for the stay
 * @param mealPrices - Array of prices for selected meal options
 * @param activityPrices - Array of prices for selected activities
 * @returns The total price as a string with 2 decimal places
 */
export function calculateTotalPrice(
    roomPrice: string | number,
    nights: number,
    mealPrices: (string | number)[],
    activityPrices: (string | number)[]
): string {
    const numNights = Math.max(1, nights)
    const baseRoomPrice = typeof roomPrice === 'string' ? parseFloat(roomPrice) : roomPrice

    let total = baseRoomPrice * numNights

    mealPrices.forEach(price => {
        total += typeof price === 'string' ? parseFloat(price) : price
    })

    activityPrices.forEach(price => {
        total += typeof price === 'string' ? parseFloat(price) : price
    })

    return total.toFixed(2)
}

/**
 * Calculates the number of nights between two dates.
 * Ensures at least 1 night is counted for same-day or invalid ranges.
 */
export function calculateNights(from: Date, to: Date): number {
    const fromTime = from.getTime()
    const toTime = to.getTime()
    const diff = toTime - fromTime
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
