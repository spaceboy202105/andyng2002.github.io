import { mkdtemp, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export async function withSite(run) {
  const directory = await mkdtemp(path.resolve('.test-work-'));
  try {
    await cp('tests/fixtures/content', path.join(directory, 'content'), { recursive: true });
    await cp('tests/fixtures/assets', path.join(directory, 'assets'), { recursive: true });
    await mkdir(path.join(directory, 'public'));
    const env = {
      ...process.env,
      SITE_URL: 'http://127.0.0.1:4321', SITE_BASE_PATH: '/',
      SITE_CONTENT_DIR: path.join(directory, 'content'),
      SITE_PUBLIC_DIR: path.join(directory, 'public'),
      SITE_OUTPUT_DIR: path.join(directory, 'dist'),
    };
    const command = (script, overrides = {}) => spawnSync(process.execPath, [script], {
      env: { ...env, ...overrides }, encoding: 'utf8', timeout: 60_000,
    });
    const build = (overrides = {}) => spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
      env: { ...env, ...overrides }, encoding: 'utf8', timeout: 60_000,
    });
    await run({ directory, env, build, command });
  } finally { await rm(directory, { recursive: true, force: true }); }
}
export const log = result => `${result.stdout}\n${result.stderr}`;
