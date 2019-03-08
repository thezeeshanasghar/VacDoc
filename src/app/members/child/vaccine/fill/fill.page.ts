import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-fill',
  templateUrl: './fill.page.html',
  styleUrls: ['./fill.page.scss'],
})
export class FillPage implements OnInit {

  vaccinID: any;
  vaccineData: any;
  constructor(
    public loadingController: LoadingController,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService
  ) { }


  ngOnInit() {
    //this.vaccinID = this.route.snapshot.paramMap.get('id');
    this.getVaccination();
  }

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.getVaccineByVaccineId(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccineData = res.ResponseData;
          console.log(this.vaccineData);
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
    );
  }
}
