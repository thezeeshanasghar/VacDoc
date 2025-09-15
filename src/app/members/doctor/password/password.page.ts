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
import { PaService } from 'src/app/services/pa.service';
@Component({
  selector: 'app-password',
  templateUrl: './password.page.html',
  styleUrls: ['./password.page.scss'],
})
export class PasswordPage implements OnInit {

  fg: FormGroup;
  matching_passwords_group: FormGroup;
  userId: any;
  clinics: any;
  selectedClinicId: any;
  usertype: any;
  doctorId: any;
  // router: any;
  constructor(
    private formBuilder: FormBuilder,
    public loadingController: LoadingController,
    private storage: Storage,
    private loginService: LoginService,
    private toastService: ToastService,
    private router: Router,
    public clinicService: ClinicService,
    private paService: PaService,
  ) { }

  async ngOnInit() {
    // Initialize form first to prevent template errors
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

    // Then load user data and clinics
    await this.storage.get(environment.USER_Id).then((val) => {
      this.userId = val;
    });
    await this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
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
        this.toastService.create('Successfully Updated');
        this.endSession(); 
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
endSession() {
  this.storage.remove(environment.USER_Id);
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

  async loadClinics() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('Clinics:', this.clinics);
              // Check if there's already an online clinic from storage or API response
              let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                    if (onlineClinic) {
                      this.selectedClinicId = onlineClinic.Id;
                      this.clinicService.updateClinic(onlineClinic);
                      console.log('Found online clinic from storage:', onlineClinic.Name);
                    }
                  }
                });
              }
              
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('Selected Clinic ID:', this.selectedClinicId);
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('PA Clinics:', this.clinics);
              // Check if there's already an online clinic from storage or API response
              let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                    if (onlineClinic) {
                      this.selectedClinicId = onlineClinic.Id;
                      this.clinicService.updateClinic(onlineClinic);
                      console.log('Found online clinic from storage:', onlineClinic.Name);
                    }
                  }
                });
              }
              
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('Selected PA Clinic ID:', this.selectedClinicId);
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.selectedClinicId = clinicId;
    this.setOnlineClinic(clinicId);
  }

  async setOnlineClinic(clinicId: any) {
    const loading = await this.loadingController.create({ message: "Setting clinic online..." });
    await loading.present();
    
    let data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
    
    try {
      await this.clinicService.changeOnlineClinic(data).subscribe(
        (res) => {
          if (res.IsSuccess) {
            loading.dismiss();
            // Update local storage
            this.storage.set(environment.CLINIC_Id, data.Id);
            this.storage.get(environment.CLINICS).then((clinics) => {
              const selectedClinic = clinics.find((clinic) => clinic.Id === data.Id);
              this.storage.set(environment.ON_CLINIC, selectedClinic);
              this.clinicService.updateClinic(selectedClinic);
            });
            this.toastService.create('Clinic set as online successfully', 'success');
            console.log('Online clinic set to:', clinicId);
          } else {
            loading.dismiss();
            this.toastService.create(res.Message, 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to set clinic online', 'danger');
          console.error('Error setting clinic online:', err);
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('An error occurred', 'danger');
      console.error('Error in setOnlineClinic:', error);
    }
  }

}

