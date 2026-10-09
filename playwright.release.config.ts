import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'release.spec.ts',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4353', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/prepare-cv-fixture.mjs && npm run build && npm run check:artifacts && npx astro preview --host 127.0.0.1 --port 4353 --ignore-lock',
    url: 'http://127.0.0.1:4353/preview/',
    reuseExistingServer: false,
    env: {
      SITE_URL: 'http://127.0.0.1:4353', SITE_BASE_PATH: '/preview/',
      SITE_CONTENT_DIR: 'tests/fixtures/content', CV_SOURCE_DIR: '.test-work-subpath/source',
      SITE_PUBLIC_DIR: '.test-work-subpath/public', SITE_OUTPUT_DIR: '.test-dist-subpath',
    },
  },
});
