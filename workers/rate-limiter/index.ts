/**
 * Cloudflare Worker — IP + user rate limiting for Sanad API routes.
 * Deploy separately and route protected paths through this worker.
 */

import { applyRateLimit, type Env } from './utils';

export type { Env };

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const result = await applyRateLimit(request, env);

    if (result instanceof Response) {
      return result;
    }

    const response = await fetch(request);
    const headers = new Headers(response.headers);
    if (result.remaining >= 0) {
      headers.set('X-RateLimit-Remaining', String(result.remaining));
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default worker;
