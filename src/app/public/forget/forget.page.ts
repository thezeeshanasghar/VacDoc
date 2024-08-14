import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { DoctorService } from 'src/app/services/doctor.service';
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
  
  Email: string;
  constructor( public router: Router,
    public alertController: AlertController,
    private doctorservice: DoctorService,
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

    await loading.present();
    await this.doctorservice.forgotPassword(JSON.stringify(this.Email)).subscribe(
      res => {
        console.log(res);
        loading.dismiss();
        this.toastService.create("Id and Password has been sent to you email")
        this.router.navigate(['/login']);
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
      }

}
