import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

interface Response<T> {
  IsSuccess: boolean;
  Message: string | null;
  ResponseData: T | null;
}

interface BrandAmountDTO {
  BrandId: number;
  VaccineName: string;
  BrandName: string;
  Amount: number;
  Count: number;
  // Add other properties as needed
}

@Component({
  selector: 'app-brand-amount',
  templateUrl: './brand-amount.page.html',
  styleUrls: ['./brand-amount.page.scss'],
})
export class BrandAmountPage implements OnInit {

  brandAmounts: BrandAmountDTO[] = [];
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

  async getBrandAmount(id: string) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();

    this.brandService.getBrandAmount(id).subscribe(
      (res: Response<BrandAmountDTO[]>) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.brandAmounts = res.ResponseData;
          this.brandAmounts.sort((a, b) => {
            const vaccineComparison = a.VaccineName.localeCompare(b.VaccineName);
            return vaccineComparison !== 0 ? vaccineComparison : a.BrandName.localeCompare(b.BrandName);
          });
          console.log('Brand Amounts:', this.brandAmounts);
        } else {
          this.toastService.create(res.Message || 'Failed to fetch brand amounts', 'danger');
        }
      },
      err => {
        loading.dismiss();
        console.error('Error fetching brand amounts:', err);
        this.toastService.create('Failed to fetch brand amounts', 'danger');
      }
    );
  }

  async updateBrandAmount() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.brandService.putBrandAmount(this.brandAmounts)
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