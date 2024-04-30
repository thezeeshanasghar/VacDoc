import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { PasswordValidator } from './password_validators';
import { Router } from "@angular/router";
import { ClinicService } from "../../../services/clinic.service";
@Component({
  selector: 'app-password',
  templateUrl: './password.page.html',
  styleUrls: ['./password.page.scss'],
})
export class PasswordPage implements OnInit {

  fg: FormGroup;
  matching_passwords_group: FormGroup;
  userId: any;
  clinicService: any;
  // router: any;
  constructor(
    private formBuilder: FormBuilder,
    public loadingController: LoadingController,
    private storage: Storage,
    private loginService: LoginService,
    private toastService: ToastService,
    private router: Router 
  ) { }

  ngOnInit() {
    this.storage.get(environment.USER_Id).then((val) => {
      this.userId = val;
    });

    this.matching_passwords_group = new FormGroup({
      password: new FormControl('', Validators.compose([
        Validators.minLength(4),
        Validators.required,
      ])),
      confirm_password: new FormControl('', Validators.required)
    }, (formGroup: FormGroup) => {
      return PasswordValidator.areEqual(formGroup);
    });

    this.fg = this.formBuilder.group({
      'UserId': [null],
      'OldPassword': new FormControl('', Validators.required),
      'NewPassword': [null],
      matching_passwords: this.matching_passwords_group,
    });
  }
  async changePassword() {
    this.fg.value.UserId = this.userId;
    this.fg.value.NewPassword = this.matching_passwords_group.value.password;
    console.log(this.fg.value);
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    console.log(this.fg.value);
    await this.loginService.ChangePassword(this.fg.value)
    .subscribe(res => {
      if (res.IsSuccess) {
        loading.dismiss();
        this.clearStorage(); // Call clearStorage function
        this.toastService.create('Successfully Updated');
        this.router.navigate(['/login']);
      } else {
        loading.dismiss();
        this.toastService.create(res.Message, 'danger');
      }
    }, (err) => {
      loading.dismiss();
      this.toastService.create(err, 'danger');
    });
}

clearStorage() {
  this.storage.clear().then(() => {
    this.clinicService.clinics = null;
    this.clinicService.doctorId = null;
    this.clinicService.OnlineClinicId = null;
    
  }).catch((error) => {
    console.error('Error clearing storage:', error);
  });
}

   validation_messages = {
    'old_password': [
      { type: 'required', message: 'Old password is required.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 4 characters long.' },
    ],
    'confirm_password': [
      { type: 'required', message: 'Confirm password is required.' }
    ],
    'matching_passwords': [
      { type: 'areEqual', message: 'Password mismatch.' }
    ],
  };

}

