import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-vaccine',
  templateUrl: './vaccine.page.html',
  styleUrls: ['./vaccine.page.scss'],
})
export class VaccinePage implements OnInit {

  vaccine: any;
  fg: FormGroup
  constructor(
    public loadingController: LoadingController,
    public route: ActivatedRoute,
    public formBuilder: FormBuilder,
    public router: Router,
    private api: VaccineService,
    private toast: ToastService

  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      'Date': [null],
    });
    this.getVaccination();
  }

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getVaccinesById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccine = res.ResponseData;
          loading.dismiss();
          this.vaccine.forEach(doc => {
            doc.Date = moment(doc.Date, "DD-MM-YYYY").format('YYYY-MM-DD');
          });
          console.log(this.vaccine);
        }
        else {
          loading.dismiss()
          this.toast.create(res.Message);
        }
      },
      err => {
        loading.dismiss();
        this.toast.create(err);
      }
    );
  }

  async updateDate($event, vacId) {
    let newDate = $event.detail.value;
    newDate = moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    let data = { 'Date': newDate, 'ID': vacId }
    await this.api.updateVaccinationDate(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
        }
        else {
          this.toast.create(res.Message);
        }
      },
      err => {
        this.toast.create(err);
      }
    );
  }

}
