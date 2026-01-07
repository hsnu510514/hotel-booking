
import { db } from './src/db/index';
import { activities } from './src/db/schema';

async function check() {
    const acts = await db.select().from(activities);
    console.log(JSON.stringify(acts, null, 2));
}

check().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
