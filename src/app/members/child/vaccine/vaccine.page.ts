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
    private vaccineService: VaccineService,
    private toastService: ToastService

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

    await this.vaccineService.getVaccinationById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccine = res.ResponseData;
          loading.dismiss();
          this.vaccine.forEach(doc => {
            doc.Date = moment(doc.Date, "DD-MM-YYYY").format('YYYY-MM-DD');
          });
        }
        else {
          loading.dismiss()
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }

  async updateDate($event, vacId) {
    let newDate = $event.detail.value;
    newDate = moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    let data = { 'Date': newDate, 'ID': vacId }
    await this.vaccineService.updateVaccinationDate(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create(res.Message)
          this.getVaccination();
        }
        else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        this.toastService.create(err, 'danger');
      }
    );
  }

}
