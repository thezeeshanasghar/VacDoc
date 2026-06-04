import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

const ACTION_LABELS: Record<string, string> = {
  SCHEDULE_ADD_VACCINE:    'Add Vaccine',
  SCHEDULE_EDIT_VACCINE:   'Edit Vaccine',
  SCHEDULE_DELETE_VACCINE: 'Delete Vaccine',
  VACCINE_GIVEN:           'Vaccine Given',
  VACCINE_UNGIVEN:         'Vaccine Ungiven',
  VACCINE_SKIP:            'Vaccine Skipped',
  VACCINE_UNSKIP:          'Vaccine Unskipped',
  VACCINE_RESCHEDULE:      'Reschedule',
  INVOICESUBMIT:           'Invoice Submit',
  INVOICEEDIT:             'Invoice Edit',
  InvoiceEdit:             'Invoice Edit',
  PAYMENT_COLLECTED:       'Payment Collected',
  HANDOVER_CREATED:        'Cash Handover',
  HANDOVER_CONFIRMED:      'Handover Confirmed',
  PATIENT_ADDED:           'Patient Added',
  PATIENT_EDITED:          'Patient Edited',
};

@Component({
  selector: 'app-pa-audit-log',
  templateUrl: './pa-audit-log.page.html',
  styleUrls: ['./pa-audit-log.page.scss'],
})
export class PaAuditLogPage implements OnInit {
  doctorId: any = null;
  logs: any[] = [];
  personalAssistants: any[] = [];
  selectedPaId: any = null;
  total: number = 0;
  page: number = 1;
  pageSize: number = 50;
  loading: boolean = false;

  get totalPages(): number {
    return this.pageSize > 0 ? Math.ceil(this.total / this.pageSize) : 1;
  }

  constructor(
    private paService: PaService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    // Load PA list independently so dropdown always shows all PAs
    this.paService.getPAsByDoctorId(String(this.doctorId)).subscribe({
      next: (res: any) => {
        // API returns raw array directly (no IsSuccess wrapper)
        if (Array.isArray(res)) {
          this.personalAssistants = res;
        } else if (res && res.IsSuccess) {
          this.personalAssistants = res.ResponseData || [];
        }
      }
    });
    this.loadLogs();
  }

  async loadLogs() {
    if (this.loading) { return; }
    this.loading = true;
    const load = await this.loadingController.create({ message: 'Loading...' });
    await load.present();
    this.paService.getAuditLog(this.doctorId, this.selectedPaId || undefined, this.page, this.pageSize).subscribe({
      next: (res: any) => {
        load.dismiss();
        this.loading = false;
        this.total = res.total || 0;
        this.logs = res.logs || [];
      },
      error: () => {
        load.dismiss();
        this.loading = false;
        this.toastService.create('Failed to load audit log', 'danger');
      }
    });
  }

  onFilterChange() {
    this.page = 1;
    this.logs = [];
    this.loading = false;
    this.loadLogs();
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.loadLogs(); }
  }

  nextPage() {
    if (this.page * this.pageSize < this.total) { this.page++; this.loadLogs(); }
  }

  getActionLabel(log: any): string {
    const code: string = log.ActionCode || '';
    return ACTION_LABELS[code] || code.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  }

  getActionColor(log: any): string {
    if (log.IsReversal) { return 'warning'; }
    const code: string = log.ActionCode || '';
    if (code.toLowerCase().includes('delete') || code === 'InvoiceEdit' || code === 'INVOICEEDIT') { return 'danger'; }
    if (code.toLowerCase().includes('give') || code.toLowerCase().includes('add') || code === 'PATIENT_ADDED') { return 'success'; }
    if (code.toLowerCase().includes('invoice') || code.toLowerCase().includes('payment') || code.toLowerCase().includes('handover')) { return 'primary'; }
    return 'medium';
  }
}
