import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {


  fg: FormGroup;
  obj:any;
  constructor(
    public router: Router,
    public alertController: AlertController,
    private formBuilder: FormBuilder,
    private loginservice: LoginService,
    private toastService: ToastService,
    private storage: Storage,
    private loadingController: LoadingController,
  ) { }

  ngOnInit() {
    this.skipLoginIfAlreadyLoggedIn();
    this.loginservice.changeState(false);
    this.fg = this.formBuilder.group({
      'MobileNumber': [null, Validators.required],
      'Password': [null, Validators.required],
      'CountryCode': ['92'],
      'UserType': ['DOCTOR']
    });
   
  }

  skipLoginIfAlreadyLoggedIn() {
    this.storage.get(environment.DOCTOR_Id).then(value => {
      if (value) {
        let state = true;
        this.loginservice.changeState(state);
        this.router.navigate(['members/dashboard']);
      }
    });
  }

  async login() {

    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.loginservice.checkAuth(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.storage.set(environment.USER, res.ResponseData);
          this.storage.set(environment.DOCTOR_Id, res.ResponseData.DoctorId);
          this.storage.set(environment.USER_Id, res.ResponseData.Id);
          let state = true;
          this.loginservice.changeState(state);
          this.getdoctorprofile(res.ResponseData.Id);
          this.router.navigate(['/members']);
          loading.dismiss();
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
  async getdoctorprofile(id){
await this.loginservice.getDoctorProfile(id).subscribe(res => 
  {
    if (res.IsSuccess)
    {
      this.storage.set(environment.DOCTOR, res.ResponseData);
    }
});

  }

  async forgotPasswordAlert() {

  }
}
