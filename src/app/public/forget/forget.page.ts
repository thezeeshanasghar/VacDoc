import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { IonRouterOutlet, Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { App } = Plugins;

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {
  

  obj:any;
  forgot = false;
  MobileNumber: number;
  constructor( public router: Router,
    public alertController: AlertController,
    private loginservice: LoginService,
    private toastService: ToastService,
    private storage: Storage,
    private loadingController: LoadingController,
    private platform: Platform,
    private routerOutlet: IonRouterOutlet) { }

  ngOnInit() {
  }

  async sendPassword() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
  let data = {
  "MobileNumber": this.MobileNumber,
  "CountryCode": "92",
  "UserType": "DOCTOR"
  }
    await loading.present();
    this.loginservice.forgotPassword(data).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log(res.ResponseData);
          loading.dismiss();
          this.forgot = false;
          this.router.navigate(['/login']);
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
    );
      }

}
