import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { PaService } from 'src/app/services/pa.service';
@Component({
  selector: 'app-paaccess',
  templateUrl: './paaccess.page.html',
  styleUrls: ['./paaccess.page.scss'],
})
export class PaAccessPage implements OnInit {
  fg: FormGroup; // Form group for validation
  personalAssistants: any[] = []; // List of PAs
  clinics: any[] = []; // List of clinics
  selectedPA: string = ''; // Selected PA ID
  selectedClinic: string = ''; // Selected Clinic ID
    // toastService: any;
    clinicId: any;
    selectedClinicId: any;
    // clinicService: any;
    // loadingController: any;
    doctorId: any;
    clinic: any;

  constructor(
    private fb: FormBuilder,
    public loadingController: LoadingController,
    private storage: Storage,
    private paService: PaService,
    private toastService: ToastService,
    private clinicService: ClinicService,
  ) {}

  ngOnInit() {
    // Initialize the form group
    this.fg = this.fb.group({
      pa: ['', Validators.required],
      clinic: ['', Validators.required],
    });

    // Load dropdown data
    this.loadPersonalAssistants();
        this.storage.get(environment.DOCTOR_Id).then((val) => {
          console.log('Doctor ID:', val);
          this.doctorId = val;
          this.loadClinics(this.doctorId);
        });
  }

 async loadPersonalAssistants() {
    // Mock data for PAs (replace with API call)
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
//   async fetchPersonalAssistants() {
//     const loading = await this.loadingController.create({
//       message: 'Loading Personal Assistants...',
//     });
//     await loading.present();

//     this.paService.getPAsByDoctorId(this.doctorId).subscribe({
//       next: (res) => {
//         console.log('Response:', res);
//         loading.dismiss();
//           this.personalAssistants = res;
//           console.log('Personal Assistants:', this.personalAssistants);
        
//       },
//       error: (err) => {
//         loading.dismiss();
//         this.toastService.create('Error fetching Personal Assistants', 'danger');
//         console.error(err);
//       },
//     });
//   }

  async loadClinics(id: number) {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();

      this.clinicService.getClinics(Number(id)).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            console.log('Clinics:', this.clinics);
           
              console.log('Clinic ID:', this.clinicId);
              this.clinic = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
            //   if (this.selectedClinicId) {
            //     this.getBrandAmount(this.selectedClinicId);
            //   }
          
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
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  onPADropdownChange(event: any) {
    this.selectedPA = event.detail.value;
    console.log('Selected PA:', event.detail.value);
    console.log('Selected PA:', this.selectedPA);
  }

  onClinicDropdownChange(event: any) {
    this.selectedClinic = event.detail.value;
    console.log('Selected PA:', event.detail.value);
    console.log('Selected Clinic:', this.selectedClinic);
  }

    async submit() {
    if (this.fg.valid) {
      const loading = await this.loadingController.create({
        message: 'Submitting...',
      });
      await loading.present();
      this.paService.addPAAccess({ PersonalAssistantId: this.selectedPA, clinicId: this.selectedClinic }).subscribe({
          next: (response) => {
            loading.dismiss();
          
              this.toastService.create('PA Access added successfully', 'success');
              console.log('Response:', response);
           
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error adding PA access:', error);
            this.toastService.create(error.error.message, 'danger');
          },
        });
      console.log('Form Submitted:', {
        selectedPA: this.selectedPA,
        selectedClinic: this.selectedClinic,
      });
      loading.dismiss();
    } else {
      console.error('Form is invalid');
    }
  }
}