import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {

  MobileNumber: string = '';
  CountryCode: string = '+92';

  constructor(
    public router: Router,
    private loginService: LoginService,
    private toastService: ToastService,
    private loadingController: LoadingController
  ) { }

  ngOnInit() { }

  async sendPassword() {
    const mobile = (this.MobileNumber || '').trim();
    if (!mobile) {
      this.toastService.create('Please enter your mobile number', 'danger');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Sending...' });
    await loading.present();

    const payload = {
      MobileNumber: mobile,
      CountryCode: this.CountryCode,
      UserType: 'DOCTOR'
    };

    this.loginService.forgotPassword(JSON.stringify(payload)).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create('Your password has been sent to your mobile number and email address');
        this.router.navigate(['/login']);
      },
      err => {
        loading.dismiss();
        const msg = (err && err.error && err.error.message) ? err.error.message : 'Failed to send password. Please check your mobile number.';
        this.toastService.create(msg, 'danger');
      }
    );
  }

}
