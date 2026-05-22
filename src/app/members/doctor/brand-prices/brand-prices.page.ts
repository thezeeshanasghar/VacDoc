import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService } from 'src/app/services/brand.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-brand-prices',
  templateUrl: './brand-prices.page.html',
  styleUrls: ['./brand-prices.page.scss'],
})
export class BrandPricesPage implements OnInit {
  brandAmounts: any[] = [];
  doctorId: number = 0;
  clinicId: number = 0;

  constructor(
    private brandService: BrandService,
    private clinicService: ClinicService,
    private loadingController: LoadingController,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    this.clinicId = clinic ? clinic.Id : 0;
    this.loadPrices();
  }

  async loadPrices() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.brandService.getBrandAmount(this.doctorId, this.clinicId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.brandAmounts = (res.ResponseData || []).map((item: any) => {
            item.Amount = parseFloat((item.Amount || 0).toFixed(2));
            return item;
          });
        } else {
          this.toastService.create(res.Message || 'Failed to load prices', 'danger');
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create('Failed to load prices', 'danger');
      }
    );
  }

  async savePrices() {
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();
    this.brandService.putBrandAmount(this.brandAmounts).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Prices saved successfully', 'success');
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      (err: any) => {
        loading.dismiss();
        this.toastService.create('Failed to save prices', 'danger');
      }
    );
  }
}
