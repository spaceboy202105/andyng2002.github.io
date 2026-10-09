import { defineConfig } from '@playwright/test';

const port = process.env.SITE_TEST_PORT ?? '4321';
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/cv.spec.ts', '**/cv-missing.spec.ts', '**/release.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: { baseURL: origin, trace: 'retain-on-failure' },
  webServer: {
    command: `npm run build && npx astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `${origin}/`,
    reuseExistingServer: false,
    env: {
      SITE_URL: origin,
      SITE_BASE_PATH: '/',
      SITE_CONTENT_DIR: 'tests/fixtures/content',
      SITE_PUBLIC_DIR: 'tests/fixtures/public',
      SITE_OUTPUT_DIR: '.test-dist',
    },
  },
});
