import { db } from './index';
import { bookings, bookingItems, roomTypes, mealOptions, activities as activityTable, users } from './schema';
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, eachDayOfInterval } from 'date-fns';
import { eq } from 'drizzle-orm';

async function seedRandomBookings() {
    console.log('Generating 5 refined random bookings...');

    const [adminUser] = await db.select().from(users).limit(1);
    if (!adminUser) {
        console.error('No user found to assign bookings to!');
        return;
    }

    const allRooms = await db.select().from(roomTypes);
    const allMeals = await db.select().from(mealOptions);
    const allActivities = await db.select().from(activityTable);

    if (allRooms.length === 0) {
        console.error('No rooms found to book!');
        return;
    }

    for (let i = 0; i < 5; i++) {
        // 1. Determine visitor count (1-6)
        const numVisitors = Math.floor(Math.random() * 6) + 1;

        // 2. Determine duration (3 days) and start date
        const randomDaysOffset = Math.floor(Math.random() * 3);
        let checkIn = addDays(new Date(), randomDaysOffset);
        checkIn = setHours(setMinutes(setSeconds(setMilliseconds(checkIn, 0), 0), 0), 14);
        const checkOut = addDays(checkIn, 3);
        const bookingDays = eachDayOfInterval({ start: checkIn, end: addDays(checkIn, 2) }); // 3 days (e.g. Day 0, 1, 2)

        // 3. Select rooms based on capacity
        let currentCapacity = 0;
        const selectedRooms: (typeof allRooms[0])[] = [];
        while (currentCapacity < numVisitors) {
            const room = allRooms[Math.floor(Math.random() * allRooms.length)];
            selectedRooms.push(room);
            currentCapacity += room.capacity;
        }

        await db.transaction(async (tx) => {
            // Initial placeholder price, we'll update it after calculating everything
            const [newBooking] = await tx.insert(bookings).values({
                userId: adminUser.id,
                checkIn: checkIn,
                checkOut: checkOut,
                status: 'confirmed',
                totalPrice: "0.00",
            }).returning();

            let calculatedTotalPrice = 0;

            // Add room items (Each room is for the full 3 days)
            for (const room of selectedRooms) {
                const roomPrice = parseFloat(room.pricePerNight) * 3;
                calculatedTotalPrice += roomPrice;
                await tx.insert(bookingItems).values({
                    bookingId: newBooking.id,
                    type: 'room',
                    itemId: room.id,
                    price: room.pricePerNight,
                    quantity: 1,
                    startDate: checkIn,
                    endDate: checkOut,
                });
            }

            // 4. Multiple meals and activities during the booking period
            for (const day of bookingDays) {
                // Meals for this day (e.g., 50% to 100% of visitors eat)
                const mealChance = 0.5 + (Math.random() * 0.5);
                const mealQuantity = Math.max(1, Math.floor(numVisitors * mealChance));
                const meal = allMeals[Math.floor(Math.random() * allMeals.length)];

                if (meal) {
                    calculatedTotalPrice += parseFloat(meal.price) * mealQuantity;
                    await tx.insert(bookingItems).values({
                        bookingId: newBooking.id,
                        type: 'meal',
                        itemId: meal.id,
                        price: meal.price,
                        quantity: mealQuantity,
                        startDate: day,
                        endDate: day,
                    });
                }

                // Activities for this day (e.g., 0% to 80% of visitors participate)
                const activityChance = Math.random() * 0.8;
                if (activityChance > 0.1) {
                    const activityQuantity = Math.max(1, Math.floor(numVisitors * activityChance));
                    const activity = allActivities[Math.floor(Math.random() * allActivities.length)];

                    if (activity) {
                        calculatedTotalPrice += parseFloat(activity.price) * activityQuantity;
                        await tx.insert(bookingItems).values({
                            bookingId: newBooking.id,
                            type: 'activity',
                            itemId: activity.id,
                            price: activity.price,
                            quantity: activityQuantity,
                            startDate: day,
                            endDate: day,
                        });
                    }
                }
            }

            // Update the booking with the final calculated price
            await tx.update(bookings)
                .set({ totalPrice: calculatedTotalPrice.toFixed(2) })
                .where(eq(bookings.id, newBooking.id));
        });

        console.log(`Booking ${i + 1} refined: ${numVisitors} visitors, ${selectedRooms.length} rooms, ${checkIn.toDateString()} to ${checkOut.toDateString()}`);
    }

    console.log('Refined seeding complete!');
}

seedRandomBookings().then(() => process.exit(0)).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
