const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

const hex = (buffer: ArrayBuffer) =>
	[...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sign(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

async function safeEqual(a: string, b: string): Promise<boolean> {
	const [x, y] = await Promise.all(
		[a, b].map((value) => crypto.subtle.digest('SHA-256', encoder.encode(value)))
	);
	return crypto.subtle.timingSafeEqual(x, y);
}

export const isPassword = (input: string, secret: string) => safeEqual(input, secret);

export async function createAdminToken(secret: string): Promise<string> {
	const expiry = String(Date.now() + TOKEN_TTL_MS);
	return `${expiry}.${await sign(secret, expiry)}`;
}

export async function verifyAdminToken(token: string | null | undefined, secret: string) {
	const [expiry, signature] = token?.split('.') ?? [];
	return (
		Number(expiry) > Date.now() && !!signature && safeEqual(signature, await sign(secret, expiry))
	);
}
