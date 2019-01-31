import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

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
    this.getVaccine();
  }

  async getVaccine() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getVaccinesById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccine = res.ResponseData;
          loading.dismiss();
          this.fg.controls['Date'].setValue(this.vaccine.Date + '');
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

  updateDate(){
    console.log(this.fg.value)
  }

}
