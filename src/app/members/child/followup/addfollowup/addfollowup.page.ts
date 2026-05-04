import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { VacDatePickerService } from 'src/app/shared/vac-datepicker/vac-datepicker.service';
import * as moment from 'moment';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowupService } from 'src/app/services/followup.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';

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
    private vaccineService: VaccineService,
    private datePicker: VacDatePickerService
  ) {
    this.minDate = moment().format('YYYY-MM-DD');
    this.maxDate = moment().add(20, 'years').format('YYYY-MM-DD');
  }


  openNextVisit() {
    this.datePicker.open(this.fg.get('NextVisitDate').value, { min: new Date(this.minDate), max: new Date(this.maxDate) }).subscribe((date: Date | null) => {
      if (date) { this.fg.patchValue({ NextVisitDate: date }); }
    });
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
    this.loadVaccineDefaults();
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
            var a = moment(latestGiven.GivenDate, 'DD-MM-YYYY');
            var b = moment(given[i].GivenDate, 'DD-MM-YYYY');
            if (b.isAfter(a)) { latestGiven = given[i]; }
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
            var c = moment(nextVaccine.Date, 'DD-MM-YYYY');
            var d = moment(upcoming[j].Date, 'DD-MM-YYYY');
            if (d.isBefore(c)) { nextVaccine = upcoming[j]; }
          }
        }
        if (nextVaccine && nextVaccine.Date) {
          var nextDate = moment(nextVaccine.Date, 'DD-MM-YYYY').toDate();
          this.fg.controls['NextVisitDate'].setValue(nextDate);
        }
      },
      function(_err) {}
    );
  }

  async addFollowUp() {
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.ChildId = this.route.snapshot.paramMap.get('id');
    if (this.fg.value.NextVisitDate) {
      // Append 00:00:00 to NextVisitDate
      this.fg.value.NextVisitDate = moment(this.fg.value.NextVisitDate)
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .format('YYYY-MM-DDTHH:mm:ss');
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