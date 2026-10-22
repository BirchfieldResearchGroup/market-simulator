import { createSubscriber } from 'svelte/reactivity';

const subscribe = createSubscriber((update) => {
	const timer = setInterval(update, 250);
	return () => clearInterval(timer);
});

export function now(): number {
	subscribe();
	return Date.now();
}
