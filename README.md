# RepoReady

**Evidence-based repository reusability assessment and coding-agent guidance.**

RepoReady is an early, open-source CLI prototype. It detects repository structure, generates guidance for coding assistants, runs transparent static checks, and produces a JSON assessment. **No npm publication, Gold/Silver/Bronze verified certification, dynamic execution, or security guarantee is claimed in v0.1.**

## Quick start

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/pjswall/RepoReady.git
cd RepoReady
npm test
node bin/repoready.js init --path /path/to/another/repository
node bin/repoready.js scan --path /path/to/another/repository
```

For local CLI development, `npm link` optionally makes `repoready` available on your path. **Do not use `npx repoready` until the intended package has been published and verified.**

## Commands

| Command | Behavior |
| --- | --- |
| `init` | Generate non-destructive `AGENTS.md`, `CLAUDE.md` and `.repoready/config.json` |
| `scan` | Check repository evidence and save `.repoready/report.json` |
| `plan` | Print findings for prioritized manual remediation |
| `verify` | Static-only assessment; does **not** execute tests/builds yet |
| `certify` | Provisional static report; always **Uncertified** until verification is implemented |

## Why certification is not active yet

A README, test directory, or lockfile does not prove a repository works. A future release will execute clean installs, tests and safe sandboxed extension simulations, enforce security gates, and sign reports tied to commits and rule versions. Until then, static quality scores are for improvement only, not audited badges.

## Planned architecture

1. Repository profiler (Python and JS/TS detection, with mixed-language support).
2. Canonical language-neutral standards and applicability profiles.
3. Agent adapters for Codex, Claude Code, Cursor, and future tools.
4. Deterministic evidence collector with optional AST analyzers.
5. Weighted scoring with explicit `pass`, `fail`, `unknown`, `not_run`, `not_applicable`.
6. Verified certification through isolated, reproducible checks and human-auditable evidence.

The seven proposed scoring domains are reproducibility (20%), modularity (20%), documentation (15%), testing (15%), extensibility (10%), agent readiness (10%), and security/portability (10%).

## Limitations

Current detection is intentionally lightweight, not a full AST analysis. The scanner neither executes untrusted repository code nor performs a vulnerability audit. Unknown and unexecuted checks lower coverage; absent dynamic verification blocks certification. Generated agent instructions guide assistants but do not guarantee adherence. Existing instruction files are preserved.

## Contribution

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions and rule proposals are welcome.
