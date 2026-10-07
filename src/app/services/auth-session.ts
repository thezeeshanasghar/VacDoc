import { Storage } from '@ionic/storage';

// The login token the API issues at sign-in. Kept in memory so every request and every
// plain download link can read it synchronously, and mirrored into Ionic Storage so it
// survives an app restart. Sent to the API as "Authorization: Bearer <token>"; links that
// cannot carry a header (window.open, native downloads) use withToken() instead.
const KEY = 'AuthToken';

export class AuthSession {
  static token: string | null = null;
  static loaded = false;
  private static watching = false;

  // Reads the saved token once (first request after the app starts).
  static async load(storage: Storage): Promise<string | null> {
    try {
      AuthSession.token = (await storage.get(KEY)) || null;
    } catch (e) {
      AuthSession.token = null;
    }
    AuthSession.loaded = true;
    return AuthSession.token;
  }

  // Call right after a successful login, link-login or token refresh.
  static async set(storage: Storage, token: string | null): Promise<void> {
    AuthSession.token = token || null;
    AuthSession.loaded = true;
    try {
      if (token) { await storage.set(KEY, token); } else { await storage.remove(KEY); }
    } catch (e) { /* the in-memory token still works for this session */ }
  }

  // Signing out anywhere in the app calls storage.clear(); make that drop the in-memory token too.
  static watchClear(storage: Storage): void {
    if (AuthSession.watching) { return; }
    AuthSession.watching = true;
    const original = storage.clear.bind(storage);
    storage.clear = function () {
      AuthSession.token = null;
      AuthSession.loaded = true;
      return original();
    };
  }

  // For URLs opened outside HttpClient (window.open, native file downloads).
  static withToken(url: string): string {
    if (!AuthSession.token) { return url; }
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + encodeURIComponent(AuthSession.token);
  }
}
