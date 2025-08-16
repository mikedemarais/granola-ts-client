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

describe("GranolaClient backwards compatibility", () => {
	let originalFetch: typeof fetch;
	let consoleWarnSpy: typeof console.warn;
	let warnMessages: string[] = [];

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		warnMessages = [];
		consoleWarnSpy = console.warn;
		// biome-ignore lint/suspicious/noExplicitAny: matching console.warn signature
		console.warn = (message?: any, ...optionalParams: any[]) => {
			warnMessages.push(message);
		};
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		console.warn = consoleWarnSpy;
	});

	describe("Constructor patterns", () => {
		it("should work with v0.3.0 constructor style (string token)", () => {
			const client = new GranolaClient("test-token");
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(0); // No warning when token provided
		});

		it("should work with v0.11.0 object style with apiKey", () => {
			const client = new GranolaClient({ apiKey: "test-token" });
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(0); // No warning when token provided
		});

		it("should work with v0.11.0 object style with token property", () => {
			const client = new GranolaClient({ token: "test-token" });
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(0); // No warning when token provided
		});

		it("should work with v0.11.0 object style with baseUrl and httpOpts", () => {
			const client = new GranolaClient({
				apiKey: "test-token",
				baseUrl: "https://custom.api.com",
				httpOpts: { timeout: 10000 },
			});
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(0);
		});

		it("should work with no arguments (for setToken pattern)", () => {
			const client = new GranolaClient();
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(1);
			expect(warnMessages[0]).toContain("No authentication token provided");
		});

		it("should work with setToken after construction", () => {
			const client = new GranolaClient();
			expect(warnMessages.length).toBe(1);
			client.setToken("test-token");
			expect(client).toBeDefined();
		});

		it("should handle empty object (common mistake)", () => {
			const client = new GranolaClient({});
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(1);
			expect(warnMessages[0]).toContain("No authentication token provided");
		});

		it("should work with old positional arguments pattern", () => {
			const client = new GranolaClient("test-token", "https://custom.api.com", {
				timeout: 10000,
			});
			expect(client).toBeDefined();
			expect(warnMessages.length).toBe(0);
		});
	});

	describe("Authentication validation", () => {
		it("should throw error when making API calls without token", async () => {
			const client = new GranolaClient();

			await expect(client.getWorkspaces()).rejects.toThrow(
				"Authentication required",
			);
		});

		it("should throw error for getDocuments without token", async () => {
			const client = new GranolaClient();

			await expect(client.getDocuments()).rejects.toThrow(
				"Authentication required",
			);
		});

		it("should throw error for getDocumentTranscript without token", async () => {
			const client = new GranolaClient();

			await expect(client.getDocumentTranscript("doc-id")).rejects.toThrow(
				"Authentication required",
			);
		});

		it("should throw error for getPanelTemplates without token", async () => {
			const client = new GranolaClient();

			await expect(client.getPanelTemplates()).rejects.toThrow(
				"Authentication required",
			);
		});

		it("should make successful API call with token from constructor", async () => {
			const mockFetch = async (input: URL | Request, init?: RequestInit) => {
				const req = input instanceof Request ? input : new Request(input, init);
				expect(req.headers.get("Authorization")).toBe("Bearer test-token");
				return new Response(
					JSON.stringify({
						workspaces: [{ id: "ws1", name: "Test Workspace" }],
					}),
					{ status: 200 },
				);
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const result = await client.getWorkspaces();
			expect(result).toBeDefined();
			expect(result.workspaces).toHaveLength(1);
		});

		it("should make successful API call after setToken", async () => {
			const mockFetch = async (input: URL | Request, init?: RequestInit) => {
				const req = input instanceof Request ? input : new Request(input, init);
				expect(req.headers.get("Authorization")).toBe("Bearer new-token");
				return new Response(
					JSON.stringify({
						workspaces: [{ id: "ws1", name: "Test Workspace" }],
					}),
					{ status: 200 },
				);
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient();
			client.setToken("new-token");
			const result = await client.getWorkspaces();
			expect(result).toBeDefined();
			expect(result.workspaces).toHaveLength(1);
		});
	});

	describe("Legacy method name compatibility", () => {
		it("should support old v1_get_workspaces method name", async () => {
			const mockFetch = async () => {
				return new Response(
					JSON.stringify({
						workspaces: [{ id: "ws1", name: "Test" }],
					}),
					{ status: 200 },
				);
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			// @ts-ignore - testing legacy method name
			const result = await client.v1_get_workspaces();
			expect(result).toBeDefined();
			expect(result.workspaces).toHaveLength(1);
		});

		it("should support old v2_get_documents method name", async () => {
			const mockFetch = async () => {
				return new Response(
					JSON.stringify({
						documents: [{ id: "doc1", title: "Test Doc" }],
					}),
					{ status: 200 },
				);
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			// @ts-ignore - testing legacy method name
			const result = await client.v2_get_documents();
			expect(result).toBeDefined();
			expect(result.documents).toHaveLength(1);
		});

		it("should support old v1_get_document_transcript method name", async () => {
			const mockFetch = async () => {
				return new Response(
					JSON.stringify({
						transcript: [{ text: "Hello", timestamp: 0 }],
					}),
					{ status: 200 },
				);
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			// @ts-ignore - testing legacy method name
			const result = await client.v1_get_document_transcript({
				document_id: "doc1",
			});
			expect(result).toBeDefined();
			expect(result.transcript).toHaveLength(1);
		});
	});

	describe("Error handling", () => {
		it("should provide meaningful error for empty transcript response", async () => {
			const mockFetch = async () => {
				return new Response(JSON.stringify({}), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const result = await client.getDocumentTranscript("doc-id");
			expect(result).toEqual([]); // Should return empty array, not throw
		});

		it("should provide meaningful error for empty panel templates response", async () => {
			const mockFetch = async () => {
				return new Response(JSON.stringify({}), { status: 200 });
			};
			// @ts-ignore - mock fetch for testing
			globalThis.fetch = mockFetch;

			const client = new GranolaClient("test-token");
			const result = await client.getPanelTemplates();
			expect(result).toEqual([]); // Should return empty array, not throw
		});
	});
});
