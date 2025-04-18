// tests/http.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { Http } from '../src/http';

describe('Http client', () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  it('should perform POST request and parse JSON response', async () => {
    let called = false;
    const mockFetch = async (input: URL | RequestInfo, init?: RequestInit) => {
      called = true;
      expect(init?.method).toBe('POST');
      expect((init?.headers as any)['Authorization']).toBe('Bearer token');
      expect((init?.headers as any)['Content-Type']).toBe('application/json');
      const body = init?.body as string;
      expect(body).toBe(JSON.stringify({ foo: 'bar' }));
      return new Response(JSON.stringify({ data: 123 }), { status: 200 });
    };
    // @ts-ignore - mock fetch for testing
    globalThis.fetch = mockFetch;
    
    const http = new Http('token');
    const data = await http.post<{ data: number }>('/test', { foo: 'bar' });
    expect(data).toEqual({ data: 123 });
    expect(called).toBe(true);
    globalThis.fetch = originalFetch;
  });

  it('should retry on server errors and succeed', async () => {
    let attempts = 0;
    const mockFetch = async () => {
      attempts++;
      if (attempts < 2) {
        return new Response('error', { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    // @ts-ignore - mock fetch for testing
    globalThis.fetch = mockFetch;
    
    const http = new Http('token', undefined, { retries: 1, timeout: 100 });
    const data = await http.post<{ ok: boolean }>('/retry');
    expect(data).toEqual({ ok: true });
    expect(attempts).toBe(2);
    globalThis.fetch = originalFetch;
  });
});