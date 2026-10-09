import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/cv.spec.ts', '**/cv-missing.spec.ts', '**/release.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: false,
    env: {
      SITE_URL: 'http://127.0.0.1:4321',
      SITE_BASE_PATH: '/',
      SITE_CONTENT_DIR: 'tests/fixtures/content',
      SITE_PUBLIC_DIR: 'tests/fixtures/public',
      SITE_OUTPUT_DIR: '.test-dist',
    },
  },
});
