import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ColdChainService } from 'src/app/services/cold-chain.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-temperature-log',
  templateUrl: './temperature-log.page.html',
  styleUrls: ['./temperature-log.page.scss'],
})
export class TemperatureLogPage implements OnInit {
  doctorId: number;

  clinics: any[] = [];
  filterClinicId: number | null = null;

  refrigerators: any[] = [];
  readings: any[] = [];
  isLoading = false;
  isLoadingClinics = false;

  filterRefrigeratorId: number | null = null;
  fromDate: string;
  toDate: string;

  constructor(
    private storage: Storage,
    private coldChainService: ColdChainService,
    private clinicService: ClinicService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val; });

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    this.toDate = this.coldChainService.toDateString(today);
    this.fromDate = this.coldChainService.toDateString(weekAgo);

    this.loadClinics();
  }

  loadClinics() {
    this.isLoadingClinics = true;
    this.clinicService.getClinics(this.doctorId).subscribe({
      next: (res: any) => {
        this.clinics = (res && res.ResponseData) || [];
        this.isLoadingClinics = false;
        this.onClinicChange();
      },
      error: () => {
        this.isLoadingClinics = false;
        this.toastService.create('Error loading clinics', 'danger');
      }
    });
  }

  get activeClinicIds(): number[] {
    return this.filterClinicId ? [this.filterClinicId] : this.clinics.map(c => c.Id);
  }

  onClinicChange() {
    this.filterRefrigeratorId = null;
    this.loadRefrigerators();
    this.loadReadings();
  }

  loadRefrigerators() {
    const clinicIds = this.activeClinicIds;
    if (clinicIds.length === 0) { this.refrigerators = []; return; }

    forkJoin(clinicIds.map(id =>
      this.coldChainService.getRefrigerators(id).pipe(catchError(() => of({ ResponseData: [] })))
    )).subscribe((results: any[]) => {
      this.refrigerators = results.reduce((all, res) => all.concat((res && res.ResponseData) || []), []);
    });
  }

  loadReadings() {
    const clinicIds = this.activeClinicIds;
    if (clinicIds.length === 0) { this.readings = []; return; }

    this.isLoading = true;
    forkJoin(clinicIds.map(id =>
      this.coldChainService.getReadings(id, this.fromDate, this.toDate, this.filterRefrigeratorId || undefined)
        .pipe(catchError(() => of({ ResponseData: [] })), map((res: any) => {
          const rows = (res && res.ResponseData) || [];
          rows.forEach((r: any) => { r._clinicId = id; });
          return rows;
        }))
    )).subscribe({
      next: (results: any[]) => {
        this.readings = ([] as any[]).concat(...results)
          .sort((a: any, b: any) => (b.RecordedDate + b.RecordedTime).localeCompare(a.RecordedDate + a.RecordedTime));
        this.isLoading = false;
      },
      error: () => {
        this.toastService.create('Error loading readings', 'danger');
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.loadReadings();
  }

  fridgeName(id: number): string {
    const f = this.refrigerators.find(r => r.Id === id);
    return f ? f.Name : 'Unknown';
  }

  get canDownloadPdf(): boolean {
    return !!this.filterClinicId;
  }

  downloadPdf() {
    if (!this.filterClinicId) {
      this.toastService.create('Select a clinic to download the log', 'warning');
      return;
    }
    const url = this.coldChainService.getReadingsPdfUrl(
      this.filterClinicId, this.fromDate, this.toDate, this.filterRefrigeratorId || undefined
    );
    window.open(url);
  }

  clinicName(clinicId: number): string {
    const c = this.clinics.find(x => x.Id === clinicId);
    return c ? c.Name : '';
  }
}
