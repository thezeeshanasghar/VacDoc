import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

@Component({
  selector: 'app-brand-amount',
  templateUrl: './brand-amount.page.html',
  styleUrls: ['./brand-amount.page.scss'],
})
export class BrandAmountPage implements OnInit {

  brandAmount: any;
  fg: FormGroup
  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.getBrandAmount(val);
    });
  }

  async getBrandAmount(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.brandService.getBrandAmount(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.brandAmount = res.ResponseData;
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    )
  }

  async updateBrandAmount() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.brandService.putBrandAmount(this.brandAmount)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("successfully updated");
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
}
