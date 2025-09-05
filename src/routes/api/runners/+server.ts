import { json } from "@sveltejs/kit";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Get the gitlab-runner command based on environment
const getRunnerCommand = () => {
  return "gitlab-runner";
};

interface Runner {
  name: string;
  url:string;
  status: string;
  token: string;
  userId?: string;
  description: string;
}

export async function GET() {
  try {
    const runnerCmd = getRunnerCommand();
    const { stdout, stderr } = await execAsync(`${runnerCmd} list`);
    // GitLab runner sometimes outputs to stderr instead of stdout
    const output = stdout || stderr;
    const runners: Runner[] = parseRunners(output);
    return json(runners);
  } catch (error) {
    console.error("Error listing runners:", error);
    return json({ error: "Failed to list runners" }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const { url, token, description, tags, userId } = await request.json();

    const tagList = tags
      ? tags
          .split(",")
          .map((t: string) => t.trim())
          .join(",")
      : "";

    const runnerCmd = getRunnerCommand();
    const descriptionWithUserId = `[userId:${userId}] ${description}`;
    let command = `${runnerCmd} register --non-interactive --url "${url}" --registration-token "${token}" --description "${descriptionWithUserId}" --executor shell`;
    if (tagList) command += ` --tag-list "${tagList}"`;

    await execAsync(command);
    return json({ success: true });
  } catch (error) {
    console.error("Error registering runner:", error);
    return json({ error: "Failed to register runner" }, { status: 500 });
  }
}

export async function DELETE({ request }) {
  try {
    const { token, userId } = await request.json();

    // Get all runners to find the one to delete
    const runnerCmd = getRunnerCommand();
    const { stdout, stderr } = await execAsync(`${runnerCmd} list`);
    const output = stdout || stderr;
    const runners = parseRunners(output);

    const runnerToDelete = runners.find((r) => r.token === token);

    if (!runnerToDelete) {
      return json({ error: "Runner not found" }, { status: 404 });
    }

    if (runnerToDelete.userId !== userId) {
      return json({ error: "You are not authorized to delete this runner" }, { status: 403 });
    }

    const command = `${runnerCmd} unregister --token "${token}"`;

    await execAsync(command);
    return json({ success: true });
  } catch (error) {
    console.error("Error unregistering runner:", error);
    return json({ error: "Failed to unregister runner" }, { status: 500 });
  }
}

function parseRunners(output: string): Runner[] {
  // Remove ANSI escape codes
  const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, "");

  const lines = cleanOutput
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        !line.startsWith("Listing") &&
        !line.startsWith("Runtime") &&
        !line.startsWith("ConfigFile"),
    );
  const runners: Runner[] = [];

  for (const line of lines) {
    // Format: s21_containers                                      Executor=shell Token=ASn7aZYvdLuHyyxAsbUY URL=https://git.21-school.ru
    const nameMatch = line.match(/^(.+?)\s+Executor=/);
    const urlMatch = line.match(/URL=([^\s]+)/);
    const executorMatch = line.match(/Executor=([^\s]+)/);
    const tokenMatch = line.match(/Token=([^\s]+)/);

    if (nameMatch && urlMatch && tokenMatch) {
      let name = nameMatch[1].trim();
      let userId: string | undefined;
      const userIdMatch = name.match(/^\[userId:([^\]]+)\]\s*(.*)/);

      if (userIdMatch) {
        userId = userIdMatch[1];
        name = userIdMatch[2];
      }

      const runner: Runner = {
        name: name,
        description: name,
        url: urlMatch[1],
        status: executorMatch ? executorMatch[1] : "unknown",
        token: tokenMatch[1],
        userId: userId,
      };
      runners.push(runner);
    }
  }

  return runners;
}
