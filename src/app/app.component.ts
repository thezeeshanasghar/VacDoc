import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Storage } from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LoginService } from './services/login.service';
import { ToastService } from './shared/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // PA-assignment magic link (?t=...&aid=...) takes priority over the normal
      // session restore below — it's a one-shot auto-login, checked before assuming
      // any existing session should just continue.
      const token = this.route.snapshot.queryParamMap.get('t');
      if (token) {
        this.handlePaLinkLogin(token);
        return;
      }

      // read local storage and set authentication variable's
      this.storage.get(environment.DOCTOR_Id).then(value => {
        if (value) {
          let state = true;
          this.loginService.changeState(state);
          this.checkSessionValidity();
        }
      });

      this.platform.resume.subscribe(() => {
        this.checkSessionValidity();
      });

    });
  }

  // Consumes a PA-assignment email's magic link. Refuses to silently swap the
  // session on a shared clinic device: if a different PA is already logged in,
  // the link is rejected and the current session is left untouched rather than
  // overwritten — the PA has to log out manually first.
  async handlePaLinkLogin(token: string) {
    const existingUser: any = await this.storage.get(environment.USER);
    const existingUserId = await this.storage.get(environment.USER_Id);

    this.loginService.linkLoginPa(token).subscribe(async (res: any) => {
      if (!res || !res.IsSuccess) {
        this.toastService.create((res && res.Message) || 'This link is invalid or has expired.', 'danger');
        this.router.navigate(['/loginpa']);
        return;
      }

      if (existingUserId && existingUser && existingUser.PAId !== res.ResponseData.PAId) {
        this.toastService.create(
          `This link is for ${res.ResponseData.Name}, but you're logged in as ${existingUser.Name}. Log out first to use it.`,
          'danger'
        );
        this.router.navigate(['/members/pa/assignments']);
        return;
      }

      await this.storage.set(environment.USER, res.ResponseData);
      await this.storage.set(environment.DOCTOR_Id, res.ResponseData.DoctorId);
      await this.storage.set(environment.USER_Id, res.ResponseData.Id);
      await this.storage.set(environment.SECURITY_STAMP, res.ResponseData.SecurityStamp);
      this.loginService.changeState(true);
      this.router.navigate(['/members/pa/assignments']).then(() => {
        window.location.reload();
      });
    }, () => {
      this.toastService.create('Could not open this link. Please try again.', 'danger');
      this.router.navigate(['/loginpa']);
    });
  }

  // Password changed on another device rotates the stamp on the server; a stale local
  // stamp means this device must be force-logged-out.
  checkSessionValidity() {
    this.storage.get(environment.USER_Id).then(userId => {
      if (!userId) {
        return;
      }
      this.storage.get(environment.SECURITY_STAMP).then(securityStamp => {
        if (!securityStamp) {
          // Logged in before SECURITY_STAMP was cached locally — nothing valid to
          // send server auth checks, so force a re-login to pick up a real stamp.
          this.forceLogout();
          return;
        }
        this.loginService.validateSession(userId, securityStamp).subscribe(res => {
          if (res.IsSuccess && res.ResponseData === false) {
            this.forceLogout();
          }
        });
      });
    });
  }

  forceLogout() {
    this.storage.clear().then(() => {
      this.loginService.changeState(false);
      this.router.navigate(['/login']).then(() => {
        window.location.reload();
      });
    });
  }
}
