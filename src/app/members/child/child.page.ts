import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage {

  fg: FormGroup;
  childs: any;
  forMoreChild: string = '0';
  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService
  ) {
    this.fg = this.formBuilder.group({
      Name: [null],
    });
  }

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.getAllChlid();
    });
  }

  async getAllChlid() {
    let id = '2';
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.childService.getChild(id, this.forMoreChild).subscribe(
      res => {
        if (res.IsSuccess) {
          if (this.forMoreChild == '0') {
            this.childs = res.ResponseData
            loading.dismiss();
          }
          else {
            for (let i = 0; i < res.ResponseData.length; i++) {
              this.childs.push(res.ResponseData[i]);
            }
            loading.dismiss();
          }
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

  loadMore() {
    this.forMoreChild = this.forMoreChild + 1;
    this.getAllChlid();
  }

  // Alert Msg Show for deletion of Child
  async alertDeletevaccine() {

  }
  // alertDeletevaccine(id) {
  //   this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
  //     .then((yes) => {
  //       if (yes) {
  //         console.log(id)
  //         this.Deletechild(id);
  //       }
  //     });

  // }

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
          this.getAllChlid(2);
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
    await this.childService.getChildByUserSearch(this.fg.value.Name).subscribe(
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

}
