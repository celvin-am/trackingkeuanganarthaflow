import { db } from './db.js';
import { categories } from '../db/schema/tables.js';
import { user } from '../db/schema/auth.js';

async function seed() {
  const users = await db.select().from(user).limit(1);
  if (users.length === 0) {
    console.log("No user found. Please sign up first.");
    process.exit(1);
  }
  
  const userId = users[0].id;
  
  const seedCategories = [
    { userId, name: 'Komponen Elektronika', type: 'EXPENSE' as const, color: 'bg-blue-500', icon: 'memory' },
    { userId, name: 'Subscription/Tools', type: 'EXPENSE' as const, color: 'bg-purple-500', icon: 'build' },
    { userId, name: 'Uang Jajan', type: 'EXPENSE' as const, color: 'bg-orange-500', icon: 'restaurant' },
  ];

  await db.insert(categories).values(seedCategories).onConflictDoNothing();
  console.log("Categories seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
