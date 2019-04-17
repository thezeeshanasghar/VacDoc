import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MessageService } from 'src/app/services/message.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-cmsg',
  templateUrl: './cmsg.page.html',
  styleUrls: ['./cmsg.page.scss'],
})
export class CMsgPage implements OnInit {

  fg: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private msgService: MessageService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      MobileNumber: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('[0-9]{10}$')
      ])),
      'SMS': [null, Validators.required]
    });
  }

  async sendMsg() {
    const loading = await this.loadingController.create({
      message: 'loading'
    });
    await loading.present();
    await this.msgService.sendMsg(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/child']);
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      });
  }

  validation_messages = {
    'mobileNumber': [
      { type: 'required', message: 'Mobile number is required like 3331231231' },
      { type: 'pattern', message: 'Mobile number is required like 3331231231' }
    ],
    'Msg': [
      { type: 'required', message: 'Msg is required.' }
    ],
  };

}
