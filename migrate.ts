import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './src/lib/server/db';

// This will run migrations on the database, skipping the ones already applied
migrate(db, { migrationsFolder: './drizzle' });

console.log('Migrations applied successfully!');
