import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { from, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthSession } from './auth-session';

// Adds the login token to every call to our API, keeps the refreshed token the API hands back,
// and signs the user out when the API says the session is no longer valid (401).
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private signingOut = false;

  constructor(private storage: Storage, private injector: Injector) {
    AuthSession.watchClear(storage);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.indexOf(environment.BASE_URL) !== 0) {
      return next.handle(req);
    }
    if (AuthSession.loaded) {
      return this.send(req, next, AuthSession.token);
    }
    return from(AuthSession.load(this.storage)).pipe(
      switchMap(token => this.send(req, next, token))
    );
  }

  private send(req: HttpRequest<any>, next: HttpHandler, token: string | null): Observable<HttpEvent<any>> {
    const authed = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;
    return next.handle(authed).pipe(
      tap(
        (ev: HttpEvent<any>) => {
          if (ev instanceof HttpResponse) {
            const fresh = ev.headers.get('X-Auth-Token');
            if (fresh) { AuthSession.set(this.storage, fresh); }
          }
        },
        (err: any) => {
          // Wrong phone/PIN on the agent login also answers 401; that is not an expired session.
          const credentialCall = /\/agent\/(login|change-password)/i.test(req.url);
          if (err instanceof HttpErrorResponse && err.status === 401 && token && !credentialCall) {
            this.signOut();
          }
        }
      )
    );
  }

  private async signOut() {
    if (this.signingOut) { return; }
    this.signingOut = true;
    let loginRoute = '/login';
    try {
      const user: any = await this.storage.get(environment.USER);
      if (user && (user.UserType === 'PA' || user.UserType === 'MANAGER')) { loginRoute = '/loginpa'; }
    } catch (e) { /* default to the doctor login */ }
    await this.storage.clear();
    const router = this.injector.get(Router);
    router.navigate([loginRoute]).then(() => { window.location.reload(); });
  }
}
