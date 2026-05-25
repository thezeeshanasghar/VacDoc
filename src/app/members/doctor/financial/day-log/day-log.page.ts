import { Component, OnInit } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ScheduleService } from 'src/app/services/schedule.service';
import * as moment from 'moment';

@Component({
  selector: 'app-day-log',
  templateUrl: './day-log.page.html',
  styleUrls: ['./day-log.page.scss'],
})
export class DayLogPage implements OnInit {
  doctorId: number;
  selectedDate: string = new Date().toISOString().split('T')[0];
  entries: any[] = [];
  totalCollected: number = 0;
  totalPending: number = 0;

  constructor(
    private storage: Storage,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private scheduleService: ScheduleService,
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = Number(val);
      this.loadLog();
    });
  }

  async loadLog() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    const dateStr = moment(this.selectedDate).format('YYYY-MM-DD');
    this.scheduleService.getDayLog(this.doctorId, dateStr).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.entries = res.ResponseData || [];
          this.computeSummary();
        }
      },
      () => loading.dismiss()
    );
  }

  computeSummary() {
    this.totalCollected = 0;
    this.totalPending = 0;
    for (const e of this.entries) {
      const amt = e.Amount || 0;
      if (e.IsPaymentCollected || e.IsPAApprove || !e.PaymentCollectorPaId) {
        this.totalCollected += amt;
      } else {
        this.totalPending += amt;
      }
    }
  }

  async approvePayment(entry: any) {
    const loading = await this.loadingController.create({ message: 'Approving...' });
    await loading.present();
    this.scheduleService.approvePayment(entry.Id).subscribe(
      async res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          entry.IsPAApprove = true;
          this.computeSummary();
        } else {
          const alert = await this.alertController.create({
            header: 'Error',
            message: (res && res.Message) || 'Failed to approve.',
            buttons: ['OK'],
          });
          await alert.present();
        }
      },
      () => loading.dismiss()
    );
  }

  getChildName(entry: any): string {
    return entry && entry.Child ? entry.Child.Name : '';
  }

  getVaccineName(entry: any): string {
    if (entry && entry.Dose && entry.Dose.Vaccine) {
      return entry.Dose.Vaccine.Name + ' - ' + entry.Dose.Name;
    }
    return '';
  }

  getPaLabel(entry: any): string {
    if (!entry.PaymentCollectorPaId) { return 'Doctor'; }
    return entry.PaymentCollectorPaName || ('PA #' + entry.PaymentCollectorPaId);
  }

  onDateChange() {
    this.loadLog();
  }
}
