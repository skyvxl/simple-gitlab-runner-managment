import cron from 'node-cron';
import { db } from '$lib/server/db';
import { runners, users } from '$lib/server/db/schema';
import { eq, lt } from 'drizzle-orm';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const getRunnerCommand = () => 'gitlab-runner';

async function deleteOldRunners() {
  console.log('Running cron job: Deleting old runners...');

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const oldRunners = await db
      .select({
        id: runners.id,
        token: runners.token,
        ownerRole: users.role,
      })
      .from(runners)
      .leftJoin(users, eq(runners.userId, users.id))
      .where(lt(runners.createdAt, oneMonthAgo));

    for (const runner of oldRunners) {
      if (runner.ownerRole === 'admin') {
        console.log(`Skipping deletion for admin runner ID: ${runner.id}`);
        continue;
      }

      console.log(`Deleting old runner ID: ${runner.id}`);
      try {
        const runnerCmd = getRunnerCommand();
        const command = `${runnerCmd} unregister --token "${runner.token}"`;
        await execAsync(command);
        console.log(`Successfully unregistered runner ID: ${runner.id}`);

        await db.delete(runners).where(eq(runners.id, runner.id));
        console.log(`Successfully deleted runner record from DB for ID: ${runner.id}`);

      } catch (e) {
        console.error(`Failed to delete runner ID: ${runner.id}`, e);
        // If unregistering fails, we might not want to delete it from the DB
        // to be able to retry later. Or we might want to flag it as "defunct".
        // For now, we'll log the error and continue.
      }
    }
    console.log('Finished cron job: Deleting old runners.');
  } catch (error) {
    console.error('Error in deleteOldRunners cron job:', error);
  }
}

// Schedule the task to run once a day at midnight
export function startCron() {
  cron.schedule('0 0 * * *', deleteOldRunners, {
    scheduled: true,
    timezone: "UTC"
  });
  console.log('Cron job for deleting old runners has been scheduled.');
}
