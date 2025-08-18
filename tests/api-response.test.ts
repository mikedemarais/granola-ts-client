import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import GranolaClient from "../src";

// Set NODE_ENV for testing
beforeAll(() => {
	process.env.NODE_ENV = "test";
});

describe("API Response Handling", () => {
	let originalFetch: typeof fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe("getDocumentTranscript", () => {
		it("should handle array response directly from API", async () => {
			const mockTranscript = [
				{
					document_id: "doc-123",
					start_timestamp: "2025-08-18T14:04:59.643Z",
					text: "Hello world",
					source: "microphone",
					id: "segment-1",
					is_final: true,
					end_timestamp: "2025-08-18T14:05:01.183Z",
				},
				{
					document_id: "doc-123",
					start_timestamp: "2025-08-18T14:05:01.183Z",
					text: "This is a test",
					source: "microphone",
					id: "segment-2",
					is_final: true,
					end_timestamp: "2025-08-18T14:05:03.000Z",
				},
			];

			const mockFetch = async (input: URL | Request, init?: RequestInit) => {
				const req = input instanceof Request ? input : new Request(input, init);
				expect(req.headers.get("Authorization")).toBe("Bearer test-token");

				// API returns array directly, not wrapped
				return new Response(JSON.stringify(mockTranscript), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const transcript = await client.getDocumentTranscript("doc-123");

			expect(Array.isArray(transcript)).toBe(true);
			expect(transcript).toEqual(mockTranscript);
			expect(transcript.length).toBe(2);
			expect(transcript[0].text).toBe("Hello world");
		});

		it("should return empty array when API returns empty array", async () => {
			const mockFetch = async () => {
				return new Response(JSON.stringify([]), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const transcript = await client.getDocumentTranscript("doc-123");

			expect(Array.isArray(transcript)).toBe(true);
			expect(transcript).toEqual([]);
			expect(transcript.length).toBe(0);
		});

		it("should handle null response gracefully", async () => {
			const mockFetch = async () => {
				return new Response("null", { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const transcript = await client.getDocumentTranscript("doc-123");

			expect(Array.isArray(transcript)).toBe(true);
			expect(transcript).toEqual([]);
		});
	});

	describe("getPanelTemplates", () => {
		it("should handle array response directly from API", async () => {
			const mockTemplates = [
				{
					id: "template-1",
					title: "Meeting Notes",
					sections: [
						{ id: "section-1", title: "Agenda", content: "" },
						{ id: "section-2", title: "Action Items", content: "" },
					],
				},
				{
					id: "template-2",
					title: "1:1 Notes",
					sections: [
						{ id: "section-3", title: "Discussion", content: "" },
						{ id: "section-4", title: "Feedback", content: "" },
					],
				},
			];

			const mockFetch = async (input: URL | Request, init?: RequestInit) => {
				const req = input instanceof Request ? input : new Request(input, init);
				expect(req.headers.get("Authorization")).toBe("Bearer test-token");

				// API returns array directly, not wrapped
				return new Response(JSON.stringify(mockTemplates), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const templates = await client.getPanelTemplates();

			expect(Array.isArray(templates)).toBe(true);
			expect(templates).toEqual(mockTemplates);
			expect(templates.length).toBe(2);
			expect(templates[0].title).toBe("Meeting Notes");
		});

		it("should return empty array when API returns empty array", async () => {
			const mockFetch = async () => {
				return new Response(JSON.stringify([]), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const templates = await client.getPanelTemplates();

			expect(Array.isArray(templates)).toBe(true);
			expect(templates).toEqual([]);
			expect(templates.length).toBe(0);
		});

		it("should handle null response gracefully", async () => {
			const mockFetch = async () => {
				return new Response("null", { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const templates = await client.getPanelTemplates();

			expect(Array.isArray(templates)).toBe(true);
			expect(templates).toEqual([]);
		});
	});

	describe("Error handling for both methods", () => {
		it("should throw authentication error when no token for getDocumentTranscript", async () => {
			const client = new GranolaClient();

			await expect(client.getDocumentTranscript("doc-123")).rejects.toThrow(
				"Authentication required",
			);
		});

		it("should throw authentication error when no token for getPanelTemplates", async () => {
			const client = new GranolaClient();

			await expect(client.getPanelTemplates()).rejects.toThrow(
				"Authentication required",
			);
		});
	});
});
