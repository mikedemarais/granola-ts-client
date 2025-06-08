// src/pagination.ts
/**
 * Async pagination iterator helper.
 * @param fetchPage Function that fetches a page given an optional cursor.
 *                  Should return an object with `items` and optional `next` cursor.
 */
export async function* paginate<T>(
	fetchPage: (cursor?: string) => Promise<{ items: T[]; next?: string }>,
): AsyncGenerator<T, void, unknown> {
	let cursor: string | undefined;
	do {
		const { items, next } = await fetchPage(cursor);
		for (const item of items) {
			yield item;
		}
		cursor = next;
	} while (cursor);
}
