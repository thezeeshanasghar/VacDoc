import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

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

  constructor(
    private paService: PaService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.loadPaList();
    this.loadLogs();
  }

  loadPaList() {
    this.paService.getPAsByDoctorId(this.doctorId).subscribe({
      next: (res: any) => { this.personalAssistants = Array.isArray(res) ? res : []; },
      error: () => {}
    });
  }

  async loadLogs() {
    if (this.loading) { return; }
    this.loading = true;
    const load = await this.loadingController.create({ message: 'Loading audit log...' });
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
    this.loadLogs();
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.loadLogs(); }
  }

  nextPage() {
    if (this.page * this.pageSize < this.total) { this.page++; this.loadLogs(); }
  }

  getActionColor(log: any): string {
    if (log.IsReversal) { return 'warning'; }
    const code: string = log.ActionCode || '';
    if (code.toLowerCase().indexOf('delete') >= 0) { return 'danger'; }
    if (code.toLowerCase().indexOf('give') >= 0 || code.toLowerCase().indexOf('add') >= 0) { return 'success'; }
    return 'primary';
  }
}
