import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthSession } from './auth-session';

// Push registration for the VPK Assistant Android app. That app's native shell exposes window.VpkPush
// (FCM token + notification permission); in a normal browser the object is missing and every call here
// does nothing. The API decides who gets what; this only keeps the server's copy of the phone's token
// correct: it retries with back-off until the server accepts it, re-sends it when Firebase rotates it,
// refreshes it every time the app comes back to the front, and removes it on every sign-out.
@Injectable({ providedIn: 'root' })
export class PushService {
  private registered = '';   // the token the server last accepted
  private timer: any = null;
  private active = false;    // true between start() (logged in) and stop() (signed out)
  private waits = 0;         // polls with no token yet
  private failures = 0;      // consecutive register failures
  private lastStopAt = 0;
  private resumeBound = false;

  constructor(private http: HttpClient) {
    // Every sign-out path ends in storage.clear(); unregister before the login token is dropped.
    AuthSession.beforeClear = () => this.stop();
  }

  private get native(): any { return (window as any).VpkPush || null; }

  start() {
    const n = this.native;
    if (!n) { return; }
    try { if (!n.permissionGranted()) { n.requestPermission(); } } catch (e) { return; }
    this.active = true;
    this.waits = 0;
    this.failures = 0;
    this.bindResume();
    this.attempt(true);
  }

  // Coming back to the app re-sends the token (keeps the server's last-seen fresh and repairs a missed rotation).
  private bindResume() {
    if (this.resumeBound) { return; }
    this.resumeBound = true;
    document.addEventListener('visibilitychange', () => {
      if (this.active && document.visibilityState === 'visible') { this.failures = 0; this.attempt(true); }
    });
  }

  private next(ms: number) {
    clearTimeout(this.timer);
    if (!this.active) { return; }
    this.timer = setTimeout(() => this.attempt(false), ms);
  }

  private fail() {
    this.failures++;
    const steps = [5000, 15000, 60000];
    this.next(this.failures <= steps.length ? steps[this.failures - 1] : 300000);
  }

  private attempt(force: boolean) {
    const n = this.native;
    if (!n || !this.active) { return; }
    let t = '';
    try { t = n.getToken() || ''; } catch (e) { /* ignore */ }
    if (!t) {
      // Firebase can take a while to hand out the first token: poll every 3 s for a minute, then every minute.
      this.waits++;
      this.next(this.waits < 20 ? 3000 : 60000);
      return;
    }
    if (t === this.registered && !force) { this.next(60000); return; }  // still polling to notice a rotated token
    this.http.post(`${environment.BASE_URL}device/register`, { Token: t, Platform: 'android', AppFlavor: 'assistant' })
      .subscribe(
        (r: any) => {
          if (r && r.IsSuccess === false) { this.fail(); return; }
          this.registered = t;
          this.failures = 0;
          this.next(60000);
        },
        () => this.fail()
      );
  }

  // Runs while the login token is still valid (called from AuthSession just before it is cleared).
  // The request is sent with fetch keepalive so it survives the page reload that follows a sign-out.
  stop() {
    const wasActive = this.active;
    this.active = false;
    clearTimeout(this.timer);
    const now = Date.now();
    if (!wasActive || now - this.lastStopAt < 2000) { this.registered = ''; return; }
    this.lastStopAt = now;
    let t = this.registered;
    try { const n = this.native; if (n) { t = n.getToken() || t; } } catch (e) { /* ignore */ }
    this.registered = '';
    if (!t) { return; }
    const url = `${environment.BASE_URL}device/unregister`;
    const body = JSON.stringify({ Token: t });
    try {
      const f = (window as any).fetch;
      if (f) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (AuthSession.token) { headers['Authorization'] = 'Bearer ' + AuthSession.token; }
        f(url, { method: 'POST', headers: headers, body: body, keepalive: true }).catch(() => {});
        return;
      }
    } catch (e) { /* fall through to HttpClient */ }
    this.http.post(url, { Token: t }).subscribe(() => {}, () => {});
  }
}
