import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CallNumber } from '@ionic-native/call-number/ngx';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage {

  fg: FormGroup;
  childs: any;
  userId: any;
  doctorId: number;
  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private clinicService: ClinicService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private callNumber: CallNumber
  ) {
    this.fg = this.formBuilder.group({
      Name: [null],
    });
  }
  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
    });
    console.log(this.clinicService.OnlineClinic.Id);
    this.getChlidByClinic(this.clinicService.OnlineClinic.Id);
  }

  // ionViewWillEnter() {
  //   this.storage.get(environment.USER_Id).then((val) => {
  //     this.userId = val;
  //   });
  // }

  // Alert Msg Show for deletion of Child
  async alertforDeleteChild(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
      .then((yes) => {
        if (yes) {
          this.Deletechild(id);
        }
      });
  }

  // Call api to delete a Child 
  async Deletechild(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.childService.deleteChild(id).subscribe(
      res => {
        if (res.IsSuccess == true) {
          this.toastService.create(res.Message);
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      }
    );
  }

  async getChlidbyUser() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.childService.getChildByUserSearch(this.doctorId , this.fg.value.Name).subscribe(
      res => {
        if (res.IsSuccess) {
          this.childs = res.ResponseData
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

  async getChlidByClinic(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.childService.getChildByClinic(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.childs = res.ResponseData
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

  callFunction(celnumber)
  {
    this.callNumber.callNumber(0 + celnumber, true)
    .then(res => console.log('Launched dialer!', res))
    .catch(err => console.log('Error launching dialer', err));
  }
}
