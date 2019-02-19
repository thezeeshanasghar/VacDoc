import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage {


  childs: any;
  constructor(
    public loadingController: LoadingController,
    private childService: ChildService,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService
  ) { }

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.getAllChlid(2);
    });
  }

  async getAllChlid(id) {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.childService.getChild(id).subscribe(
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

  // Alert Msg Show for deletion of Child
  alertDeletevaccine(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
      .then((yes) => {
        if (yes) {
          console.log(id)
          this.Deletevacc(id);
        }
      });

  }

  // Call api to delete a Child 
  async Deletevacc(id) {
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
          this.toastService.create(res.Message);
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err)
      }
    );
  }

}
