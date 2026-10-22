import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	expect: { timeout: 10_000 },
	use: { baseURL: 'http://localhost:8787', trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
	webServer: {
		command: 'npm run build && npm run preview -- --port 8787 --strictPort',
		url: 'http://localhost:8787',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
