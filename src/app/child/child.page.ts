import { Component, OnInit } from '@angular/core';
import { ClinicService } from '../services/clinic.service';
import { LoadingController } from '@ionic/angular';
import { ChildService } from '../services/child.service';
import { ToastService } from '../shared/toast.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage implements OnInit {

  Childs: any;
  constructor(
    public loadingController: LoadingController,
    private api: ChildService,
    private toast: ToastService,
    private storage: Storage
  ) { 
  }

  ngOnInit() {
    this.storage.get("ID").then((val) => {
      this.getchild(val);
    });

  }

  async getchild(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getChild(id).subscribe(
      res => {
        this.Childs = res.ResponseData;
        loading.dismiss();
      },
      err => {
        console.log(err);
        loading.dismiss();
        this.toast.create(err);
      }
    );
  }
}
