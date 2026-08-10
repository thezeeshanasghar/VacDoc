import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ColdChainService } from 'src/app/services/cold-chain.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-pa-entry',
  templateUrl: './pa-entry.page.html',
  styleUrls: ['./pa-entry.page.scss'],
})
export class PaEntryPage implements OnInit {
  doctorId: number;
  clinicId: number;
  paId: number | null = null;
  recordedByName = '';

  refrigerators: any[] = [];
  todayReadings: any[] = [];
  requirementStatus: any[] = []; // per-fridge { RefrigeratorId, RefrigeratorName, ReadingsToday, RequirementMet, LastReadingTime }

  isLoading = false;
  isSubmitting = false;

  formData = {
    refrigeratorId: null as number | null,
    temperature: null as number | null,
    recordedDate: this.todayString(),
    recordedTime: this.nowString(),
    notes: ''
  };

  constructor(
    private storage: Storage,
    private coldChainService: ColdChainService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val; });
    await this.storage.get(environment.CLINIC_Id).then(val => { this.clinicId = val; });
    const user = await this.storage.get(environment.USER);
    if (user && user.UserType === 'PA') {
      this.paId = Number(user.PAId);
      this.recordedByName = user.Name || 'PA';
    } else {
      const doctorProfile = await this.storage.get(environment.DOCTOR);
      this.recordedByName = (doctorProfile && (doctorProfile.DisplayName || doctorProfile.FirstName)) || 'Doctor';
    }

    this.loadRefrigerators();
    this.loadTodayReadings();
    this.loadRequirementStatus();
  }

  loadRefrigerators() {
    this.coldChainService.getRefrigerators(this.clinicId).subscribe({
      next: (res: any) => { this.refrigerators = (res && res.ResponseData) || []; },
      error: () => this.toastService.create('Error loading refrigerators', 'danger')
    });
  }

  loadTodayReadings() {
    this.isLoading = true;
    const today = this.todayString();
    this.coldChainService.getReadings(this.clinicId, today, today).subscribe({
      next: (res: any) => {
        this.todayReadings = ((res && res.ResponseData) || [])
          .sort((a: any, b: any) => (b.RecordedTime || '').localeCompare(a.RecordedTime || ''));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadRequirementStatus() {
    this.coldChainService.getRequirementStatus(this.clinicId, this.todayString()).subscribe({
      next: (res: any) => { this.requirementStatus = (res && res.ResponseData) || []; },
      error: () => { this.requirementStatus = []; }
    });
  }

  selectedFridge() {
    return this.refrigerators.find(f => f.Id === this.formData.refrigeratorId);
  }

  rangeHint(): string {
    const fridge = this.selectedFridge();
    if (!fridge || this.formData.temperature === null || this.formData.temperature === undefined) { return ''; }
    const inRange = this.formData.temperature >= fridge.MinTemp && this.formData.temperature <= fridge.MaxTemp;
    return inRange
      ? `Within range (${fridge.MinTemp}–${fridge.MaxTemp}°C)`
      : `Outside range (${fridge.MinTemp}–${fridge.MaxTemp}°C)`;
  }

  requirementFor(refrigeratorId: number) {
    return this.requirementStatus.find(r => r.RefrigeratorId === refrigeratorId);
  }

  submitReading() {
    if (!this.formData.refrigeratorId) {
      this.toastService.create('Select a refrigerator', 'warning');
      return;
    }
    if (this.formData.temperature === null || this.formData.temperature === undefined) {
      this.toastService.create('Enter a temperature', 'warning');
      return;
    }

    this.isSubmitting = true;
    const dto = {
      refrigeratorId: this.formData.refrigeratorId,
      doctorId: this.doctorId,
      clinicId: this.clinicId,
      temperature: Number(this.formData.temperature),
      recordedDate: this.formData.recordedDate,
      recordedTime: this.formData.recordedTime,
      recordedByPaId: this.paId,
      recordedByName: this.recordedByName,
      notes: this.formData.notes ? this.formData.notes.trim() : undefined
    };

    this.coldChainService.submitReading(dto).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.IsSuccess !== false) {
          this.toastService.create('Reading submitted');
          this.resetForm();
          this.loadTodayReadings();
          this.loadRequirementStatus();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to submit reading', 'danger');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.create('Error submitting reading', 'danger');
      }
    });
  }

  resetForm() {
    this.formData = {
      refrigeratorId: null,
      temperature: null,
      recordedDate: this.todayString(),
      recordedTime: this.nowString(),
      notes: ''
    };
  }

  fridgeName(id: number): string {
    const f = this.refrigerators.find(r => r.Id === id);
    return f ? f.Name : 'Unknown';
  }

  private todayString(): string {
    return this.coldChainService.toDateString(new Date());
  }

  private nowString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
