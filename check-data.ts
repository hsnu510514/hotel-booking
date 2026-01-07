import { db } from './src/db/index';
import { roomTypes, mealOptions, activities } from './src/db/schema';

async function check() {
    const rooms = await db.select().from(roomTypes);
    const meals = await db.select().from(mealOptions);
    const acts = await db.select().from(activities);
    console.log(JSON.stringify({ rooms: rooms.length, meals: meals.length, activities: acts.length }, null, 2));
}

check().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
