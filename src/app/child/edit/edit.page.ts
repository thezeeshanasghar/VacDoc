import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {

  fg: FormGroup;
  child:any
  constructor(
    public loadingController: LoadingController,
    public router: Router,
    public route: ActivatedRoute,
    private api: ChildService,
    private toast: ToastService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      'ID': [null],
      'ClinicID': [null],
      'Name': [null],
      'FatherName': [null],
      'Email': [null],
      'DOB': [null],
      'MobileNumber': [null],
      'PreferredDayOfWeek': [null],
      'Gender': [null],
      'City': [null],
      'PreferredDayOfReminder':[null],
      'IsEPIDone': [null],
      'IsVerified': [null],
      'PreferredSchedule':[null]
    });
    this.getchild();
  }

  async getchild() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getChildById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
        this.child = res.ResponseData;
        loading.dismiss();
        this.fg.controls['ID'].setValue(this.child.ID);
        this.fg.controls['ClinicID'].setValue(this.child.ClinicID);
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
        this.fg.controls['IsEPIDone'].setValue(this.child.IsEPIDone );
        this.fg.controls['IsVerified'].setValue(this.child.IsVerified);
        }
        else{
          loading.dismiss();
          this.toast.create(res.Message)
        }
      },
      err => {
        loading.dismiss();
        this.toast.create(err);
      }
    );
  }

  async editChild() {
    await this.api.editChild(this.fg.value)
      .subscribe(res => {
        if(res.IsSuccess){
          this.router.navigate(['/child/']);
        }
        else{
          this.toast.create(res.Message);
        }
      }, (err) => {
        this.toast.create(err)
      });
  }

  mcqAnswer(value){
    console.log(value)
  }
}
