import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/app/services/schedule.service";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { Router, RouterLink } from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  FormArray,
  FormControl,
  Validators
} from "@angular/forms";
import { DoseService } from "src/app/services/dose.service";
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";
@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.page.html",
  styleUrls: ["./schedule.page.scss"]
})
export class SchedulePage implements OnInit {
  fg: FormGroup;
  doses: any;
  vaccines: any;
  // alphabetically: any;
  IsActive = true;
  clinics: any;
  selectedClinicId: any;
  usertype: any;
  doctorId: any;
  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
    public clinicService: ClinicService,
    private paService: PaService,
  ) { }
  ngOnInit() { }

  async ionViewDidEnter() {
    this.fg = this.formBuilder.group({}); // Initialize the form group
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
      this.getSchedule(val); // Fetch data and initialize form controls
    });
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
  }

  onSubmit() {
    this.addCustomSchedule();
  }

  async getSchedule(id) {
    let loading = await this.loadingcontroller.create({
      message: "Loading Schedule"
    });

    await loading.present();
    await this.scheduleService.getSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
          console.log(this.doses)
          this.doses.forEach(dose => {
            let value = dose.GapInDays == null ? 0 : dose.GapInDays;
            this.fg.addControl(
              dose.Dose.Name,
              new FormControl(value, Validators.required)
            );
          });
          loading.dismiss();

        } else {
          loading.dismiss();
          // this.toastService.create(res.Message, "danger");
          // this.router.navigate(["./members/doctor/schedule/addschedule"]);
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
  returnZero() {
    return 0
  }
  async addCustomSchedule() {
    let var1 = [];
    let var2=[]

    for (let i = 0; i < this.doses.length; i++) {
    
      if (this.doses[i].IsActive==true) { // Check if dose is selected
        var1.push({
          Id: this.doses[i].Id,
          DoseId: this.doses[i].DoseId,
          DoctorId: this.doses[i].DoctorId,
          GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name]),
          IsActive: this.doses[i].IsActive
        });
      }
      else if (this.doses[i].IsActive==false) { // Check if dose is selected
        var2.push({
          Id: this.doses[i].Id,
          DoseId: this.doses[i].DoseId,
          DoctorId: this.doses[i].DoctorId,
          GapInDays: parseInt(this.fg.value[this.doses[i].Dose.Name]),
          IsActive: this.doses[i].IsActive
        });
      }
      else{
        console.log('hello else called')
      }
    }
    const loading = await this.loadingcontroller.create({
      message: "Loading"
    });

    await loading.present();
    console.log('var1',var1)
    console.log('var2',var2)
    loading.dismiss();
    await this.scheduleService.putDoctorSchedule(var1).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.router.navigate(['/members/doctor/schedule']);
          this.toastService.create("successfully updated");
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
    await this.scheduleService.putDoctorSchedule(var2).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log('2nd success')
        } else {
          console.log('2nd fail')
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async AddSchedule(){
    this.router.navigate(["/addschedule"]);
  }

  async loadClinics() {
    try {
      const loading = await this.loadingcontroller.create({
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

