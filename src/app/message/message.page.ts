import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { MessageService } from '../services/message.service';
import { Storage } from '@ionic/storage';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.page.html',
  styleUrls: ['./message.page.scss'],
})
export class MessagePage implements OnInit {

  message:any;
  constructor(
    public loadingController: LoadingController,
    private api: MessageService,
    private apiToast: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get("ID").then((val) => {
      this.getmsg(val);
    });
    
  }

  async getmsg(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getMessages(id).subscribe(
      res => {
        this.message = res.ResponseData;
        loading.dismiss();
      },
      err => {
        console.log(err);
        loading.dismiss();
        this.apiToast.create(err);
      }
    );
  }
}
