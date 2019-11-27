import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { MessageService } from 'src/app/services/message.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-message',
  templateUrl: './message.page.html',
  styleUrls: ['./message.page.scss'],
})
export class MessagePage implements OnInit {

  message: any;
  constructor(
    public loadingController: LoadingController,
    private messageService: MessageService,
    private toastService: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.getMsg(val);
    });
  }

  async getMsg(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.messageService.getMessages(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.message = res.ResponseData;
          loading.dismiss();
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
}
