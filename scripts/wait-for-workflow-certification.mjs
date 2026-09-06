import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = 'docs/merge-certification.json';
const API_VERSION = '2022-11-28';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function requireExactSha(value) {
  if (!/^[0-9a-f]{40}$/.test(value ?? '')) {
    throw new Error('--head must be an exact 40-character lowercase commit SHA');
  }
  return value;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function loadLane(laneId) {
  const contract = JSON.parse(fs.readFileSync(path.join(process.cwd(), CONTRACT_PATH), 'utf8'));
  const lane = contract.lanes?.[laneId];
  if (!lane) throw new Error(`Unknown merge-certification lane: ${laneId}`);
  return lane;
}

function repositoryParts() {
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const match = /^([^/]+)\/([^/]+)$/.exec(repository);
  if (!match) throw new Error('GITHUB_REPOSITORY must be owner/name');
  return { owner: match[1], repo: match[2] };
}

async function fetchRuns({ owner, repo, workflowFile, headSha, event, token }) {
  const workflowId = path.posix.basename(workflowFile);
  const workflow = encodeURIComponent(workflowId);
  const query = new URLSearchParams({
    event,
    head_sha: headSha,
    per_page: '20',
  });
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?${query}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'the-legendary-poet-merge-certification',
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub Actions API ${response.status}: ${body.slice(0, 1000)}`);
  }
  return response.json();
}

function latestRun(payload) {
  return [...(payload.workflow_runs ?? [])]
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0] ?? null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const laneId = args.lane;
  if (!laneId) throw new Error('--lane is required');
  const headSha = requireExactSha(args.head);
  const lane = loadLane(laneId);
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const repository = repositoryParts();
  const timeoutSeconds = Number(lane.pollTimeoutSeconds);
  const pollIntervalSeconds = Number(lane.pollIntervalSeconds);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error(`${laneId} has invalid pollTimeoutSeconds`);
  if (!Number.isFinite(pollIntervalSeconds) || pollIntervalSeconds < 5) throw new Error(`${laneId} has invalid pollIntervalSeconds`);

  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastRunId = null;
  while (Date.now() < deadline) {
    const payload = await fetchRuns({
      ...repository,
      workflowFile: lane.workflowFile,
      headSha,
      event: lane.event,
      token,
    });
    const run = latestRun(payload);
    if (!run) {
      console.log(`[${laneId}] no exact-head workflow run found yet for ${headSha}; polling again`);
      await sleep(pollIntervalSeconds * 1000);
      continue;
    }

    if (run.head_sha !== headSha) {
      throw new Error(`${laneId} returned stale head ${run.head_sha}; expected ${headSha}`);
    }
    if (run.event !== lane.event) {
      throw new Error(`${laneId} returned event ${run.event}; expected ${lane.event}`);
    }
    if (run.id !== lastRunId) {
      console.log(`[${laneId}] observing run ${run.id} status=${run.status} conclusion=${run.conclusion ?? 'pending'} head=${run.head_sha}`);
      lastRunId = run.id;
    }
    if (run.status === 'completed') {
      if (run.conclusion !== 'success') {
        throw new Error(`${laneId} exact-head run ${run.id} completed with ${run.conclusion}`);
      }
      console.log(`[${laneId}] exact-head certification succeeded in run ${run.id}`);
      return;
    }

    await sleep(pollIntervalSeconds * 1000);
  }

  throw new Error(`${laneId} did not reach terminal success within ${timeoutSeconds}s for ${headSha}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
