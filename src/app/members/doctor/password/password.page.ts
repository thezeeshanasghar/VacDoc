import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.page.html',
  styleUrls: ['./password.page.scss'],
})
export class PasswordPage implements OnInit {

  fg: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      'OldPassword': [null],
      'NewPassword': [null],
      'ConfirmPassword': [null],
    });
  }
  async addNewChild() {
    await this.loginService.ChangePassword(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.toastService.create('successfully added');
        }
        else {
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        this.toastService.create(err, 'danger')
      });
  }
}
