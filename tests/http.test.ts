// tests/http.test.ts
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { Http } from "../src/http";

// Set NODE_ENV for testing
beforeAll(() => {
	process.env.NODE_ENV = "test";
});

describe("Http client", () => {
	let originalFetch: typeof fetch;
	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	it("should perform POST request and parse JSON response", async () => {
		let called = false;
		const mockFetch = async (input: URL | Request, init?: RequestInit) => {
			called = true;
			const req = input instanceof Request ? input : new Request(input, init);
			expect(req.method).toBe("POST");
			expect(req.headers.get("Authorization")).toBe("Bearer token");
			expect(req.headers.get("Content-Type")).toBe("application/json");
			const body = await req.text();
			expect(body).toBe(JSON.stringify({ foo: "bar" }));
			return new Response(JSON.stringify({ data: 123 }), { status: 200 });
		};
		// @ts-ignore - mock fetch for testing
		globalThis.fetch = mockFetch;

		const http = new Http("token");
		const data = await http.post<{ data: number }>("/test", { foo: "bar" });
		expect(data).toEqual({ data: 123 });
		expect(called).toBe(true);
		globalThis.fetch = originalFetch;
	});

	it("should retry on server errors and succeed", async () => {
		let attempts = 0;
		const mockFetch = async () => {
			attempts++;
			if (attempts < 2) {
				return new Response("error", { status: 500 });
			}
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		};
		// @ts-ignore - mock fetch for testing
		globalThis.fetch = mockFetch;

		const http = new Http("token", undefined, { retries: 1, timeout: 100 });
		const data = await http.post<{ ok: boolean }>("/retry");
		expect(data).toEqual({ ok: true });
		expect(attempts).toBe(2);
		globalThis.fetch = originalFetch;
	});

	it("should include client identification headers by default", async () => {
		let headers: Headers | undefined;
		const mockFetch = async (input: URL | Request, init?: RequestInit) => {
			const req = input instanceof Request ? input : new Request(input, init);
			headers = req.headers;
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		};
		// @ts-ignore - mock fetch for testing
		globalThis.fetch = mockFetch;

		const http = new Http("token");

		await http.post("/test");

		expect(headers?.get("X-App-Version")).toBe("6.4.0");
		expect(headers?.get("X-Client-Type")).toBe("electron");
		expect(headers?.get("X-Client-Platform")).toBe("darwin");
		expect(headers?.get("X-Client-Architecture")).toBe("arm64");
		expect(headers?.get("X-Client-Id")).toBe("granola-electron-6.4.0");
		const ua = headers?.get("User-Agent") ?? "";
		expect(ua).toContain("Granola/6.4.0");
		expect(ua).toContain("Electron/33.4.5");
		expect(ua).toContain("Chrome/130.0.6723.191");
		expect(ua).toContain("Node/20.18.3");

		globalThis.fetch = originalFetch;
	});

	it("should allow customizing all client identification parameters", async () => {
		let headers: Headers | undefined;
		const mockFetch = async (input: URL | Request, init?: RequestInit) => {
			const req = input instanceof Request ? input : new Request(input, init);
			headers = req.headers;
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		};
		// @ts-ignore - mock fetch for testing
		globalThis.fetch = mockFetch;

		const http = new Http("token", undefined, {
			appVersion: "7.0.0",
			clientType: "desktop",
			clientPlatform: "win32",
			clientArchitecture: "x64",
			electronVersion: "40.0.0",
			chromeVersion: "140.0.0.0",
			nodeVersion: "21.0.0",
			osVersion: "11.0.0",
			osBuild: "build123",
		});

		await http.post("/test");

		expect(headers?.get("X-App-Version")).toBe("7.0.0");
		expect(headers?.get("X-Client-Type")).toBe("desktop");
		expect(headers?.get("X-Client-Platform")).toBe("win32");
		expect(headers?.get("X-Client-Architecture")).toBe("x64");
		expect(headers?.get("X-Client-Id")).toBe("granola-desktop-7.0.0");
		expect(headers?.get("User-Agent")).toBe(
			"Granola/7.0.0 Electron/40.0.0 Chrome/140.0.0.0 Node/21.0.0 (macOS 11.0.0 build123)",
		);

		globalThis.fetch = originalFetch;
	});
});
