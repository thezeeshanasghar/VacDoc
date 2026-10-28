import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ReferralService } from 'src/app/services/referral.service';
import { ToastService } from 'src/app/shared/toast.service';
import { nowInstant, parseInstant } from 'src/app/shared/time';

// Agent referrals waiting for the clinic to register the patient (two-step agent registration).
// Register opens Add Patient prefilled; the referral is closed from there once the patient is saved.
@Component({
  selector: 'app-referrals',
  templateUrl: './referrals.page.html',
  styleUrls: ['./referrals.page.scss'],
})
export class ReferralsPage {
  doctorId: number = 0;
  tab: string = 'new';          // new | stale | done
  items: any[] = [];            // everything the server returned for the current tab's status
  clinics: any[] = [];
  loaded = false;

  // Presets for Reject. "Other" asks for free text.
  readonly rejectReasons = ['Did not come', 'Wrong number', 'Already registered', 'Duplicate', 'Other'];
  // Open referrals older than this many days are shown under Stale instead of New.
  readonly staleDays = 30;

  constructor(
    private referralService: ReferralService,
    private storage: Storage,
    private router: Router,
    private toastService: ToastService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.load();
  }

  // 'New' and 'Stale' both come from the server's New status; Done is its own query.
  load() {
    if (!this.doctorId) { return; }
    const status = this.tab === 'done' ? 'Done' : 'New';
    this.referralService.getDoctorReferrals(this.doctorId, status).subscribe(
      (res: any) => {
        this.loaded = true;
        const data = res && res.ResponseData;
        this.items = (data && data.Items) || [];
        this.clinics = (data && data.Clinics) || [];
      },
      () => {
        this.loaded = true;
        this.items = [];
        this.toastService.create('Could not load referrals.', 'danger');
      }
    );
  }

  setTab(tab: string) {
    if (this.tab === tab) { return; }
    const needsReload = (tab === 'done') !== (this.tab === 'done');
    this.tab = tab;
    this.items = needsReload ? [] : this.items;
    if (needsReload) { this.loaded = false; this.load(); }
  }

  ageHours(r: any): number {
    const t = parseInstant(r.CreatedAt);
    return t ? Math.floor((nowInstant().getTime() - t.getTime()) / 3600000) : 0;
  }

  isStale(r: any): boolean {
    return this.ageHours(r) >= this.staleDays * 24;
  }

  get newItems(): any[] { return this.items.filter(r => r.Status === 'New' && !this.isStale(r)); }
  get staleItems(): any[] { return this.items.filter(r => r.Status === 'New' && this.isStale(r)); }
  get doneItems(): any[] { return this.items.filter(r => r.Status !== 'New'); }

  get visible(): any[] {
    return this.tab === 'new' ? this.newItems : this.tab === 'stale' ? this.staleItems : this.doneItems;
  }

  // Amber after 24h, red after 48h.
  ageClass(r: any): string {
    const h = this.ageHours(r);
    return h >= 48 ? 'red' : h >= 24 ? 'amber' : '';
  }

  ageLabel(r: any): string {
    const h = this.ageHours(r);
    if (h < 1) { return 'just now'; }
    if (h < 48) { return h + ' h'; }
    return Math.floor(h / 24) + ' d';
  }

  ageOfDob(dob: string): string {
    const d = parseInstant(dob);
    if (!d) { return ''; }
    const months = Math.floor((nowInstant().getTime() - d.getTime()) / (30.4375 * 86400000));
    if (months < 1) { return 'under 1 month'; }
    if (months < 24) { return months + ' month' + (months === 1 ? '' : 's'); }
    return Math.floor(months / 12) + ' years';
  }

  register(r: any) {
    this.router.navigate(['/members/child/add'], { queryParams: { referralId: r.Id } });
  }

  async reject(r: any) {
    const sheet = await this.actionSheetController.create({
      header: 'Reject referral',
      subHeader: 'The agent will see this reason.',
      buttons: this.rejectReasons.map(reason => ({
        text: reason,
        handler: () => { reason === 'Other' ? this.askOtherReason(r) : this.doReject(r, reason); }
      })).concat([{ text: 'Cancel', handler: () => {} }] as any)
    });
    await sheet.present();
  }

  private async askOtherReason(r: any) {
    const alert = await this.alertController.create({
      header: 'Reason',
      inputs: [{ name: 'detail', type: 'text', placeholder: 'Why is this being rejected?', attributes: { maxlength: 150 } }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: (d: any) => {
            const detail = ((d && d.detail) || '').trim();
            if (!detail) { this.toastService.create('Please enter a reason.', 'danger'); return false; }
            this.doReject(r, 'Other: ' + detail);
          }
        }
      ]
    });
    await alert.present();
  }

  private async doReject(r: any, reason: string) {
    const loading = await this.loadingController.create({ message: 'Rejecting...' });
    await loading.present();
    this.referralService.reject(r.Id, reason).subscribe(
      async (res: any) => {
        await loading.dismiss();
        if (res && res.IsSuccess) { this.toastService.create('Referral rejected.'); this.load(); }
        else { this.toastService.create((res && res.Message) || 'Could not reject.', 'danger'); }
      },
      async () => { await loading.dismiss(); this.toastService.create('Could not reject.', 'danger'); }
    );
  }

  async changeClinic(r: any) {
    const others = this.clinics.filter(c => c.Id !== r.ClinicId);
    if (others.length === 0) {
      this.toastService.create('There is no other clinic to move this to.', 'danger');
      return;
    }
    const sheet = await this.actionSheetController.create({
      header: 'Send to another clinic',
      subHeader: 'It leaves this list and appears in that clinic\'s.',
      buttons: others.map(c => ({ text: c.Name, handler: () => { this.doChangeClinic(r, c.Id); } }))
        .concat([{ text: 'Cancel', handler: () => {} }] as any)
    });
    await sheet.present();
  }

  private async doChangeClinic(r: any, clinicId: number) {
    this.referralService.changeClinic(r.Id, clinicId).subscribe(
      (res: any) => {
        if (res && res.IsSuccess) { this.toastService.create(res.Message || 'Moved.'); this.load(); }
        else { this.toastService.create((res && res.Message) || 'Could not move.', 'danger'); }
      },
      () => { this.toastService.create('Could not move.', 'danger'); }
    );
  }
}
