export interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_ORIGINS: string; // comma-separated, e.g. "https://draw.lixo.dev,http://localhost:5173"
}

const CORS_HEADERS = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

    if (!allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS(origin) });
    }

    if (request.method !== 'POST' || new URL(request.url).pathname !== '/mycelium/auth/token') {
      return new Response('Not Found', { status: 404 });
    }

    const body = await request.json<{ code?: string; redirect_uri?: string }>();
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: 'Missing code or redirect_uri' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
      });
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
      });
    }

    const data = await response.json<{ access_token: string; expires_in: number }>();
    return new Response(JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
    });
  },
};
