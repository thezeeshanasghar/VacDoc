import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../shared/toast.service';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  fg: FormGroup;
  constructor(
    public router: Router,
    private formBuilder: FormBuilder,
    private api: LoginService,
    private toast: ToastService,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      'MobileNumber': [null, Validators.required],
      'Password': [null, Validators.required],
      'CountryCode': ['92'],
      'UserType': ['DOCTOR']
    });
  }

  async login() {
    await this.api.checkAuth(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.storage.set('ID', res.ResponseData.ID);
          this.storage.set('DoctorID', res.ResponseData.DoctorID);
          this.router.navigate(['/clinic']);
        }
        else {
          this.toast.create(res.Message);
        }
      }, (err) => {
        console.log(err);
        this.toast.create(err);
      });
  }

}
