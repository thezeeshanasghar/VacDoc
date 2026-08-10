import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ColdChainService } from 'src/app/services/cold-chain.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-doctor-approval',
  templateUrl: './doctor-approval.page.html',
  styleUrls: ['./doctor-approval.page.scss'],
})
export class DoctorApprovalPage implements OnInit {
  doctorId: number;
  weekStart: string;
  weekEnd: string;

  // 'all' rollup vs single-clinic drill-down (see approved mock)
  viewMode: 'all' | 'single' = 'all';
  selectedClinicId: number | null = null;
  selectedClinicName = '';

  clinicRollup: any[] = [];
  isLoadingRollup = false;

  currentLog: any = null; // ColdChainApprovalResponseDTO (with FridgeBreakdown / ExcursionReadings / FridgesWithNoReadings)
  approvalHistory: any[] = [];
  isLoadingClinic = false;
  isSubmitting = false;

  approvalForm = {
    status: 'approved',
    comments: ''
  };

  constructor(
    private storage: Storage,
    private coldChainService: ColdChainService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val; });
    this.weekStart = this.coldChainService.getWeekStart();
    this.weekEnd = this.coldChainService.getWeekEnd(this.weekStart);
    this.loadRollup();
  }

  loadRollup() {
    this.isLoadingRollup = true;
    this.coldChainService.getAllClinicsRollup(this.doctorId, this.weekStart).subscribe({
      next: (res: any) => {
        this.clinicRollup = (res && res.ResponseData) || [];
        this.isLoadingRollup = false;
      },
      error: () => {
        this.toastService.create('Error loading clinics summary', 'danger');
        this.isLoadingRollup = false;
      }
    });
  }

  totalPending(): number {
    return this.clinicRollup.filter(c => c.Status === 'pending').length;
  }

  totalExcursions(): number {
    return this.clinicRollup.reduce((sum, c) => sum + (c.ExcursionCount || 0), 0);
  }

  totalMissedChecks(): number {
    return this.clinicRollup.reduce((sum, c) => sum + (c.MissedChecks || 0), 0);
  }

  totalFridges(): number {
    return this.clinicRollup.reduce((sum, c) => sum + (c.FridgeCount || 0), 0);
  }

  showClinic(clinicId: number, clinicName: string) {
    this.selectedClinicId = clinicId;
    this.selectedClinicName = clinicName;
    this.viewMode = 'single';
    this.loadClinicWeek();
    this.loadHistory();
  }

  showAllClinics() {
    this.viewMode = 'all';
    this.selectedClinicId = null;
    this.currentLog = null;
    this.loadRollup(); // refresh in case an approval was just submitted
  }

  loadClinicWeek() {
    this.isLoadingClinic = true;
    this.coldChainService.getClinicWeek(this.selectedClinicId, this.weekStart).subscribe({
      next: (res: any) => {
        this.currentLog = (res && res.ResponseData) || null;
        if (this.currentLog) {
          this.approvalForm.comments = this.currentLog.DoctorComments || '';
          this.approvalForm.status = this.currentLog.Status === 'pending' ? 'approved' : this.currentLog.Status;
        }
        this.isLoadingClinic = false;
      },
      error: () => {
        this.toastService.create('Error loading clinic week', 'danger');
        this.isLoadingClinic = false;
      }
    });
  }

  loadHistory() {
    this.coldChainService.getApprovalHistory(this.selectedClinicId, 10).subscribe({
      next: (res: any) => { this.approvalHistory = (res && res.ResponseData) || []; }
    });
  }

  compliancePercent(): number {
    if (!this.currentLog || !this.currentLog.TotalReadings) { return 0; }
    return Math.round((this.currentLog.InRangeCount / this.currentLog.TotalReadings) * 100);
  }

  submitApproval() {
    if (!this.currentLog) { return; }
    if (!this.approvalForm.comments.trim()) {
      this.toastService.create('Add a comment before submitting', 'warning');
      return;
    }

    this.isSubmitting = true;
    this.coldChainService.submitApproval(this.currentLog.Id, this.approvalForm.status, this.approvalForm.comments.trim()).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.IsSuccess !== false) {
          this.toastService.create('Week ' + this.approvalForm.status);
          this.loadClinicWeek();
          this.loadHistory();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to save approval', 'danger');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.create('Error saving approval', 'danger');
      }
    });
  }

  weekLabel(startStr: string): string {
    const start = new Date(startStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  }
}
