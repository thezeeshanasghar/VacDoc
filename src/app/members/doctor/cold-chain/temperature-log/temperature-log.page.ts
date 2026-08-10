import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ColdChainService } from 'src/app/services/cold-chain.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-temperature-log',
  templateUrl: './temperature-log.page.html',
  styleUrls: ['./temperature-log.page.scss'],
})
export class TemperatureLogPage implements OnInit {
  doctorId: number;
  clinicId: number;

  refrigerators: any[] = [];
  readings: any[] = [];
  isLoading = false;

  filterRefrigeratorId: number | null = null;
  fromDate: string;
  toDate: string;

  constructor(
    private storage: Storage,
    private coldChainService: ColdChainService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val; });
    await this.storage.get(environment.CLINIC_Id).then(val => { this.clinicId = val; });

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    this.toDate = this.coldChainService.toDateString(today);
    this.fromDate = this.coldChainService.toDateString(weekAgo);

    this.loadRefrigerators();
    this.loadReadings();
  }

  loadRefrigerators() {
    this.coldChainService.getRefrigerators(this.clinicId).subscribe({
      next: (res: any) => { this.refrigerators = (res && res.ResponseData) || []; }
    });
  }

  loadReadings() {
    this.isLoading = true;
    this.coldChainService.getReadings(this.clinicId, this.fromDate, this.toDate, this.filterRefrigeratorId || undefined).subscribe({
      next: (res: any) => {
        this.readings = ((res && res.ResponseData) || [])
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
}
