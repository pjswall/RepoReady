import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanRepository, summarize } from '../src/scanner.js';
import { init, parseArgs } from '../src/cli.js';

test('CLI parses a path', () => { assert.equal(parseArgs(['scan','--path','.']).command, 'scan'); });
test('empty repository cannot receive certified grade', async () => {
  const dir = await mkdtemp(join(tmpdir(),'repoready-'));
  try {
    const result = summarize(await scanRepository(dir));
    assert.equal(result.grade, 'Uncertified');
    assert.ok(result.coverage < 100);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('init is non-destructive and generates agent files', async () => {
  const dir = await mkdtemp(join(tmpdir(),'repoready-'));
  try {
    await writeFile(join(dir,'AGENTS.md'),'custom instructions');
    await init(dir);
    const { readFile } = await import('node:fs/promises');
    assert.equal(await readFile(join(dir,'AGENTS.md'),'utf8'),'custom instructions');
    const report = summarize(await scanRepository(dir));
    assert.equal(report.findings.find(x=>x.id==='RR-AGENT-001').status,'pass');
  } finally { await rm(dir,{recursive:true,force:true}); }
});
