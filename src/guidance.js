const standard = 'Follow the existing architecture, prefer reusable interfaces only when justified, avoid duplication, document setup/config changes, add tests, and do not report unexecuted tests as passed. Run repoready scan and inspect .repoready/report.json.';
export function agentInstructions() {
  return {
    'AGENTS.md': '# RepoReady agent guidelines\n\n' + standard + '\n\nDo not overwrite repository conventions without review.\n',
    'CLAUDE.md': '# RepoReady guidance for Claude Code\n\n' + standard + '\n'
  };
}
