import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '$lib/server/db';
import { runners } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { shellescape } from '$lib/server/utils';

const execAsync = promisify(exec);

const getRunnerCommand = () => {
  return 'gitlab-runner';
};

interface RunnerStatus {
  name: string;
  token: string;
  status: string;
}

function parseRunnerStatus(output: string): RunnerStatus[] {
  const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
  const lines = cleanOutput
    .split('\n')
    .filter(
      (line) =>
        line.trim() &&
        !line.startsWith('Listing') &&
        !line.startsWith('Runtime') &&
        !line.startsWith('ConfigFile')
    );
  const statuses: RunnerStatus[] = [];

  for (const line of lines) {
    const nameMatch = line.match(/^(.+?)\s+Executor=/);
    const tokenMatch = line.match(/Token=([^\s]+)/);
    const executorMatch = line.match(/Executor=([^\s]+)/); // Status is in executor field

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

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRunners = await db.query.runners.findMany({
      where: eq(runners.userId, locals.user.id),
    });

    const runnerCmd = getRunnerCommand();
    const { stdout, stderr } = await execAsync(`${runnerCmd} list`);
    const output = stdout || stderr;
    const liveStatuses = parseRunnerStatus(output);

    const runnersWithStatus = userRunners.map((dbRunner) => {
      const liveRunner = liveStatuses.find((r) => r.token === dbRunner.token);
      return {
        ...dbRunner,
        status: liveRunner ? liveRunner.status : 'offline',
      };
    });

    return json(runnersWithStatus);
  } catch (error) {
    console.error('Error listing runners:', error);
    return json({ error: 'Failed to list runners' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, token: registrationToken, description, tags } = await request.json();
    const uniqueDescription = `${description} [user:${locals.user.id}] [timestamp:${Date.now()}]`;

    const tagList = tags ? tags.split(',').map((t: string) => t.trim()).join(',') : '';

    const runnerCmd = getRunnerCommand();

    const safeUrl = shellescape(url);
    const safeRegToken = shellescape(registrationToken);
    const safeDesc = shellescape(uniqueDescription);

    let registerCommand = `${runnerCmd} register --non-interactive --url ${safeUrl} --token ${safeRegToken} --description ${safeDesc} --executor shell`;
    if (tagList) {
        const safeTagList = shellescape(tagList);
        registerCommand += ` --tag-list ${safeTagList}`;
    }

    await execAsync(registerCommand);

    // Find the token of the newly registered runner
    const { stdout, stderr } = await execAsync(`${runnerCmd} list`);
    const output = stdout || stderr;
    const allLiveRunners = parseRunnerStatus(output);
    const newRunner = allLiveRunners.find((r) => r.name === uniqueDescription);

    if (!newRunner) {
      // Cleanup failed registration
      await execAsync(`${runnerCmd} unregister --description ${safeDesc}`);
      return json({ error: 'Failed to find the newly registered runner to save it.' }, { status: 500 });
    }

    await db.insert(runners).values({
      userId: locals.user.id,
      token: newRunner.token,
      name: description, // Store the original description
      url,
    });

    return json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error registering runner:', error);
    return json({ error: 'Failed to register runner' }, { status: 500 });
  }
}

export async function DELETE({ request, locals }) {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json(); // We'll use the database ID for deletion

    const runnerToDelete = await db.query.runners.findFirst({
      where: eq(runners.id, id),
    });

    if (!runnerToDelete) {
      return json({ error: 'Runner not found' }, { status: 404 });
    }

    // Admin can delete any runner, users can only delete their own
    if (user.role !== 'admin' && runnerToDelete.userId !== user.id) {
        return json({ error: 'You do not have permission to delete this runner' }, { status: 403 });
    }

    const runnerCmd = getRunnerCommand();
    const safeToken = shellescape(runnerToDelete.token);
    const command = `${runnerCmd} unregister --token ${safeToken}`;
    await execAsync(command);

    await db.delete(runners).where(eq(runners.id, id));

    return json({ success: true });
  } catch (error) {
    console.error('Error unregistering runner:', error);
    return json({ error: 'Failed to unregister runner' }, { status: 500 });
  }
}
