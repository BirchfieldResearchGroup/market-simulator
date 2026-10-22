import { configure, expect, signInAsAdmin, signInAsPlayer, start, test } from './fixtures';

test('rejects a wrong instructor password', async ({ page }) => {
	await signInAsAdmin(page, 'definitely-wrong');
	await expect(page.getByText('Incorrect password.')).toBeVisible();
});

test('creates a market and refuses duplicate names', async ({ market }) => {
	const { admin, name } = market;
	await admin.getByRole('button', { name: 'New market' }).click();
	await admin.getByLabel('Market name').fill(name);
	await admin.getByRole('button', { name: 'Create market' }).click();
	await expect(admin.getByText('A market with that name already exists.')).toBeVisible();
});

test('edits settings before the game starts', async ({ market }) => {
	await configure(market.admin, { 'Max players': '8' });
	await expect(market.admin.getByText('0 / 8 players')).toBeVisible();
});

test('starts and advances a game', async ({ market, join }) => {
	await join('Player1');
	await start(market.admin);
	await market.admin.getByRole('button', { name: 'Advance' }).click();
	await expect(market.admin.getByText('Period 2', { exact: true })).toBeVisible();
});

test('auto-advances to completion and shows results', async ({ market, join }) => {
	await configure(market.admin, { Periods: '2', 'Timer (sec)': '2' });
	const player = await join('Finisher');
	await start(market.admin);
	await expect(player.getByText('Market complete')).toBeVisible({ timeout: 20_000 });
	await expect(player.getByText('Final rank')).toBeVisible();
	await expect(market.admin.getByText('Game complete')).toBeVisible();
});

test('removes a player from the lobby', async ({ market, join }) => {
	const player = await join('Leaver');
	await market.admin.getByRole('button', { name: /Leaver/ }).click();
	await market.admin.getByRole('button', { name: 'Remove from game' }).click();
	await market.admin
		.getByRole('dialog', { name: 'Remove player' })
		.getByRole('button', { name: 'Remove' })
		.click();
	await expect(player.getByText('You were removed from this game.')).toBeVisible();
	await expect(market.admin.getByText('No players have joined yet.')).toBeVisible();
});

test('adjusts balances and exports CSV', async ({ market, join }) => {
	const player = await join('Earner');
	await start(market.admin);
	await market.admin.getByRole('button', { name: /Earner/ }).click();
	await market.admin.getByRole('button', { name: '+$500' }).click();
	await expect(player.getByText('+$500').first()).toBeVisible();
	await market.admin.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

	await market.admin.getByRole('button', { name: 'Advance' }).click();
	const download = market.admin.waitForEvent('download');
	await market.admin.getByRole('button', { name: 'Download CSV' }).click();
	expect((await download).suggestedFilename()).toBe(`${market.name}.csv`);
});

test('hides unlisted markets but admits players with the link', async ({ page, market }) => {
	await configure(market.admin, {}, false);
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Available markets' })).toBeVisible();
	await expect(page.getByText(market.name)).toHaveCount(0);

	await page.goto(`/?market=${encodeURIComponent(market.name)}`);
	await signInAsPlayer(page, 'Linked');
	await expect(page.getByText("You're in!")).toBeVisible();
});

test('deletes a market after confirmation', async ({ market }) => {
	const { admin, name } = market;
	await admin.getByRole('button', { name: 'Market settings' }).click();
	await admin.getByRole('button', { name: 'Delete market' }).click();
	await admin
		.getByRole('dialog', { name: 'Delete market' })
		.getByRole('button', { name: 'Delete market' })
		.click();
	await expect(admin.getByText('Select a market')).toBeVisible();
	await expect(admin.getByRole('button', { name: new RegExp(name) })).toHaveCount(0);
});
