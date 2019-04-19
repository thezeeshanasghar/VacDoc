import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { DoseService } from 'src/app/services/dose.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-vschedule',
  templateUrl: './vschedule.page.html',
  styleUrls: ['./vschedule.page.scss'],
})
export class VschedulePage implements OnInit {

  doses: any;
  constructor(
    private loadingController: LoadingController,
    private doseService: DoseService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.getVaccineInfo();
  }

  async getVaccineInfo() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.doseService.getDoses().subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
          console.log(this.doses);
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger')
        }

      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }
}
