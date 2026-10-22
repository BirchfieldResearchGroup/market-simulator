import { expect, test } from './fixtures';

test('player session survives a page refresh', async ({ join }) => {
	const player = await join('Refresher');
	await player.reload();
	await expect(player.getByText("You're in!")).toBeVisible();
});

test('admin session survives a page refresh', async ({ market }) => {
	await market.admin.reload();
	await expect(market.admin.getByRole('heading', { name: market.name })).toBeVisible();
});

test('reconnects after the network drops', async ({ join }) => {
	const player = await join('Reconnector');
	await player.context().setOffline(true);
	await player.waitForTimeout(2000);
	await player.context().setOffline(false);
	await expect(player.getByText("You're in!")).toBeVisible({ timeout: 30_000 });
});

test('a second tab replaces the first', async ({ join }) => {
	const first = await join('Doubler', 'D1');
	const second = await first.context().newPage();
	await second.goto('/');
	await expect(second.getByText("You're in!")).toBeVisible();
	await expect(first.getByText('Connected from another tab.')).toBeVisible();
});
