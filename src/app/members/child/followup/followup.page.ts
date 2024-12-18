import { Component, OnInit } from '@angular/core';
import { FollowupService } from 'src/app/services/followup.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/shared/alert.service';
@Component({
  selector: 'app-followup',
  templateUrl: './followup.page.html',
  styleUrls: ['./followup.page.scss'],
})
export class FollowupPage implements OnInit {

  childData: any;
  doctorId: any;
  childId: any;
  constructor(
    public route: ActivatedRoute,
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.childId = this.route.snapshot.paramMap.get('id');
    this.getfollowupchild();
  }

  async getfollowupchild() {
    let data = { 'ChildId': this.childId, 'DoctorId': this.doctorId }
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.followupService.getFollowupByChild(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.childData = res.ResponseData;
          loading.dismiss();
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
  // async Deletechild(id) {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   await this.childService.deleteChild(id).subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //         this.toastService.create(res.Message);
  //         this.getChlidByClinic(true);
  //         loading.dismiss();
  //       }
  //       else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, 'danger');
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, 'danger')
  //     }
  //   );
  // }
  async alertforDeleteFollowup(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
      .then((yes) => {
        if (yes) {
          this.Deletechild(id);
        }
      });
  }
  async Deletechild(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.followupService.deleteFollowupById(id).subscribe(
      res => {
        if (res) {
          this.toastService.create(res.Message);
          this.getfollowupchild();
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
  
}
