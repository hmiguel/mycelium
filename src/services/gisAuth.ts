const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPE = 'https://www.googleapis.com/auth/drive.file openid email';

export function redirectToGoogleSignIn(clientId: string): void {
  const redirectUri = window.location.origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });
  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function extractCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return null;
  // Clean the code from the URL
  history.replaceState(null, '', window.location.pathname);
  return code;
}

export function revokeToken(token: string): void {
  fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
}
