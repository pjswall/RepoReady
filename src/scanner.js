import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

const ignores = new Set(['.git', 'node_modules', 'dist', 'build', '.venv', 'venv', '.next', 'coverage', '.repoready']);
const weights = { reproducibility: 20, modularity: 20, documentation: 15, testing: 15, extensibility: 10, agent: 10, security: 10 };
async function collect(root, dir = root, depth = 0, files = []) {
  if (depth > 8 || files.length >= 6000) return files;
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (ignores.has(item.name)) continue;
    const path = join(dir, item.name);
    if (item.isDirectory()) await collect(root, path, depth + 1, files);
    else if (item.isFile()) files.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    if (files.length >= 6000) break;
  }
  return files;
}
const has = (files, pattern) => files.some(f => pattern.test(f));
const finding = (id, category, status, message) => ({ id, category, status, message });
export async function scanRepository(root) {
  if (!(await stat(root)).isDirectory()) throw new Error('Not a directory');
  const files = await collect(root);
  const python = has(files, /(^|\/)(pyproject\.toml|requirements[^/]*\.txt|setup\.py)$/) || has(files, /\.py$/);
  const javascript = has(files, /(^|\/)package\.json$/) || has(files, /\.(js|jsx|ts|tsx)$/);
  const language = python && javascript ? 'mixed' : python ? 'python' : javascript ? 'javascript-typescript' : 'unknown';
  const manifests = has(files, /(^|\/)(pyproject\.toml|requirements[^/]*\.txt|Pipfile|package\.json|go\.mod|Cargo\.toml)$/);
  const locks = has(files, /(^|\/)(uv\.lock|poetry\.lock|Pipfile\.lock|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|go\.sum)$/);
  const readme = has(files, /(^|\/)readme(\.md|\.rst|\.txt)?$/i);
  let readmeContent = '';
  const readmePath = files.find(f => /(^|\/)readme(\.md|\.rst|\.txt)?$/i.test(f));
  if (readmePath) readmeContent = (await readFile(join(root, readmePath), 'utf8')).slice(0, 40000);
  const tests = has(files, /(^|\/)(__tests__|tests?|spec)(\/|\.)|([._](test|spec)\.[cm]?[jt]sx?$)|(^|\/)test_[^/]+\.py$/i);
  const ci = has(files, /^\.github\/workflows\/[^/]+\.ya?ml$/);
  const agent = files.includes('AGENTS.md') || files.includes('CLAUDE.md') || has(files, /^\.cursor\/rules\//);
  const docs = has(files, /(^|\/)(docs\/|CONTRIBUTING\.md$|ARCHITECTURE\.md$)/i);
  const license = has(files, /(^|\/)LICENSE(\.[^/]*)?$/i);
  const envTemplate = has(files, /(^|\/)(\.env\.example|\.env\.sample|example\.env)$/i);
  const findings = [
    finding('RR-REPRO-001','reproducibility', manifests ? 'pass':'fail','Dependency manifest present'),
    finding('RR-REPRO-002','reproducibility', manifests ? (locks ? 'pass':'fail') : 'not_applicable','Dependency lock or equivalent present'),
    finding('RR-REPRO-003','reproducibility','not_run','Clean install has not been executed'),
    finding('RR-DOC-001','documentation',readme ? 'pass':'fail','README exists'),
    finding('RR-DOC-002','documentation',readme ? (/install|setup|quick.?start|getting started/i.test(readmeContent) ? 'pass':'fail'):'not_applicable','README describes installation or setup'),
    finding('RR-DOC-003','documentation',docs ? 'pass':'fail','Architecture or contributor documentation present'),
    finding('RR-TEST-001','testing',tests ? 'pass':'fail','Test files detected'),
    finding('RR-TEST-002','testing',ci ? 'pass':'fail','GitHub Actions CI detected'),
    finding('RR-TEST-003','testing','not_run','Test execution has not been performed'),
    finding('RR-AGENT-001','agent',agent ? 'pass':'fail','Coding agent instructions present'),
    finding('RR-SEC-001','security',license ? 'pass':'fail','License file present'),
    finding('RR-SEC-002','security',envTemplate ? 'pass':'fail','Example environment configuration present'),
    finding('RR-SEC-003','security','not_run','Security audit has not been executed'),
    finding('RR-MOD-001','modularity','unknown','Architecture coupling needs language-aware analysis'),
    finding('RR-EXT-001','extensibility','unknown','Extension boundary validation requires analysis')
  ];
  return { root, filesChecked: files.length, language, findings };
}
export function summarize({ language, filesChecked, findings }) {
  const groups = Object.keys(weights).map(category => {
    const eligible = findings.filter(f => f.category === category && f.status !== 'not_applicable');
    const evaluated = eligible.filter(f => f.status === 'pass' || f.status === 'fail');
    const score = evaluated.length ? Math.round(100 * evaluated.filter(f => f.status === 'pass').length / evaluated.length) : null;
    return { category, weight: weights[category], score, checked: evaluated.length, applicable: eligible.length };
  });
  const assessed = groups.filter(g => g.score !== null);
  const score = assessed.length ? Math.round(assessed.reduce((n,g) => n + g.score*g.weight,0)/assessed.reduce((n,g)=>n+g.weight,0)) : null;
  const applicable = groups.reduce((n,g)=>n+g.applicable,0);
  const coverage = applicable ? Math.round(100*groups.reduce((n,g)=>n+g.checked,0)/applicable) : 0;
  // No verified grades until dynamic checks and hard gates are implemented.
  const grade = 'Uncertified';
  return { schemaVersion:1, language, filesChecked, score, coverage, grade, certification:'provisional-static-only', domains:groups, findings };
}
