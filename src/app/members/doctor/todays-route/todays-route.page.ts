import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { addDays, formatDay, today as todayDay } from 'src/app/shared/time';

// Doctor's live board for scheduled home visits (PA_DAILY_ROUTE_SPEC.md v3.1). State is derived on the
// server from the PKT clock and recorded payments; this page never decides late / in-window itself.
@Component({
  selector: 'app-todays-route',
  templateUrl: './todays-route.page.html',
  styleUrls: ['./todays-route.page.scss']
})
export class TodaysRoutePage {
  doctorId: number | null = null;
  callerUserId: number | null = null;
  securityStamp: string | null = null;
  requestingManagerId: number | null = null;
  isManager = false;

  date = todayDay();
  loading = false;
  pktNow = '';
  pktToday = '';
  dayCounts: { [d: string]: number } = {};
  hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  atClinicCount = 0;
  stops: any[] = [];

  editing: any = null;   // { stop, date, windowStart, windowMinutes, area, busy }
  lengths = [15, 30, 45, 60, 90, 120, 180, 240];

  constructor(
    private paService: PaService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    const storedDoctorId = await this.storage.get(environment.DOCTOR_Id);
    if (storedDoctorId) { this.doctorId = Number(storedDoctorId); }
    this.callerUserId = user && user.Id ? Number(user.Id) : null;
    this.securityStamp = await this.storage.get(environment.SECURITY_STAMP);
    if (user && user.UserType === 'MANAGER') {
      this.isManager = true;
      this.requestingManagerId = Number(user.ManagerId);
    }
    this.load();
  }

  load() {
    if (!this.doctorId) { return; }
    this.loading = true;
    this.paService.getRoute(this.doctorId, this.date, this.isManager ? undefined : this.callerUserId, this.securityStamp, this.requestingManagerId || undefined).subscribe(
      (res: any) => {
        this.loading = false;
        if (res && res.IsSuccess) {
          this.stops = res.ResponseData.Stops || [];
          this.pktNow = res.ResponseData.PktNow;
          this.pktToday = res.ResponseData.PktToday || '';
          this.dayCounts = res.ResponseData.DayCounts || {};
          this.atClinicCount = res.ResponseData.AtClinicCount || 0;
        } else {
          this.toastService.create((res && res.Message) || 'Could not load the route', 'danger');
        }
      },
      () => { this.loading = false; this.toastService.create('Could not load the route', 'danger'); }
    );
  }

  // ---- day navigation
  get isToday(): boolean { return this.date === todayDay(); }
  get dayLabel(): string { return (this.isToday ? 'Today, ' : '') + formatDay(this.date, 'EEE dd MMM yyyy'); }
  shiftDay(n: number) { this.date = addDays(this.date, n); this.load(); }
  goToday() { this.date = todayDay(); this.load(); }
  onDatePicked(d: string) { if (d) { this.date = d; this.load(); } }
  pickDay(d: string) { this.date = d; this.load(); }

  // ---- day strip (today + 21 days, counts from the server)
  get dayStrip(): any[] {
    const base = this.pktToday || todayDay();
    const out: any[] = [];
    for (let i = 0; i <= 21; i++) {
      const d = addDays(base, i);
      out.push({ date: d, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDay(d, 'EEE d MMM'), count: this.dayCounts[d] || 0 });
    }
    return out;
  }
  get dayHead(): string { return this.isToday ? 'Today' : formatDay(this.date, 'EEE d MMM'); }
  get lateCount(): number { return this.stops.filter(s => s.State === 'late').length; }
  paDone(pa: any): number { return pa.stops.filter((s: any) => s.State === 'completed').length; }
  firstName(n: string): string { return (n || '').split(' ')[0]; }

