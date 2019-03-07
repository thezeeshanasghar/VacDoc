import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-password',
  templateUrl: './password.page.html',
  styleUrls: ['./password.page.scss'],
})
export class PasswordPage implements OnInit {

  fg: FormGroup;
  userID: any;
  constructor(
    private formBuilder: FormBuilder,
    public loadingController: LoadingController,
    private storage: Storage,
    private loginService: LoginService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.storage.get(environment.USER_ID).then((val) => {
      this.userID = val;
    })
    this.fg = this.formBuilder.group({
      'OldPassword': [null],
      'NewPassword': [null],
      'UserID': [null],
    });
  }
  async changePassword() {
    this.fg.value.UserID = this.userID;
    console.log(this.fg.value);
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    console.log(this.fg.value);
    await this.loginService.ChangePassword(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create('successfully Updated');
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
}
