import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage implements OnInit {


  childs: any;
  constructor(
    public loadingController: LoadingController,
    private childService: ChildService,
    private toastService: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.getAllChlid(1137);
      console.log(val);
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
          console.log(this.childs);
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
