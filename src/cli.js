import { resolve } from 'node:path';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { scanRepository, summarize } from './scanner.js';
import { agentInstructions } from './guidance.js';

export function parseArgs(args) {
  const command = args[0] || 'help';
  const i = args.indexOf('--path');
  if (i !== -1 && !args[i + 1]) throw new Error('--path requires a directory');
  const root = resolve(i === -1 ? '.' : args[i + 1]);
  return { command, root };
}
export async function init(root) {
  const folder = resolve(root, '.repoready');
  await mkdir(folder, { recursive: true });
  const config = resolve(folder, 'config.json');
  if (!existsSync(config)) await writeFile(config, JSON.stringify({ schemaVersion: 1, profile: 'auto', exclude: ['node_modules', '.git', 'dist', 'build', '.venv', 'venv'] }, null, 2) + '\n');
  for (const [name, content] of Object.entries(agentInstructions())) {
    const target = resolve(root, name);
    if (!existsSync(target)) await writeFile(target, content);
    else console.log('Preserved existing file:', name);
  }
  console.log('RepoReady initialized. Review AGENTS.md and CLAUDE.md before use.');
}
export async function run(args) {
  const { command, root } = parseArgs(args);
  if (command === 'init') return init(root);
  if (['scan', 'verify', 'certify', 'plan'].includes(command)) {
    const result = await scanRepository(root);
    const report = summarize(result);
    const output = resolve(root, '.repoready', 'report.json');
    await mkdir(resolve(root, '.repoready'), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
    console.log('RepoReady:', report.grade, report.score === null ? '(insufficient evidence)' : report.score + '/100', 'coverage:', report.coverage + '%');
    for (const finding of report.findings) console.log('-', finding.status, finding.id, finding.message);
    console.log('Report:', output);
    if (command === 'verify' || command === 'certify') console.log('NOTE: verification is static only; no build or tests have been executed. Grade is a provisional assessment, not verified certification.');
    if (command === 'plan') console.log('Prioritize failed checks; see the report findings.');
    return;
  }
  console.log('RepoReady CLI\nUsage: repoready init|scan|plan|verify|certify [--path DIR]\n\nverify/certify are provisional static-only modes in v0.1; no external commands are executed.');
}
