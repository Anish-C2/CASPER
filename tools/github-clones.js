#!/usr/bin/env node
/**
 * CASPER GitHub clone counter.
 *
 * GitHub only exposes the repository's clone traffic for the most recent
 * 14 days. This program stores the daily clone counts returned by that
 * endpoint, merges overlapping 14-day windows by date, and prints the
 * lifetime total represented by the stored history.
 *
 * Usage:
 *   GITHUB_TOKEN=... node tools/github-clones.js
 *
 * The token needs repository push/read access because GitHub's traffic API
 * is restricted to users with push access to the repository.
 */

const fs = require('node:fs');
const path = require('node:path');

const OWNER = process.env.CASPER_GITHUB_OWNER || 'Anish-C2';
const REPO = process.env.CASPER_GITHUB_REPO || 'CASPER';
const TOKEN = process.env.GITHUB_TOKEN;
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'github-clones.json');

if (!TOKEN) {
  console.error('Missing GITHUB_TOKEN.');
  process.exit(1);
}

async function github(endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CASPER-clone-counter'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return response.json();
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { repository: `${OWNER}/${REPO}`, days: {} };
  }
}

function saveHistory(history) {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + '\n');
}

function totals(history) {
  return Object.values(history.days).reduce(
    (sum, day) => ({
      clones: sum.clones + Number(day.clones || 0),
      uniques: sum.uniques + Number(day.uniques || 0)
    }),
    { clones: 0, uniques: 0 }
  );
}

async function main() {
  const traffic = await github(`/repos/${OWNER}/${REPO}/traffic/clones`);
  const history = loadHistory();

  // The API returns up to 14 days. Re-running this program is safe because
  // dates are keys, so overlapping windows replace the same daily records.
  for (const point of traffic.clones || []) {
    const date = new Date(point.timestamp).toISOString().slice(0, 10);
    history.days[date] = {
      clones: Number(point.count || 0),
      uniques: Number(point.uniques || 0),
      updated_at: point.timestamp
    };
  }

  history.repository = `${OWNER}/${REPO}`;
  history.updated_at = new Date().toISOString();

  saveHistory(history);

  const total = totals(history);
  console.log(`CASPER lifetime clones: ${total.clones.toLocaleString('en-IN')}`);
  console.log(`Unique cloners (sum of daily uniques): ${total.uniques.toLocaleString('en-IN')}`);
  console.log(`Tracked days: ${Object.keys(history.days).length}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
