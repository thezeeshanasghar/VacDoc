import { Component, OnInit } from '@angular/core';
import { ScheduleService } from 'src/app/services/schedule.service';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
})
export class SchedulePage implements OnInit {

  fg: FormGroup;
  schedule: any;
  vaccines: any;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage,
  ) { }

  ngOnInit() {

    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.getSchedule(val);
    })
  }


  getChildVaccinefromUser() {
    this.fg.value.ChildVaccines = this.fg.value.ChildVaccines
      .map((v, i) => v ? this.schedule[i].ID : null)
      .filter(v => v !== null);

    this.fg.value.ChildVaccines = this.fg.value.ChildVaccines;

    console.log(this.fg.value.ChildVaccines);
  }


  update() {
    console.log(this.fg.value.fff)
  }
  async getSchedule(id) {
    let loading = await this.loadingcontroller.create({ message: 'Loading' })
    await loading.present();
    await this.scheduleService.getSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.schedule = res.ResponseData;

          const controls = this.schedule.map(c => new FormControl(false));
          this.fg = this.formBuilder.group({
            ChildVaccines: new FormArray(controls),
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
    )
  }

}
