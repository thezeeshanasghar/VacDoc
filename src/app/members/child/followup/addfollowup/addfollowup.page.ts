import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowupService } from 'src/app/services/followup.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-addfollowup',
  templateUrl: './addfollowup.page.html',
  styleUrls: ['./addfollowup.page.scss'],
})
export class AddfollowupPage implements OnInit {

  fg: FormGroup;
  doctorId: any;
  childId: any;
  minDate: string;
  maxDate: string;

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage
  ) {
    this.minDate = moment().format('YYYY-MM-DD');
    this.maxDate = moment().add(20, 'years').format('YYYY-MM-DD');
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.fg = this.formBuilder.group({
      'DoctorId': [null],
      'ChildId': [null],
      'Disease': [null],
      'CurrentVisitDate': this.GetCurrentDate(),
      'NextVisitDate': [null],
      'Height': [null],
      'OFC': [null],
      'Weight': [null],
      'BloodSugar': [null],
      'BloodPressure': [null],
    });
  }

  async addFollowUp() {
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.ChildId = this.route.snapshot.paramMap.get('id');
    if (this.fg.value.NextVisitDate) {
      this.fg.value.NextVisitDate = this.fg.value.NextVisitDate;
    }

    const loading = await this.loadingController.create({
      message: 'loading'
    });
    await loading.present();
    await this.followupService.addFollowupByChild(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create('successfully added');
          this.router.navigate(['/members/child/']);
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message);
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err)
      });
  }

  GetCurrentDate() {
    return moment().format('DD-MM-YYYY');
  }
}