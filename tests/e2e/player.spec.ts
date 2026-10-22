import { expect, setOffers, signInAsPlayer, start, test } from './fixtures';

test('lists markets on the landing page', async ({ page, market }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Available markets' })).toBeVisible();
	await expect(page.getByText(market.name)).toBeVisible();
});

test('rejects invalid sign-in details', async ({ page }) => {
	await page.goto('/');
	await signInAsPlayer(page, 'Bad<Name>');
	await expect(page.getByRole('alert')).toContainText('Names use letters');
});

test('clears the market and pays the clearing price', async ({ market, join }) => {
	const low = await join('TraderA', 'A1');
	const high = await join('TraderB', 'B2');
	await start(market.admin);

	await setOffers(low, (i) => 20 + i * 5);
	await setOffers(high, (i) => 80 + i * 10);
	await expect(market.admin.getByText('Submitted', { exact: true })).toHaveCount(2);
	await market.admin.getByRole('button', { name: 'Advance' }).click();

	await expect(market.admin.getByText('$80', { exact: true }).first()).toBeVisible();
	await expect(low.getByText('+$4,850').first()).toBeVisible();
	await expect(high.getByText('+$240').first()).toBeVisible();
	await expect(low.getByText('TraderB')).toHaveCount(0);
});

test('hides running games from non-members and explains rejected links', async ({
	page,
	market,
	join
}) => {
	await join('Member1');
	await start(market.admin);

	await page.goto(`/?market=${encodeURIComponent(market.name)}`);
	await signInAsPlayer(page, 'Outsider', '99999');
	await expect(page.getByText('This game is no longer accepting players.')).toBeVisible();
	await page.getByRole('button', { name: 'Back to markets' }).click();

	const row = page.getByRole('listitem').filter({ hasText: market.name });
	await expect(row).toBeVisible();
	await expect(row.getByRole('button')).toHaveCount(0);
});

test('refuses a name already taken by another UIN', async ({ page, market, join }) => {
	await join('Twin', '111');
	await page.goto('/');
	await signInAsPlayer(page, 'Twin', '222');
	await page.getByRole('button', { name: `Join ${market.name}` }).click();
	await expect(page.getByText('That name is already taken by another student.')).toBeVisible();
});
