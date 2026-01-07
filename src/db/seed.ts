import { db } from './index'
import { roomTypes, mealOptions, activities } from './schema'

async function seed() {
    console.log('Seeding database...')

    // Rooms
    const rooms = await db.insert(roomTypes).values([
        {
            name: "Ocean View Deluxe",
            description: "A spacious suite featuring floor-to-ceiling windows with a panoramic view of the turquoise ocean.",
            pricePerNight: "450.00",
            capacity: 2,
            imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Royal Penthouse",
            description: "The ultimate luxury experience with a private pool, butler service, and 360-degree city views.",
            pricePerNight: "1200.00",
            capacity: 4,
            imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Garden Sanctuary",
            description: "Tucked away in our lush tropical gardens, this room offers peace, privacy, and natural beauty.",
            pricePerNight: "320.00",
            capacity: 2,
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000"
        }
    ]).returning()

    // Meals
    await db.insert(mealOptions).values([
        {
            name: "Sunrise Gourmet Breakfast",
            description: "Freshly baked artisanal pastries, seasonal fruits, and premium roasted coffee.",
            price: "45.00",
            imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Chef's Signature Dinner",
            description: "A 5-course tasting menu featuring locally sourced ingredients and wine pairings.",
            price: "150.00",
            imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000"
        }
    ])

    // Activities
    await db.insert(activities).values([
        {
            name: "Midnight Zen Spa",
            description: "Relaxing aromatherapy massage under the stars with soothing ocean sounds.",
            price: "120.00",
            startTime: "21:00",
            endTime: "22:30",
            imageUrl: "https://images.unsplash.com/photo-1544161515-4ae6ce6ca606?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Coral Reef Snorkeling",
            description: "Guided tour through our private reef to discover vibrant marine life.",
            price: "85.00",
            startTime: "09:00",
            endTime: "12:00",
            imageUrl: "https://images.unsplash.com/photo-1544551763-47a184119879?auto=format&fit=crop&q=80&w=1000"
        }
    ])


    console.log('Seeding complete!')
}

export async function seedRandomBookings() {
    console.log('Generating 5 refined random bookings...')
    const { bookings, bookingItems, users } = await import('./schema')
    const { addDays, setHours, setMinutes, setSeconds, setMilliseconds, eachDayOfInterval } = await import('date-fns')
    const { eq } = await import('drizzle-orm')

    // 1. Get the admin user
    const [adminUser] = await db.select().from(users).limit(1)
    if (!adminUser) {
        console.error('No user found to assign bookings to!')
        return
    }

    // 2. Get all available resources
    const allRooms = await db.select().from(roomTypes)
    const allMeals = await db.select().from(mealOptions)
    const allActivities = await db.select().from(activities)

    if (allRooms.length === 0) {
        console.error('No rooms found to book!')
        return
    }

    for (let i = 0; i < 5; i++) {
        // 1. Determine visitor count (1-6)
        const numVisitors = Math.floor(Math.random() * 6) + 1

        // 2. Determine duration (3 days) and start date
        const randomDaysOffset = Math.floor(Math.random() * 30)
        let checkIn = addDays(new Date(), randomDaysOffset)
        checkIn = setHours(setMinutes(setSeconds(setMilliseconds(checkIn, 0), 0), 0), 14)
        const checkOut = addDays(checkIn, 3)
        const bookingDays = eachDayOfInterval({ start: checkIn, end: addDays(checkIn, 2) }) // 3 days

        // 3. Select rooms based on capacity
        let currentCapacity = 0
        const selectedRooms: (typeof allRooms[0])[] = []
        while (currentCapacity < numVisitors) {
            const room = allRooms[Math.floor(Math.random() * allRooms.length)]
            selectedRooms.push(room)
            currentCapacity += room.capacity
        }

        await db.transaction(async (tx) => {
            const [newBooking] = await tx.insert(bookings).values({
                userId: adminUser.id,
                checkIn: checkIn,
                checkOut: checkOut,
                status: 'confirmed',
                totalPrice: "0.00",
            }).returning()

            let calculatedTotalPrice = 0

            // Add room items
            for (const room of selectedRooms) {
                const roomPrice = parseFloat(room.pricePerNight) * 3
                calculatedTotalPrice += roomPrice
                await tx.insert(bookingItems).values({
                    bookingId: newBooking.id,
                    type: 'room',
                    itemId: room.id,
                    price: room.pricePerNight,
                    quantity: 1,
                    startDate: checkIn,
                    endDate: checkOut,
                })
            }

            // 4. Multiple meals and activities during the booking period
            for (const day of bookingDays) {
                const mealChance = 0.5 + (Math.random() * 0.5)
                const mealQuantity = Math.max(1, Math.floor(numVisitors * mealChance))
                const meal = allMeals[Math.floor(Math.random() * allMeals.length)]

                if (meal) {
                    calculatedTotalPrice += parseFloat(meal.price) * mealQuantity
                    await tx.insert(bookingItems).values({
                        bookingId: newBooking.id,
                        type: 'meal',
                        itemId: meal.id,
                        price: meal.price,
                        quantity: mealQuantity,
                        startDate: day,
                        endDate: day,
                    })
                }

                const activityChance = Math.random() * 0.8
                if (activityChance > 0.1) {
                    const activityQuantity = Math.max(1, Math.floor(numVisitors * activityChance))
                    const activity = allActivities[Math.floor(Math.random() * allActivities.length)]

                    if (activity) {
                        calculatedTotalPrice += parseFloat(activity.price) * activityQuantity
                        await tx.insert(bookingItems).values({
                            bookingId: newBooking.id,
                            type: 'activity',
                            itemId: activity.id,
                            price: activity.price,
                            quantity: activityQuantity,
                            startDate: day,
                            endDate: day,
                        })
                    }
                }
            }

            await tx.update(bookings)
                .set({ totalPrice: calculatedTotalPrice.toFixed(2) })
                .where(eq(bookings.id, newBooking.id))
        })

        console.log(`Booking ${i + 1} refined: ${numVisitors} visitors, ${selectedRooms.length} rooms, ${checkIn.toDateString()} to ${checkOut.toDateString()}`)
    }

    console.log('Refined seeding complete!')
}

seed().catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
})
