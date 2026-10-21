import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowupService } from 'src/app/services/followup.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';
import { today, parseDay, pickerDate, dayFromPicker, toLegacyDay } from 'src/app/shared/time';

@Component({
  selector: 'app-addfollowup',
  templateUrl: './addfollowup.page.html'
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
    private storage: Storage,
    private vaccineService: VaccineService
  ) {
    this.minDate = today();
    this.maxDate = (+today().substring(0, 4) + 20) + today().substring(4);
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
    if (this.route.snapshot.queryParamMap.get('auto') === '1') {
      this.loadVaccineDefaults();
    }
  }

  loadVaccineDefaults() {
    var childId: any = null;
    var pathFromRoot = this.route.snapshot.pathFromRoot;
    for (var k = 0; k < pathFromRoot.length; k++) {
      var paramId = pathFromRoot[k].paramMap.get('id');
      if (paramId) { childId = paramId; break; }
    }
    if (!childId) { return; }
    this.vaccineService.getVaccinationById(childId).subscribe(
      res => {
        if (!res.IsSuccess || !res.ResponseData || !res.ResponseData.length) { return; }
        var schedules: any[] = res.ResponseData;

        this.fg.controls['Disease'].setValue('Vaccination');

        // Find most recently given vaccine (for Weight/Height/OFC)
        var given: any[] = schedules.filter(function(s) { return s.IsDone && !s.Due2EPI; });
        var latestGiven: any = null;
        for (var i = 0; i < given.length; i++) {
          if (!latestGiven) {
            latestGiven = given[i];
          } else {
            if (parseDay(given[i].GivenDate) > parseDay(latestGiven.GivenDate)) { latestGiven = given[i]; }
          }
        }
        if (latestGiven) {
          if (latestGiven.Weight) { this.fg.controls['Weight'].setValue(latestGiven.Weight); }
          if (latestGiven.Height) { this.fg.controls['Height'].setValue(latestGiven.Height); }
          if (latestGiven.Circle) { this.fg.controls['OFC'].setValue(latestGiven.Circle); }
        }

        // Find earliest upcoming vaccine (for NextVisitDate)
        var upcoming: any[] = schedules.filter(function(s) { return !s.IsDone && !s.IsSkip; });
        var nextVaccine: any = null;
        for (var j = 0; j < upcoming.length; j++) {
          if (!nextVaccine) {
            nextVaccine = upcoming[j];
          } else {
            if (parseDay(upcoming[j].Date) < parseDay(nextVaccine.Date)) { nextVaccine = upcoming[j]; }
          }
        }
        if (nextVaccine && nextVaccine.Date) {
          this.fg.controls['NextVisitDate'].setValue(pickerDate(nextVaccine.Date));
        }
      },
      function(_err) {}
    );
  }

  async addFollowUp() {
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.ChildId = this.route.snapshot.paramMap.get('id');
    if (this.fg.value.NextVisitDate) {
      // A day: the picked calendar day at 00:00:00, never shifted through a zone
      const nv = this.fg.value.NextVisitDate;
      this.fg.value.NextVisitDate = (nv instanceof Date ? dayFromPicker(nv) : parseDay(nv)) + 'T00:00:00';
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
    return toLegacyDay(today());
  }
}