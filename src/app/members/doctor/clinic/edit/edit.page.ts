import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  fg: FormGroup;
  fg2: FormGroup;
  clinic: any;
  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formbuilder: FormBuilder,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.fg = this.formbuilder.group({
      'ID': [null],
      'DoctorID': [null],
      'Name': [null],
      'PhoneNumber': [null],
      'Address': [null],
      'ConsultationFee': [null],
      'OffDays': [null],
      'ClinicTimings': [null],
      'Lat': [null],
      'Long': [null],
      'IsOnline': [null],
    })
    this.getClinic();
  }

  async getClinic() {
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    await this.clinicService.getClinicById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.clinic = res.ResponseData;
          this.fg.controls['Name'].setValue(this.clinic.Name);
          this.fg.controls['PhoneNumber'].setValue(this.clinic.PhoneNumber);
          this.fg.controls['Address'].setValue(this.clinic.Address);
          this.fg.controls['ConsultationFee'].setValue(this.clinic.ConsultationFee);

          const controls = this.clinic.ClinicTimings.map(c => new FormControl(true));
          this.fg2 = this.formbuilder.group({
            ChildVaccines: new FormArray(controls),
          });

          console.log(this.clinic)
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
