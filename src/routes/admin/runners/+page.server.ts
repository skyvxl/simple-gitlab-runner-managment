import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { runners, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const getRunnerCommand = () => 'gitlab-runner';

interface RunnerStatus {
  name: string;
  token: string;
  status: string;
}

function parseRunnerStatus(output: string): RunnerStatus[] {
  const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
  const lines = cleanOutput.split('\n').filter(line => line.trim() && !line.startsWith('Listing') && !line.startsWith('Runtime') && !line.startsWith('ConfigFile'));
  const statuses: RunnerStatus[] = [];
  for (const line of lines) {
    const nameMatch = line.match(/^(.+?)\s+Executor=/);
    const tokenMatch = line.match(/Token=([^\s]+)/);
    const executorMatch = line.match(/Executor=([^\s]+)/);
    if (nameMatch && tokenMatch && executorMatch) {
      statuses.push({
        name: nameMatch[1].trim(),
        token: tokenMatch[1],
        status: executorMatch[1],
      });
    }
  }
  return statuses;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/runners/login');
  }
  if (locals.user.role !== 'admin') {
    throw error(403, 'Forbidden: You do not have access to this page.');
  }

  try {
    const allRunners = await db.select({
      id: runners.id,
      name: runners.name,
      url: runners.url,
      token: runners.token,
      createdAt: runners.createdAt,
      owner: users.username,
      ownerId: users.id,
    }).from(runners).leftJoin(users, eq(runners.userId, users.id));

    const runnerCmd = getRunnerCommand();
    const { stdout, stderr } = await execAsync(`${runnerCmd} list`);
    const output = stdout || stderr;
    const liveStatuses = parseRunnerStatus(output);

    const runnersWithStatus = allRunners.map((dbRunner) => {
      const liveRunner = liveStatuses.find((r) => r.token === dbRunner.token);
      return {
        ...dbRunner,
        status: liveRunner ? liveRunner.status : 'offline',
      };
    });

    return {
      allRunners: runnersWithStatus,
    };
  } catch (e) {
    console.error('Failed to load admin runner data:', e);
    throw error(500, 'Failed to load runner data.');
  }
};
