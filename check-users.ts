import { db } from './src/db/index';
import { users } from './src/db/schema';

async function check() {
    const allUsers = await db.select().from(users);
    console.log(JSON.stringify(allUsers, null, 2));
}

check().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