  // ---- timeline (07:00 to 19:00, same scale as the approved mock)
  private readonly T0 = 420;
  private readonly T1 = 1140;
  pct(m: number): number { return Math.max(0, Math.min(100, (m - this.T0) / (this.T1 - this.T0) * 100)); }
  private mins(hm: string): number { const p = String(hm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  get nowMin(): number | null { return this.pktNow ? this.mins(this.pktNow) : null; }
  get timeline(): any[] {
    return this.pas.map(pa => {
      const ends: number[] = [];
      const items: any[] = [];
      let tbd = 0;
      pa.stops.forEach((s: any) => {
        if (!s.WindowStart) { tbd++; return; }
        const st = this.mins(s.WindowStart);
        const en = st + (s.WindowMinutes || 60);
        let lane = 0;
        while (ends[lane] !== undefined && ends[lane] > st) { lane++; }
        ends[lane] = en;
        items.push({ s: s, lane: lane, left: this.pct(st), width: this.pct(en) - this.pct(st) });
      });
      return { pa: pa, items: items, tbd: tbd, lanes: Math.max(1, ends.length), done: this.paDone(pa) };
    });
  }

  // ---- grouping and totals (cash-confirmed stops leave the list but still count)
  get listed(): any[] { return this.stops.filter(s => !s.CashConfirmed); }
  get pas(): any[] {
    const map: { [k: string]: any } = {};
    this.listed.forEach(s => {
      if (!map[s.PaId]) { map[s.PaId] = { PaId: s.PaId, PaName: s.PaName, stops: [] }; }
      map[s.PaId].stops.push(s);
    });
    return Object.keys(map).map(k => map[k]);
  }
  get total(): number { return this.stops.length; }
  get doneCount(): number { return this.stops.filter(s => s.State === 'completed').length; }

  // ---- display
  stateLabel(s: any): string {
    switch (s.State) {
      case 'completed': return 'Completed';
      case 'paidPending': return 'Paid, visit pending';
      case 'refusalRequested': return 'Refusal requested';
      case 'late': return 'Late';
      case 'in': return 'In window';
      case 'next': return 'Next';
      default: return s.WindowStart ? 'Queued' : 'Time TBD';
    }
  }
  private hm(iso: string): string { return iso ? String(iso).slice(11, 16) : ''; }
  whoLine(s: any): string {
    const v = (s.Doses || []).map((d: any) => d.Name + (d.Given ? ' ✓' : '')).join(', ');
    return (s.Area ? s.Area + ' · ' : '') + v;
  }
  subline(s: any): string {
    if (s.State === 'completed') { return s.CompletedAt ? 'completed ' + this.hm(s.CompletedAt) : 'completed'; }
    if (s.State === 'refusalRequested') { return 'refusal requested'; }
    if (!this.isToday || !s.WindowStart || this.nowMin === null) { return s.WindowStart ? '' : 'time to be confirmed'; }
    const st = this.mins(s.WindowStart);
    const en = st + (s.WindowMinutes || 60);
    if (s.State === 'late') { return 'ended ' + (this.nowMin - en) + ' min ago'; }
    if (this.nowMin >= st && this.nowMin < en) { return 'ends in ' + (en - this.nowMin) + ' min'; }
    return st > this.nowMin ? 'starts in ' + (st - this.nowMin) + ' min' : '';
  }
  windowText(s: any): string { return s.WindowStart ? s.WindowStart + ' to ' + s.WindowEnd : 'Time TBD'; }
  papersNote(s: any): string {
    if (!s.PapersDate) { return ''; }
    const given = String(s.PapersDate).slice(0, 10);
    return given !== this.date ? 'Papers dated ' + formatDay(given, 'dd MMM') : '';
  }
  canMoveUp(s: any, pa: any): boolean { return s.State !== 'completed' && pa.stops.indexOf(s) > 0; }
  canMoveDown(s: any, pa: any): boolean { return s.State !== 'completed' && pa.stops.indexOf(s) < pa.stops.length - 1; }

  // ---- doctor actions
  private body(extra?: any): any {
    return Object.assign({ DoctorId: this.doctorId, CallerUserId: this.callerUserId, SecurityStamp: this.securityStamp }, extra || {});
  }
  private after(res: any, okMsg: string) {
    if (res && res.IsSuccess) { if (okMsg) { this.toastService.create(okMsg); } this.load(); }
    else { this.toastService.create((res && res.Message) || 'Failed', 'danger'); }
  }
  private failed() { this.toastService.create('Request failed', 'danger'); }

  move(s: any, dir: 'up' | 'down', confirm = false) {
    this.paService.moveVisit(s.AssignmentId, this.body({ Direction: dir, Confirm: confirm })).subscribe(async (res: any) => {
      if (res && res.NeedsConfirm) {
        const a = await this.alertController.create({
          header: 'Change the time?', message: res.Message,
          buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Move', handler: () => { this.move(s, dir, true); } }]
        });
        await a.present();
      } else if (res && res.NeedsTime) {
        this.toastService.create(res.Message, 'warning');
        this.openEdit(s);
      } else { this.after(res, ''); }
    }, () => this.failed());
  }

  openEdit(s: any) {
    this.editing = { stop: s, date: this.date, windowStart: s.WindowStart || '', windowMinutes: s.WindowMinutes || 60, area: s.Area || '', busy: false };
  }
  closeEdit() { this.editing = null; }
  saveEdit() {
    const e = this.editing;
    if (!e || e.busy) { return; }
    e.busy = true;
    this.paService.editVisit(e.stop.AssignmentId, this.body({
      TargetDate: e.date, WindowStart: e.windowStart || null, WindowMinutes: e.windowMinutes, Area: (e.area || '').trim() || null
    })).subscribe((res: any) => {
      e.busy = false;
      if (res && res.IsSuccess) { this.editing = null; }
      this.after(res, 'Visit updated');
    }, () => { e.busy = false; this.failed(); });
  }

  async completeFor(s: any) {
    const a = await this.alertController.create({
      header: 'Mark visit completed?', message: 'For ' + s.ChildName + '. Payment is recorded; the PA did not tap Visit completed. Recorded as done by you.',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Mark completed', handler: () => {
        this.paService.completeVisit(s.AssignmentId, this.callerUserId, this.securityStamp).subscribe((res: any) => this.after(res, 'Visit completed'), () => this.failed());
      } }]
    });
    await a.present();
  }

  reopen(s: any) {
    this.paService.reopenVisit(s.AssignmentId, this.body()).subscribe((res: any) => this.after(res, 'Reopened'), () => this.failed());
  }

  async reverse(s: any) {
    const a = await this.alertController.create({
      header: 'Reverse this visit?',
      message: 'This ungives the doses, returns stock and deletes the invoice. A printed invoice the family holds may still be in their hands. This cannot be undone.',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Reverse visit', role: 'destructive', handler: () => {
        this.paService.deleteAssignment(s.AssignmentId, this.doctorId, 'FullReset', 'Reversed from Today\'s Route').subscribe((res: any) => this.after(res, 'Visit reversed'), () => this.failed());
      } }]
    });
    await a.present();
  }

  // Share text is built live from the current board and never stored. It states the window only,
  // never an ETA, and claims completion only for a PA-recorded one.
  shareText(s: any): string {
    let t = 'Assalam o Alaikum. ';
    if (s.State === 'completed') { t += 'Our assistant has completed the visit for ' + s.ChildName + '. '; }
    else if (s.WindowStart) { t += 'The visit window for ' + s.ChildName + ' is ' + s.WindowStart + ' to ' + s.WindowEnd + ' on ' + formatDay(this.date, 'dd MMM') + '. This is a window, not an exact time. We will update you if it changes.'; }
    else { t += 'We will confirm the visit time for ' + s.ChildName + ' shortly.'; }
    return t.trim();
  }
  share(s: any) {
    const text = this.shareText(s);
    const nav: any = navigator;
    if (nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(text).then(() => this.toastService.create('Message copied. Paste it into WhatsApp.'), () => this.toastService.create(text, 'warning', false, 8000));
    } else { this.toastService.create(text, 'warning', false, 8000); }
  }
}
