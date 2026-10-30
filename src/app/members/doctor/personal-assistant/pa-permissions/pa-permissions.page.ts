import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-pa-permissions',
  templateUrl: './pa-permissions.page.html',
  styleUrls: ['./pa-permissions.page.scss'],
})
export class PaPermissionsPage implements OnInit {
  paId: number = 0;
  paName: string = '';
  perm: any = {};
  // Last server-confirmed state; dirty = any key in `perm` that differs from it.
  saved: any = {};
  loaded = false;
  loadFailed = false;
  saving = false;
  query = '';
  activeCat = 'all';
  toastText = '';
  canUndo = false;
  private undoSnapshot: any = null;
  private toastTimer: any;

  // Informational tags only: they mirror what the flag already does, no new access rules.
  highImpact: any = {
    DeletePatient: 'Deletes patient records',
    DeleteClinic: 'Deletes a clinic',
    DeleteFollowUp: 'Deletes follow-ups',
    UngiveVaccine: 'Reverses a given vaccine',
    BulkUngiveVaccines: 'Reverses given vaccines in bulk',
    UnskipVaccine: 'Reverses a skip',
    StockAdjust: 'Changes stock counts',
  };

  sections = [
    {
      key: 'patient',
      label: 'Patient Management',
      icon: 'people-outline',
      fields: [
        { key: 'SearchPatient',    label: 'Search patient' },
        { key: 'AddPatient',       label: 'Add new patient' },
        { key: 'EditPatient',      label: 'Edit patient details' },
        { key: 'DeletePatient',    label: 'Delete patient' },
        { key: 'ActivatePatient',  label: 'Activate patient' },
        { key: 'DeactivatePatient',label: 'Deactivate patient' },
        { key: 'DownloadPidPdf',   label: 'Download Patient ID PDF' },
        { key: 'CallPatient',      label: 'Call patient phone' },
        { key: 'SendSmsPatient',   label: 'Send SMS to patient' },
      ]
    },
    {
      key: 'vaccination',
      label: 'Vaccination',
      icon: 'medkit-outline',
      fields: [
        { key: 'ViewSchedule',       label: 'View vaccination schedule' },
        { key: 'GiveVaccine',        label: 'Give vaccine (single)' },
        { key: 'UngiveVaccine',      label: 'Ungive vaccine (own actions only)' },
        { key: 'SkipVaccine',        label: 'Skip vaccine' },
        { key: 'UnskipVaccine',      label: 'Unskip vaccine (own actions only)' },
        { key: 'BulkGiveVaccines',   label: 'Bulk give vaccines for a date' },
        { key: 'BulkUngiveVaccines', label: 'Bulk ungive vaccines (own actions only)' },
        { key: 'BulkReschedule',     label: 'Bulk reschedule vaccines' },
        { key: 'FillVaccineDetails', label: 'Fill vaccine details (brand/batch/expiry)' },
        { key: 'AddVaccineParams',   label: 'Add vaccine parameters (weight/height/OFC)' },
        { key: 'PrintSchedulePdf',   label: 'Print vaccination schedule PDF' },
        { key: 'AddSpecialDoses',    label: 'Add special doses to schedule' },
        { key: 'EditVaccineSchedule',label: 'Edit vaccine schedule' },
        { key: 'AddVaccineToPatientRecord', label: 'Add vaccine to individual patient record' },
        { key: 'UseTravelQuickSelect', label: 'Use travel quick select', desc: 'Tap the doctor\'s common travel vaccines when registering a Travel client. Only works if the doctor has the Travel permission.' },
        { key: 'UseCustomQuickSelect', label: 'Use custom quick select', desc: 'Tap the doctor\'s common custom vaccines when registering a Customize client.' },
        { key: 'ViewPaAssignmentStatus', label: 'View own assignment status', desc: 'See the "PA Assignments" card and list on the dashboard — status only, cannot reassign to another PA' },
      ]
    },
    {
      key: 'followup',
      label: 'Follow-Up',
      icon: 'calendar-outline',
      fields: [
        { key: 'ViewFollowUps',     label: 'View follow-ups' },
        { key: 'AddFollowUp',       label: 'Add follow-up' },
        { key: 'DeleteFollowUp',    label: 'Delete follow-up' },
        { key: 'DownloadFollowUpPdf', label: 'Download follow-up PDF' },
      ]
    },
    {
      key: 'cards',
      label: 'Immunization Cards',
      icon: 'card-outline',
      fields: [
        { key: 'DownloadImmunizationCards', label: 'Download immunization card PDFs' },
      ]
    },
    {
      key: 'growth',
      label: 'Growth',
      icon: 'trending-up-outline',
      fields: [
        { key: 'ViewGrowth',      label: 'View growth chart' },
        { key: 'AddGrowthRecord', label: 'Add growth record (weight/height/OFC)' },
      ]
    },
    {
      key: 'alerts',
      label: 'Alerts & Bulk Messaging',
      icon: 'notifications-outline',
      fields: [
        { key: 'ViewAlerts',       label: 'View vaccine / follow-up / birthday alerts' },
        { key: 'SendBulkEmail',    label: 'Send bulk email to alert patients' },
        { key: 'OpenWhatsApp',     label: 'Open WhatsApp for alert patient' },
        { key: 'OpenSms',          label: 'Open SMS for alert patient' },
        { key: 'DownloadAlertCsv',label: 'Download alert list as CSV' },
        { key: 'RetryMessage',     label: 'Retry failed message' },
      ]
    },
    {
      key: 'invoice',
      label: 'Invoice',
      icon: 'receipt-outline',
      fields: [
        { key: 'ManageInvoice', label: 'Add brands, consultation fee, generate invoice PDF' },
      ]
    },
    {
      key: 'clinics',
      label: 'Clinics',
      icon: 'business-outline',
      fields: [
        { key: 'AddClinic',     label: 'Add new clinic' },
        { key: 'EditClinic',    label: 'Edit clinic details' },
        { key: 'DeleteClinic',  label: 'Delete clinic' },
        { key: 'SetClinicOnline', label: 'Set clinic as online / active' },
      ]
    },
    {
      key: 'templates',
      label: 'Vaccine Schedule Templates',
      icon: 'list-outline',
      fields: [
        { key: 'AddScheduleTemplate', label: 'Add new vaccine schedule template' },
        { key: 'EditScheduleTemplate',label: 'Edit schedule (doses / timing)' },
        { key: 'SetVacationDates',    label: 'Set vacation dates' },
        { key: 'ApplySessionTimings', label: 'Apply session timings to all days' },
      ]
    },
    {
      key: 'stock',
      label: 'Stock Management',
      icon: 'cube-outline',
      fields: [
        { key: 'StockSuppliers',    label: 'Suppliers' },
        { key: 'StockPurchaseBills',label: 'Purchase bills' },
        { key: 'StockOverview',     label: 'Stock overview' },
        { key: 'StockAdjust',       label: 'Adjust stock' },
        { key: 'StockTransfer',     label: 'Stock transfer' },
        { key: 'StockDirectSale',   label: 'Direct sale' },
        { key: 'StockReports',      label: 'Purchase & sales reports' },
      ]
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'bar-chart-outline',
      fields: [
        { key: 'ViewAnalytics', label: 'View all analytics reports' },
      ]
    },
    {
      key: 'coldchain',
      label: 'Cold Chain',
      icon: 'thermometer-outline',
      scopeNote: 'Only visible if the doctor has Cold Chain Management enabled (set in VacAdmin). A PA without this permission cannot log temperature readings even if the doctor has the module enabled.',
      fields: [
        { key: 'ColdChainEntry', label: 'Log fridge temperature readings', desc: 'Submit temperature readings for the assigned clinic. Minimum 2 readings/day required per fridge; unlimited extra readings allowed.' },
      ]
    },
    {
      key: 'location',
      label: 'Location',
      icon: 'location-outline',
      scopeNote: 'The assistant must also start a shift in the VPK Assistant app. Location is shared only during a shift.',
      fields: [
        { key: 'TrackLocation', label: 'Track location during shift', desc: 'Share live location with you while on shift. Shown on the Assistant Locations page.' },
      ]
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private paService: PaService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.paId = Number(this.route.snapshot.paramMap.get('paId'));
    this.paName = this.route.snapshot.queryParamMap.get('name') || 'PA';
    this.loadPermissions();
  }

  get allFields(): any[] {
    return this.sections.reduce((a: any[], s: any) => a.concat(s.fields), []);
  }

  get totalCount(): number { return this.allFields.length; }

  get grantedTotal(): number {
    return this.allFields.filter((f: any) => !!this.perm[f.key]).length;
  }

  dirtyKeys(): string[] {
    return this.allFields
      .filter((f: any) => !!this.perm[f.key] !== !!this.saved[f.key])
      .map((f: any) => f.key);
  }

  get dirtyCount(): number { return this.dirtyKeys().length; }

  isChanged(key: string): boolean {
    return !!this.perm[key] !== !!this.saved[key];
  }

  loadPermissions() {
    this.loadFailed = false;
    this.loadingController.create({ message: 'Loading permissions...' }).then((loading) => {
      loading.present();
      this.paService.getPaPermissions(this.paId).subscribe({
        next: (res: any) => {
          loading.dismiss();
          this.perm = res || {};
          this.saved = JSON.parse(JSON.stringify(this.perm));
          this.loaded = true;
        },
        error: () => {
          // Never fall back to an empty object: saving it would wipe every permission.
          loading.dismiss();
          this.loadFailed = true;
        }
      });
    });
  }

  // ---- search + navigation ----
  matches(section: any, f: any): boolean {
    const q = this.query.trim().toLowerCase();
    if (!q) { return true; }
    const hay = (f.label + ' ' + (f.desc || '') + ' ' + section.label + ' ' +
      (this.highImpact[f.key] ? 'high impact ' + this.highImpact[f.key] : '')).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  visibleFields(section: any): any[] {
    return section.fields.filter((f: any) => this.matches(section, f));
  }

  get visibleSections(): any[] {
    const searching = this.query.trim().length > 0;
    return this.sections.filter((s: any) =>
      (searching || this.activeCat === 'all' || this.activeCat === s.key) && this.visibleFields(s).length > 0);
  }

  isFiltered(section: any): boolean {
    return this.visibleFields(section).length !== section.fields.length;
  }

  setCat(key: string) {
    this.activeCat = key;
    this.query = '';
  }

  clearSearch() { this.query = ''; }

  countGranted(section: any): number {
    return section.fields.filter((f: any) => !!this.perm[f.key]).length;
  }

  // ---- editing ----
  toggle(key: string) {
    this.perm[key] = !this.perm[key];
  }

  private snapshot() {
    this.undoSnapshot = JSON.parse(JSON.stringify(this.perm));
  }

  async allowAll(section: any) {
    const todo = this.visibleFields(section).filter((f: any) => !this.perm[f.key]);
    if (!todo.length) { this.showToast('Everything shown is already allowed', false); return; }
    const risky = todo.filter((f: any) => this.highImpact[f.key]);
    if (!risky.length) { this.applyBulk(section, todo, true); return; }
    const safe = todo.filter((f: any) => !this.highImpact[f.key]);
    const buttons: any[] = [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Allow all ' + todo.length, handler: () => { this.applyBulk(section, todo, true); } },
    ];
    if (safe.length) {
      buttons.splice(1, 0, {
        text: 'Only the ' + safe.length + ' low-impact',
        handler: () => { this.applyBulk(section, safe, true); }
      });
    }
    const alert = await this.alertController.create({
      header: 'Allow ' + todo.length + ' permissions in ' + section.label + '?',
      message: 'This includes high-impact actions:<br>' +
        risky.map((f: any) => '• ' + f.label + ' (' + this.highImpact[f.key] + ')').join('<br>'),
      buttons: buttons
    });
    await alert.present();
  }

  clearAll(section: any) {
    const todo = this.visibleFields(section).filter((f: any) => !!this.perm[f.key]);
    if (!todo.length) { this.showToast('Everything shown is already off', false); return; }
    this.applyBulk(section, todo, false);
  }

  private applyBulk(section: any, fields: any[], on: boolean) {
    this.snapshot();
    fields.forEach((f: any) => { this.perm[f.key] = on; });
    this.showToast((on ? 'Allowed ' : 'Cleared ') + fields.length + ' in ' + section.label, true);
  }

  undo() {
    if (!this.undoSnapshot) { return; }
    this.perm = this.undoSnapshot;
    this.undoSnapshot = null;
    this.hideToast();
  }

  showToast(text: string, undoable: boolean) {
    this.toastText = text;
    this.canUndo = undoable;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.hideToast(); }, 6000);
  }

