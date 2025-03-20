import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService, BrandAmountDTO } from 'src/app/services/brand.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

// import { Response, BrandAmountDTO } from 'src/app/models/response.model'; // adjust the import path as needed

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
      (res: { IsSuccess: boolean, ResponseData: BrandAmountDTO[], Message: string }) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.brandAmounts = res.ResponseData.sort((a, b) => a.BrandName.localeCompare(b.BrandName));
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
  // Add to BrandAmountPage class
async downloadPDF() {
  try {
    const loading = await this.loadingController.create({
      message: 'Downloading PDF...'
    });
    await loading.present();

    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    
    this.brandService.downloadPdf(doctorId, { observe: 'response', responseType: 'blob' }).subscribe(
      (response) => {
        const blob = response.body;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `brand-report-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        loading.dismiss();
        this.toastService.create('PDF downloaded successfully', 'success');
      },
      error => {
        loading.dismiss();
        console.error('Error downloading PDF:', error);
        this.toastService.create('Failed to download PDF', 'danger');
      }
    );
  } catch (error) {
    console.error('Error in downloadPDF:', error);
    this.toastService.create('An unexpected error occurred', 'danger');
    this.loadingController.dismiss();
  }
}
}