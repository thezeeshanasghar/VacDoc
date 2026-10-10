import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

// Push registration for the VPK Assistant Android app. That app's native shell exposes window.VpkPush
// (FCM token + notification permission); in a normal browser the object is missing and every call here
// does nothing. The API decides who gets what; this only hands it the phone's token after login.
@Injectable({ providedIn: 'root' })
export class PushService {
  private token = '';
  private timer: any = null;

  constructor(private http: HttpClient) {}

  private get native(): any { return (window as any).VpkPush || null; }

  start() {
    const n = this.native;
    if (!n) { return; }
    try { if (!n.permissionGranted()) { n.requestPermission(); } } catch (e) { return; }
    // Firebase can take a few seconds to hand out the first token; try for up to a minute.
    let tries = 0;
    clearInterval(this.timer);
    const attempt = () => {
      tries++;
      let t = '';
      try { t = n.getToken() || ''; } catch (e) { /* ignore */ }
      if (t) {
        clearInterval(this.timer);
        if (t !== this.token) {
          this.token = t;
          this.http.post(`${environment.BASE_URL}device/register`, { Token: t, Platform: 'android', AppFlavor: 'assistant' })
            .subscribe(() => {}, () => { this.token = ''; });
        }
      } else if (tries >= 20) {
        clearInterval(this.timer);
      }
    };
    this.timer = setInterval(attempt, 3000);
    attempt();
  }

  // Sent with the login token, so call it before the session is cleared (no need to wait for the reply).
  stop() {
    clearInterval(this.timer);
    if (!this.token) { return; }
    const t = this.token;
    this.token = '';
    this.http.post(`${environment.BASE_URL}device/unregister`, { Token: t }).subscribe(() => {}, () => {});
  }
}
