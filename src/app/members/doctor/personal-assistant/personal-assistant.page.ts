import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from '../../../../environments/environment';
import { PaService } from 'src/app/services/pa.service';
import { Router } from '@angular/router';
import { ClinicService } from 'src/app/services/clinic.service';

@Component({
  selector: 'app-PersonalAssistant',
  templateUrl: './personal-assistant.page.html',
  styleUrls: ['./personal-assistant.page.scss'],
})
export class PersonalAssistantPage implements OnInit {
  doctorId: string;
  personalAssistants: any[] = [];
  AllowAlert: boolean;
  AllowAnalytics: boolean;
  AllowClinic: boolean;
  AllowChild: boolean;
  AllowSchedule: boolean;
  AllowStock: boolean;
  AllowVacation: boolean;
  IsVerified: boolean;
  clinics: any;
  selectedClinicId: any;
  usertype: any;

  constructor(
    private paService: PaService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router,
    public clinicService: ClinicService,
  ) {}

  async ngOnInit() {
    this.fetchPersonalAssistants();
    await this.storage.get(environment.DOCTOR_Id).then((id) => {
      this.doctorId = id;
      console.log('Doctor ID:', this.doctorId);
      if (this.doctorId) {
        this.fetchPersonalAssistants();
      } else {
        this.toastService.create('Doctor ID not found', 'danger');
      }
    });
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
  }

  async updatePA(pa: any) {
    console.log('Update PA button clicked for:', pa);
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    const updatedData = {
      Id: pa.Id,
      AllowAlert: pa.AllowAlert,
      AllowAnalytics: pa.AllowAnalytics,
      AllowClinic: pa.AllowClinic,
      AllowChild: pa.AllowChild,
      AllowSchedule: pa.AllowSchedule,
      AllowStock: pa.AllowStock,
      AllowVacation: pa.AllowVacation,
      IsVerified: pa.IsVerified,
    };
  
    console.log('Updated Data:', updatedData);

    this.paService.editPa(updatedData.Id,updatedData).subscribe({
      next: (res) => {
      loading.dismiss();
      console.log('Response:', res);
      console.log('Response:', res.Message);
      this.toastService.create(res.Message, 'success');
      this.fetchPersonalAssistants();
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Error fetching Personal Assistants', 'danger');
        console.error(err);
      },
    });
  }

  async fetchPersonalAssistants() {
    const loading = await this.loadingController.create({
      message: 'Loading Personal Assistants...',
    });
    await loading.present();

    this.paService.getPAsByDoctorId(this.doctorId).subscribe({
      next: (res) => {
        console.log('Response:', res);
        loading.dismiss();
          this.personalAssistants = res;
          console.log('Personal Assistants:', this.personalAssistants);
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Error fetching Personal Assistants', 'danger');
        console.error(err);
      },
    });
  }
  
  async deletepa(Id: number) {
    const loading = await this.loadingController.create({
      message: "Delete PA...",
    });
    await loading.present();
console.log("Deleting PA with ID:", Id);
    this.paService.deletePA(Id).subscribe({
      next: (res) => {
        loading.dismiss();
          this.toastService.create("PA deleted successfully", "success");
          loading.dismiss();
          this.fetchPersonalAssistants();
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create("Failed to delete PA", "danger");
        console.error(err);
      },
    });
  }

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