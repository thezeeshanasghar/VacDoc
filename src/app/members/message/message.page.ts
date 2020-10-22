import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { MessageService } from 'src/app/services/message.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ClinicService } from "src/app/services/clinic.service";
import { SMS } from '@ionic-native/sms/ngx';

@Component({
  selector: 'app-message',
  templateUrl: './message.page.html',
  styleUrls: ['./message.page.scss'],
})
export class MessagePage implements OnInit {

  message: any;
  Messages: any;
  constructor(
    public loadingController: LoadingController,
    private messageService: MessageService,
    private toastService: ToastService,
    private storage: Storage,
    public clinicService: ClinicService,
    private sms: SMS
  ) { }

  ngOnInit() {
    // this.storage.get(environment.DOCTOR_Id).then((val) => {
    //   this.getMsg(val);
    // });
    this.storage.get(environment.MESSAGES).then(messages=> {this.Messages = messages});
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
  sendMessage(childMobile , message , created) {
    this.sms.send(childMobile, message)
          .then(()=>{
            let obj = {'toNumber':childMobile , 'message': message , 'created': Date.now(), 'status':true};
            this.Messages = this.Messages.filter(x=> x.created != created);
            this.Messages.push(obj);
            this.storage.set(environment.MESSAGES , this.Messages);
          this.toastService.create("Message Sent Successful");
          }).catch((error)=>{
          this.toastService.create("Message Sent Failed" , "danger");
          });
  }
}
