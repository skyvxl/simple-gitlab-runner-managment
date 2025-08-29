import { json } from "@sveltejs/kit";
import { exec } from "child_process";
import { promisify } from "util";
import { dev } from "$app/environment";

const execAsync = promisify(exec);

// Get the gitlab-runner command based on environment
const getRunnerCommand = () => {
  return dev ? "docker exec gitlab-runner gitlab-runner" : "gitlab-runner";
};

interface Runner {
  name: string;
  url: string;
  status: string;
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
    const { url, token, description, tags } = await request.json();

    const tagList = tags
      ? tags
          .split(",")
          .map((t: string) => t.trim())
          .join(",")
      : "";

    const runnerCmd = getRunnerCommand();
    let command = `${runnerCmd} register --non-interactive --url "${url}" --registration-token "${token}" --description "${description}" --executor shell`;
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
    const { name } = await request.json();

    const runnerCmd = getRunnerCommand();
    let command = `${runnerCmd} unregister --name "${name}"`;

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
    const nameMatch = line.match(/^(\S+)/);
    const urlMatch = line.match(/URL=([^\s]+)/);
    const executorMatch = line.match(/Executor=([^\s]+)/);

    if (nameMatch && urlMatch) {
      const runner = {
        name: nameMatch[1],
        url: urlMatch[1],
        status: executorMatch ? executorMatch[1] : "unknown",
      };
      runners.push(runner);
    }
  }

  return runners;
}
