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
  doctorId: any = null;
  personalAssistants: any[] = [];
  paAccessRecords: any[] = [];
  clinics: any = [];
  selectedClinicId: any;
  usertype: any;
  paAccessId: any;

  constructor(
    private paService: PaService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router,
    public clinicService: ClinicService,
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.usertype = await this.storage.get(environment.USER);
    if (this.doctorId) {
      await this.fetchPersonalAssistants();
      this.loadPAAccessRecords();
    } else {
      this.toastService.create('Doctor ID not found', 'danger');
    }
    await this.loadClinics();
  }

  loadPAAccessRecords() {
    this.paService.getPaaccess(this.doctorId).subscribe({
      next: (res) => { this.paAccessRecords = res || []; },
      error: () => { this.paAccessRecords = []; }
    });
  }

  getClinicsForPA(paId: number): string[] {
    return this.paAccessRecords
      .filter(r => (r.PersonalAssistantId === paId || r.PAId === paId) && r.Clinic)
      .map(r => r.Clinic.Name || r.ClinicName || '');
  }

  navigateToPermissions(pa: any) {
    this.router.navigate(
      ['/members/doctor/personal-assistant/permissions', pa.Id],
      { queryParams: { name: pa.Name || '' } }
    );
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
  
  navigateToEdit(pa: any) {
    this.router.navigate(
      ['/members/doctor/personal-assistant/edit', pa.Id],
      { queryParams: {
          name:   pa.Name  || '',
          email:  pa.Email || '',
          mobile: pa.User  ? pa.User.MobileNumber : ''
      }}
    );
  }

  async toggleActive(pa: any) {
    const loading = await this.loadingController.create({ message: pa.IsActive ? 'Deactivating...' : 'Activating...' });
    await loading.present();
    this.paService.togglePaActive(pa.Id).subscribe({
      next: () => {
        loading.dismiss();
        pa.IsActive = !pa.IsActive;
        const status = pa.IsActive ? 'activated' : 'deactivated';
        this.toastService.create('PA ' + status + ' successfully', 'success');
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to update status', 'danger'); }
    });
  }

  async deletepa(Id: number) {
    const loading = await this.loadingController.create({
      message: "Delete PA...",
    });
    await loading.present();
console.log("Deleting PA with ID:", Id);
    this.paService.deletePA(Id).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create("PA deleted successfully", "success");
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
              let onlineClinic = this.clinics.find((clinic: any) => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find((clinic: any) => clinic.Id === storedOnlineClinic.Id);
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
              let onlineClinic = this.clinics.find((clinic: any) => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find((clinic: any) => clinic.Id === storedOnlineClinic.Id);
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
                this.paAccessId = onlineClinic.PaAccessId;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  const selectedClinic = this.clinics.find((c: any) => c.Id === this.selectedClinicId);
                  if (selectedClinic) {
                    this.paAccessId = selectedClinic.PaAccessId;
                  }
                }
              }
              console.log('Selected PA Clinic ID:', this.selectedClinicId);
              console.log('PaAccessId:', this.paAccessId);
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
    // Find and store PaAccessId for PA users
    if (this.usertype.UserType === 'PA' && this.clinics) {
      const selectedClinic = this.clinics.find((c: any) => c.Id === clinicId);
      if (selectedClinic) {
        this.paAccessId = selectedClinic.PaAccessId;
      }
    }
    this.setOnlineClinic(clinicId);
  }

  async setOnlineClinic(clinicId: any) {
    const loading = await this.loadingController.create({ message: "Setting clinic online..." });
    await loading.present();
    
    if (this.usertype.UserType === "PA") {
      // For PA users, use PaAccess endpoint
      if (!this.paAccessId) {
        // Find PaAccessId from clinics list
        const clinic = this.clinics ? this.clinics.find((c: any) => c.Id === clinicId) : null;
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
            // Update local storage
            this.storage.set(environment.CLINIC_Id, clinicId);
            const selectedClinic = this.clinics.find((c: any) => c.Id === clinicId);
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
          this.toastService.create((err.error && err.error.message) || 'Failed to set clinic online', 'danger');
          console.error('Error setting clinic online:', err);
        }
      );
    } else {
      // For DOCTOR users, use existing endpoint
      let data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
      
      try {
        this.clinicService.changeOnlineClinic(data).subscribe(
          (res) => {
            if (res.IsSuccess) {
              loading.dismiss();
              // Update local storage
              this.storage.set(environment.CLINIC_Id, data.Id);
              this.storage.get(environment.CLINICS).then((clinics) => {
                const selectedClinic = clinics.find((clinic: any) => clinic.Id === data.Id);
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