import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-vacation',
  templateUrl: './vacation.page.html',
  styleUrls: ['./vacation.page.scss'],
})
export class VacationPage implements OnInit {

  fg2: FormGroup;
  doctorID: any;
  clinics: any;
  vaccines: any;
  constructor(
    public loadingController: LoadingController,
    public formBuilder: FormBuilder,
    private storage: Storage,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    });
    this.getClinics();

  }

  getChildVaccinefromUser() {
    this.fg2.value.clinics = this.fg2.value.clinics
      .map((v, i) => v ? this.vaccines[i].ID : null)
      .filter(v => v !== null);
    this.fg2.value.clinics = this.fg2.value.clinics;
    console.log(this.fg2.value)

  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinics(this.doctorID).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinics = res.ResponseData;
          console.log(this.clinics);
          const controls = this.clinics.map(c => new FormControl(false));
          this.fg2 = this.formBuilder.group({
            clinics: new FormArray(controls),
            'formDate': [null],
            'ToDate': [null]
          });
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
