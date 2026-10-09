import { Component, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaLocationService } from 'src/app/services/pa-location.service';
import { AuthSession } from 'src/app/services/auth-session';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

// Lets an assistant start/end a shift. While a shift is on, the VPK Assistant Android app
// (window.VpkTracker, a native foreground service) posts a GPS fix to the API every minute.
@Component({
  selector: 'app-shift',
  templateUrl: './shift.page.html',
  styleUrls: ['./shift.page.scss'],
})
export class ShiftPage implements OnDestroy {
  paId: number = null;
  loading = true;
  busy = false;
  trackingAllowed = false;
  onShift = false;
  startedAt: Date = null;
  permission: 'none' | 'foreground' | 'all' = 'none';
  private pollTimer: any = null;

  constructor(
    private locationService: PaLocationService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
  ) {}

  // The native bridge only exists inside the VPK Assistant app, not in a normal browser.
  get tracker(): any { return (window as any).VpkTracker || null; }
  get inApp(): boolean { return !!this.tracker; }

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    this.paId = user && user.PAId ? Number(user.PAId) : null;
    await this.refresh();
  }

  ionViewWillLeave() { this.stopPoll(); }
  ngOnDestroy() { this.stopPoll(); }

  private async refresh() {
    this.loading = true;
    try {
      const s = await this.locationService.getShiftStatus(this.paId).toPromise();
      this.trackingAllowed = !!s.trackingAllowed;
      this.onShift = !!s.onShift;
      this.startedAt = s.startedAt ? this.utc(s.startedAt) : null;
      this.readPermission();
      if (this.inApp) {
        if (this.onShift && !this.tracker.isRunning() && this.permission !== 'none') {
          this.tracker.start(environment.BASE_URL, AuthSession.token || '', this.paId);
        } else if (!this.onShift && this.tracker.isRunning()) {
          this.tracker.stop();
        }
        if (AuthSession.token) { this.tracker.updateToken(AuthSession.token); }
      }
    } catch (e) {
      this.toastService.create('Could not load location status', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private readPermission() {
    this.permission = this.inApp ? (this.tracker.permissionState() as any) : 'none';
  }

  private utc(v: string): Date {
    return new Date(/Z|[+-]\d\d:\d\d$/.test(v) ? v : v + 'Z');
  }

  async startShift() {
    if (!this.inApp) {
      this.toastService.create('Open the VPK Assistant app to start a shift.', 'warning');
      return;
    }
    this.readPermission();
    if (this.permission === 'none') {
      const ok = await this.askForLocation();
      if (!ok) { return; }
    }
    this.busy = true;
    try {
      await this.locationService.startShift(this.paId).toPromise();
      if (!this.tracker.start(environment.BASE_URL, AuthSession.token || '', this.paId)) {
        await this.locationService.endShift(this.paId).toPromise();
        this.toastService.create('Location permission is needed to start a shift.', 'danger');
        return;
      }
      this.onShift = true;
      this.startedAt = new Date();
      this.readPermission();
      if (this.permission === 'foreground') { this.offerAllTheTime(); }
    } catch (e) {
      this.toastService.create('Could not start shift', 'danger');
    } finally {
      this.busy = false;
    }
  }

  // Android shows its own permission dialog; wait here until the assistant answers it.
  private askForLocation(): Promise<boolean> {
    this.tracker.requestPermissions();
    return new Promise(resolve => {
      let tries = 0;
      this.stopPoll();
      this.pollTimer = setInterval(() => {
        this.readPermission();
        tries++;
        if (this.permission !== 'none') { this.stopPoll(); resolve(true); }
        else if (tries > 60) {
          this.stopPoll();
          this.toastService.create('Location permission is needed to start a shift.', 'danger');
          resolve(false);
        }
      }, 1000);
    });
  }

  async allowAllTheTime() {
    this.tracker.requestPermissions();
    this.stopPoll();
    this.pollTimer = setInterval(() => { this.readPermission(); if (this.permission === 'all') { this.stopPoll(); } }, 1500);
  }

  private async offerAllTheTime() {
    const a = await this.alertController.create({
      header: 'Keep sharing in the background',
      message: 'For reliable sharing with the screen off, set location to "Allow all the time".',
      buttons: [{ text: 'Later', role: 'cancel' }, { text: 'Allow', handler: () => this.allowAllTheTime() }]
    });
    await a.present();
  }

  async endShift() {
    this.busy = true;
    try {
      await this.locationService.endShift(this.paId).toPromise();
      if (this.inApp) { this.tracker.stop(); }
      this.onShift = false;
      this.startedAt = null;
    } catch (e) {
      this.toastService.create('Could not end shift', 'danger');
    } finally {
      this.busy = false;
    }
  }

  private stopPoll() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }
}
