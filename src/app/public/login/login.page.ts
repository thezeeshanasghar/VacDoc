import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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
  constructor(
    public router: Router,
    public alertController: AlertController,
    private formBuilder: FormBuilder,
    private loginservice: LoginService,
    private toastService: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.loginservice.changeState(false);
    this.fg = this.formBuilder.group({
      'MobileNumber': [null, Validators.required],
      'Password': [null, Validators.required],
      'CountryCode': ['92'],
      'UserType': ['DOCTOR']
    });
  }

  async login() {
    await this.loginservice.checkAuth(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.storage.set(environment.DOCTOR_ID, res.ResponseData.DoctorID);
          this.loginservice.changeState(true);
          this.router.navigate(['/members/']);
        }
        else {
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        this.toastService.create(err, 'danger');
      });
  }


}
