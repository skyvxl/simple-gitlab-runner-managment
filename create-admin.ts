import { db } from './src/lib/server/db';
import { users } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter username for admin: ', async (username) => {
  rl.question('Enter password for admin: ', async (password) => {
    if (!username || !password) {
      console.error('Username and password cannot be empty.');
      rl.close();
      return;
    }

    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      const passwordHash = await bcrypt.hash(password, 10);

      if (existingUser) {
        await db.update(users)
          .set({ role: 'admin', passwordHash })
          .where(eq(users.id, existingUser.id));
        console.log(`User '${username}' already existed. Promoted to admin.`);
      } else {
        await db.insert(users).values({
          username,
          passwordHash,
          role: 'admin',
        });
        console.log(`Admin user '${username}' created successfully.`);
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
    } finally {
      rl.close();
    }
  });
});
