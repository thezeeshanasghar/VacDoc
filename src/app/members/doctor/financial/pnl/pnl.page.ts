import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { PnLService } from 'src/app/services/pnl.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-pnl',
  templateUrl: './pnl.page.html',
  styleUrls: ['./pnl.page.scss'],
})
export class PnlPage {
  doctorId: any;
  usertype: any;

  clinics: any[] = [];
  selectedClinicId: number = null;
  expenseMode: string = 'operational';

  form: FormGroup;
  loading: boolean = false;

  result: any = null;

  catIconMap: any = {
    Marketing:   'megaphone-outline',
    Printing:    'print-outline',
    Gifting:     'gift-outline',
    Fuel:        'car-outline',
    Salary:      'people-outline',
    Disposables: 'medkit-outline',
    Capital:     'cube-outline',
    Others:      'ellipsis-horizontal-outline',
  };

  catColorMap: any = {
    Marketing:   'cat-blue',
    Printing:    'cat-grey',
    Gifting:     'cat-pink',
    Fuel:        'cat-orange',
    Salary:      'cat-green',
    Disposables: 'cat-teal',
    Capital:     'cat-purple',
    Others:      'cat-grey',
  };

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private paService: PaService,
    private pnlService: PnLService,
    private toastService: ToastService,
  ) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.form = this.fb.group({
      fromDate: [monthStart.toISOString().slice(0, 10)],
      toDate: [now.toISOString().slice(0, 10)]
    });
  }

  async ionViewWillEnter() {
    this.usertype = await this.storage.get(environment.USER);
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    await this.loadClinics();
    this.load();
  }

  async loadClinics() {
    const isPA = this.usertype && this.usertype.UserType === 'PA';
    const obs = isPA ? this.paService.getPaClinics(Number(this.usertype.PAId)) : this.clinicService.getClinics(Number(this.doctorId));
    return new Promise((resolve) => {
      obs.subscribe({
        next: (res: any) => {
          if (res && res.IsSuccess) {
            this.clinics = res.ResponseData || [];
          }
          resolve(null);
        },
        error: () => resolve(null)
      });
    });
  }

  private get fromDate() { return (this.form.value.fromDate || '').toString().slice(0, 10); }
  private get toDate()   { return (this.form.value.toDate   || '').toString().slice(0, 10); }

  setExpenseMode(mode: string) {
    this.expenseMode = mode;
    this.load();
  }

  onFilterChange() {
    this.load();
  }

  async load() {
    if (!this.fromDate || !this.toDate) { return; }
    this.loading = true;
    const loader = await this.loadingCtrl.create({ message: 'Loading...' });
    await loader.present();

    this.pnlService.getPnL(Number(this.doctorId), this.selectedClinicId, this.fromDate, this.toDate, this.expenseMode)
      .subscribe({
        next: (res: any) => {
          loader.dismiss();
          this.loading = false;
          if (res && res.IsSuccess) {
            this.result = res.ResponseData;
          } else {
            this.result = null;
            this.toastService.create(res && res.Message ? res.Message : 'Failed to load P&L', 'danger');
          }
        },
        error: () => {
          loader.dismiss();
          this.loading = false;
          this.result = null;
          this.toastService.create('Failed to load P&L', 'danger');
        }
      });
  }

  catIcon(cat: string): string {
    return this.catIconMap[cat] || 'ellipsis-horizontal-outline';
  }

  catClass(cat: string): string {
    return this.catColorMap[cat] || 'cat-grey';
  }
}