  hideToast() {
    this.toastText = '';
    this.canUndo = false;
    clearTimeout(this.toastTimer);
  }

  async discard() {
    const n = this.dirtyCount;
    if (!n) { return; }
    const alert = await this.alertController.create({
      header: 'Discard ' + n + ' change' + (n > 1 ? 's' : '') + '?',
      message: 'Permissions go back to the last saved state.',
      buttons: [
        { text: 'Keep editing', role: 'cancel' },
        { text: 'Discard', role: 'destructive', handler: () => {
            this.snapshot();
            this.perm = JSON.parse(JSON.stringify(this.saved));
            this.showToast('Changes discarded', true);
          } },
      ]
    });
    await alert.present();
  }

  // ---- save ----
  async save(): Promise<boolean> {
    if (!this.loaded || this.loadFailed || this.saving) { return false; }
    const n = this.dirtyCount;
    if (!n) { this.showToast('No changes to save', false); return true; }
    this.saving = true;
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();
    return new Promise<boolean>((resolve) => {
      this.paService.updatePaPermissions(this.paId, this.perm).subscribe({
        next: () => {
          loading.dismiss();
          this.saving = false;
          this.saved = JSON.parse(JSON.stringify(this.perm));
          this.undoSnapshot = null;
          this.showToast('Saved ' + n + ' change' + (n > 1 ? 's' : ''), false);
          resolve(true);
        },
        error: () => {
          loading.dismiss();
          this.saving = false;
          this.toastService.create('Failed to save permissions. Your changes are still here - try again.', 'danger');
          resolve(false);
        }
      });
    });
  }

  // Called by the CanDeactivate guard.
  async confirmLeave(): Promise<boolean> {
    if (!this.dirtyCount || !this.loaded) { return true; }
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Unsaved changes',
        message: 'You have ' + this.dirtyCount + ' unsaved permission change' + (this.dirtyCount > 1 ? 's' : '') + '.',
        backdropDismiss: false,
        buttons: [
          { text: 'Keep editing', role: 'cancel', handler: () => { resolve(false); } },
          { text: 'Discard', role: 'destructive', handler: () => { resolve(true); } },
          { text: 'Save', handler: () => { this.save().then((ok) => resolve(ok)); } },
        ]
      });
      await alert.present();
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    const t: any = ev.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); this.save(); }
    else if (ev.key === '/' && !typing) {
      ev.preventDefault();
      const el = document.getElementById('perm-search');
      if (el) { el.focus(); }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(ev: any) {
    if (this.dirtyCount) { ev.preventDefault(); ev.returnValue = ''; }
  }
}
