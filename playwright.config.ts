import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests', fullyParallel: false, workers: 1, reporter: 'list',
 use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321', channel: 'msedge', headless: true },
 webServer: { command: process.env.PLAYWRIGHT_BASE_URL?'npm run preview -- --port 4322':'npm run dev', url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321', reuseExistingServer: true },
});
