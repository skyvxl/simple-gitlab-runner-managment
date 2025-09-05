import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { startCron } from '$lib/server/cron/delete-old-runners';
import { building } from '$app/environment';

// Start the cron job only on the server and not during build
if (!building) {
  startCron();
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth_token');
  event.locals.user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: 'admin' | 'user' };

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
        columns: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (user) {
        event.locals.user = user;
      }
    } catch (err) {
      // Invalid token, clear it
      event.cookies.delete('auth_token', { path: '/' });
    }
  }

  return resolve(event);
};
