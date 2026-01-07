import { db } from './src/db/index';
import { roomTypes } from './src/db/schema';
import { getDailyInventoryStatus } from './src/utils/admin';

async function test() {
    console.log("Checking DB connection...");
    const rooms = await db.select().from(roomTypes);
    console.log(`Found ${rooms.length} room types directly from DB.`);

    if (rooms.length > 0) {
        console.log("Room 1:", rooms[0].name);
    }

    // We can't easily call createServerFn directly without mocking context, 
    // but let's copy the logic and run it.

    // Simulate getDailyInventoryStatus logic for 'room'
    const type = 'room';

    let resources = [];
    if (type === 'room') {
        resources = await db.select().from(roomTypes);
    }

    console.log(`Resources variable content: ${JSON.stringify(resources, null, 2)}`);
}

test().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
});
