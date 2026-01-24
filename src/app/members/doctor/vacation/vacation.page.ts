import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { VacationService } from 'src/app/services/vacation.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { PaService } from 'src/app/services/pa.service';

@Component({
  selector: 'app-vacation',
  templateUrl: './vacation.page.html',
  styleUrls: ['./vacation.page.scss'],
})
export class VacationPage implements OnInit {
  fg2: FormGroup;
  clinics: any = [];
  DoctorId: any;
  ClinicId: any = [];
  todaydate;
  selectedClinicId: any;
  usertype: any;
  paAccessId: any; // Store PaAccessId for PA users

  constructor(
    public loadingController: LoadingController,
    private router: Router,
    public formBuilder: FormBuilder,
    private storage: Storage,
    public clinicService: ClinicService,
    private vacationService: VacationService,
    private toastService: ToastService,
    private http: HttpClient,
    private paService: PaService

  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);
    this.fg2 = this.formBuilder.group({
      clinics: new FormArray([]),
      'formDate': [this.todaydate],
      'ToDate': [this.todaydate]
    });
  }

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.DoctorId = val;
    });
    this.usertype = await this.storage.get(environment.USER);
    this.getClinics();
  }

  pickFromDate($event) {
    this.fg2.controls['formDate'].setValue($event.detail.value);
  }

  pickTodayDate($event) {
    this.fg2.controls['ToDate'].setValue($event.detail.value);
  }

  getChildVaccinefromUser() {
    this.addVacation()
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: 'Loading Clinics' });
    await loading.present();

    if (this.usertype.UserType === 'DOCTOR') {
      await this.clinicService.getClinics(this.DoctorId).subscribe(
        res => {
          if (res.IsSuccess) {
            this.clinics = res.ResponseData;
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
            const controls = this.clinics.map(c => new FormControl(false));
            this.fg2 = this.formBuilder.group({
              clinics: new FormArray(controls),
               'formDate': [this.todaydate],
               'ToDate': [this.todaydate]
            });
            loading.dismiss();
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
    } else if (this.usertype.UserType === 'PA') {
      await this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe(
        res => {
          if (res.IsSuccess) {
            this.clinics = res.ResponseData;
            // Check if there's already an online clinic from storage or API response
            let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
            
            // If no online clinic found in API response, check storage
            if (!onlineClinic) {
              this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                if (storedOnlineClinic) {
                  onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                  if (onlineClinic) {
                    this.selectedClinicId = onlineClinic.Id;
                    this.paAccessId = onlineClinic.PaAccessId; // Store PaAccessId
                    this.clinicService.updateClinic(onlineClinic);
                    console.log('Found online clinic from storage:', onlineClinic.Name);
                  }
                }
              });
            }
            
            if (onlineClinic) {
              this.selectedClinicId = onlineClinic.Id;
              this.paAccessId = onlineClinic.PaAccessId; // Store PaAccessId
              this.clinicService.updateClinic(onlineClinic);
              console.log('Found online clinic from API:', onlineClinic.Name);
            } else {
              this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
              if (this.selectedClinicId) {
                const selectedClinic = this.clinics.find(c => c.Id === this.selectedClinicId);
                if (selectedClinic) {
                  this.paAccessId = selectedClinic.PaAccessId;
                }
                this.setOnlineClinic(this.selectedClinicId);
              }
            }
            const controls = this.clinics.map(c => new FormControl(false));
            this.fg2 = this.formBuilder.group({
              clinics: new FormArray(controls),
               'formDate': [this.todaydate],
               'ToDate': [this.todaydate]
            });
            loading.dismiss();
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
  // async addVacation() {

  //   const clinicId = 56; // Example clinic IDs
  //   const fromDate = '2024-04-23'; // Example from date
  //   const toDate = '2024-04-24';

  //   this.vacationService.patchChildIdsWithSchedules(clinicId, fromDate, toDate)
  //     .subscribe(
  //       (response) => {
  //         console.log('Data patched successfully:', response);
  //         // Add your success handling code here
  //       },
  //       (error) => {
  //         console.error('Failed to patch data:', error);
  //         // Add your error handling code here
  //       }
  //     );
  
  //   // const loading = await this.loadingController.create({ message: 'Loading' });
  //   // await loading.present();

  //   // await this.vacationService.addVaccation(data)
  //   //   .subscribe(res => {
  //   //     if (res.IsSuccess) {
  //   //       loading.dismiss();
  //   //       this.toastService.create('successfully added');
  //   //       this.router.navigate(['/members/']);
  //   //     }
  //   //     else {
  //   //       loading.dismiss();
  //   //       this.toastService.create(res.Message, 'danger');
  //   //     }
  //   //   }, (err) => {
  //   //     loading.dismiss();
  //   //     this.toastService.create(err, 'danger')
  //   //   });
  // }
  async addVacation() {
    const selectedClinics = this.fg2.value.clinics.reduce((acc, curr, index) => {
      if (curr) acc.push(this.clinics[index].Id);
      return acc;
    }, []);

    const fromDate = moment(this.fg2.value.formDate).format('YYYY-MM-DD');
    const toDate = moment(this.fg2.value.ToDate).format('YYYY-MM-DD');
    console.log(fromDate);
    console.log(toDate);

    selectedClinics.forEach(async clinicId => {
      this.vacationService.patchChildIdsWithSchedules(clinicId, fromDate, toDate)
        .subscribe(
          (response) => {
            console.log('Data patched successfully for clinic ID', clinicId, ':', response);
            this.toastService.create("Vacation Updated Successfully")
          },
          (error) => {
            console.error('Failed to patch data for clinic ID', clinicId, ':', error);
            this.toastService.create(error.error, 'danger')
          }
        );
    });
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
    
    if (this.usertype.UserType === "PA") {
      // For PA users, use PaAccess endpoint
      if (!this.paAccessId) {
        // Find PaAccessId from clinics list
        const clinic = this.clinics ? this.clinics.find(c => c.Id === clinicId) : null;
        if (clinic && clinic.PaAccessId) {
          this.paAccessId = clinic.PaAccessId;
        } else {
          loading.dismiss();
          this.toastService.create("Unable to find clinic access information", "danger");
          return;
        }
      }
      
      this.paService.updatePaClinicOnlineStatus(this.paAccessId, true).subscribe(
        (res) => {
          if (res.IsSuccess || res.message) {
            loading.dismiss();
            this.storage.set(environment.CLINIC_Id, clinicId);
            const selectedClinic = this.clinics.find(c => c.Id === clinicId);
            if (selectedClinic) {
              this.storage.set(environment.ON_CLINIC, selectedClinic);
              this.clinicService.updateClinic(selectedClinic);
            }
            this.toastService.create('Clinic set as online successfully', 'success');
            console.log('Online clinic set to:', clinicId);
          } else {
            loading.dismiss();
            this.toastService.create(res.Message || 'Failed to update clinic status', 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create(err.error?.message || 'Failed to set clinic online', 'danger');
          console.error('Error setting clinic online:', err);
        }
      );
    } else {
      // For DOCTOR users, use existing endpoint
      let data = { DoctorId: this.DoctorId, Id: clinicId, IsOnline: "true" };
      
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
}
// https://coryrylan.com/blog/creating-a-dynamic-checkbox-list-in-angular