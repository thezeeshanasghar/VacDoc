import { Component, OnInit } from '@angular/core';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {
//random commit
  child: any;
  fg: FormGroup;
  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public childService: ChildService,
    private toastService: ToastService,
  ) {
  }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      'Id': [null],
      'ClinicId': [null],
      'Name': [null],
      'FatherName': [null],
      'Email': [null],
      'DOB': [null],
      'MobileNumber': [null],
      'PreferredDayOfWeek': [null],
      'Gender': [null],
      'City': [null],
      'PreferredDayOfReminder': 0,
      'IsEPIDone': [null],
      'IsVerified': [null],
      'PreferredSchedule': [null]
    });
    this.getchild();
  }

  updateGender(gender) {
    this.fg.value.Gender = gender;
  }
  async getchild() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.childService.getChildById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          this.child = res.ResponseData;
          loading.dismiss();
          this.fg.controls['Id'].setValue(this.child.Id);
          this.fg.controls['ClinicId'].setValue(this.child.ClinicId);
          this.fg.controls['Name'].setValue(this.child.Name);
          this.fg.controls['FatherName'].setValue(this.child.FatherName);
          this.fg.controls['Email'].setValue(this.child.Email);
          this.fg.controls['DOB'].setValue(this.child.DOB);
          this.fg.controls['MobileNumber'].setValue(this.child.MobileNumber);
          this.fg.controls['PreferredDayOfWeek'].setValue(this.child.PreferredDayOfWeek);
          this.fg.controls['Gender'].setValue(this.child.Gender);
          this.fg.controls['City'].setValue(this.child.City);
          this.fg.controls['PreferredDayOfReminder'].setValue(this.child.PreferredDayOfReminder + '');
          this.fg.controls['PreferredSchedule'].setValue(this.child.PreferredSchedule);
          this.fg.controls['IsEPIDone'].setValue(this.child.IsEPIDone);
          this.fg.controls['IsVerified'].setValue(this.child.IsVerified);
          console.log(this.fg.value);
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger')
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }

  async editChild() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.childService.editChild(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("successfully updated");

          this.router.navigate(['/members/child/']);
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
}
