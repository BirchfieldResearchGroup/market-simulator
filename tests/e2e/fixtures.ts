import { test as base, expect, type Browser, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export const ADMIN_PASSWORD =
	process.env.ADMIN_PASSWORD ??
	/^ADMIN_PASSWORD=(.*)$/m.exec(readFileSync('.dev.vars', 'utf8'))?.[1]?.trim() ??
	'';

export async function signInAsAdmin(page: Page, password = ADMIN_PASSWORD) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Instructor sign in' }).click();
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export async function signInAsPlayer(page: Page, name: string, uin = '12345') {
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('UIN').fill(uin);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export async function setOffers(page: Page, price: (index: number) => number) {
	const inputs = page.getByLabel(/^Offer for Gen/);
	await expect(inputs.first()).toBeVisible();
	for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill(String(price(i)));
	await page.getByRole('button', { name: /^(Submit|Update) offers$/ }).click();
	await expect(page.getByText(/^Offers submitted/)).toBeVisible();
}

export const test = base.extend<{
	market: { admin: Page; name: string };
	join: (name: string, uin?: string) => Promise<Page>;
}>({
	market: async ({ browser, request }, use) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await signInAsAdmin(page);
		const name = `test-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
		await page.getByRole('button', { name: 'New market' }).click();
		await page.getByLabel('Market name').fill(name);
		await page.getByRole('button', { name: 'Create market' }).click();
		await expect(page.getByRole('heading', { name })).toBeVisible();
		await use({ admin: page, name });
		await context.close();
		const login = await request.post('/api/login', { data: { password: ADMIN_PASSWORD } });
		const { key } = (await login.json()) as { key: string };
		await request.delete(`/api/markets/${encodeURIComponent(name)}`, {
			headers: { Authorization: `Bearer ${key}` }
		});
	},

	join: async ({ browser, market }, use) => {
		const contexts: Awaited<ReturnType<Browser['newContext']>>[] = [];
		await use(async (player, uin) => {
			const context = await browser.newContext();
			contexts.push(context);
			const page = await context.newPage();
			await page.goto('/');
			await signInAsPlayer(page, player, uin);
			await page.getByRole('button', { name: `Join ${market.name}` }).click();
			await expect(page.getByText("You're in!")).toBeVisible();
			await expect(market.admin.getByText(player, { exact: true })).toBeVisible();
			return page;
		});
		for (const context of contexts) await context.close();
	}
});

export { expect };

export async function configure(admin: Page, fields: Record<string, string>, listed = true) {
	await admin.getByRole('button', { name: 'Market settings' }).click();
	const dialog = admin.getByRole('dialog');
	for (const [label, value] of Object.entries(fields))
		await dialog.getByLabel(label, { exact: true }).fill(value);
	if (Object.keys(fields).length)
		await dialog.getByRole('button', { name: 'Save changes' }).click();
	await dialog.getByRole('switch').setChecked(listed);
	await dialog.getByRole('button', { name: 'Close' }).click();
	await expect(dialog).toBeHidden();
}

export async function start(admin: Page) {
	await admin.getByRole('button', { name: 'Start' }).click();
	await expect(admin.getByText('In Progress')).toBeVisible();
}
