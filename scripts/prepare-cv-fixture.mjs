import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { readSiteConfig } from './site-config.mjs';

const settings = readSiteConfig();
if (!settings.cvSourceDir.includes('.test-work-') || !settings.publicDir.includes('.test-work-')) throw new Error('CV browser fixtures require isolated .test-work- directories');
await mkdir(settings.cvSourceDir, { recursive: true });
await cp('tests/fixtures/cv', settings.cvSourceDir, { recursive: true });
const result = spawnSync(process.execPath, ['scripts/build-cv.mjs'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
if (process.argv.includes('--missing')) await rm(`${settings.publicDir}/cv/en.pdf`);
