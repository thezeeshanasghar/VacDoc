import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
// import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from '../../../../environments/environment';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { PaService } from 'src/app/services/pa.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { AbstractControl, ValidatorFn } from '@angular/forms';



@Component({
  selector: 'app-PersonalAssistant',
  templateUrl: './personal-assistant.page.html',
  styleUrls: ['./personal-assistant.page.scss'],
})
export class PersonalAssistantPage implements OnInit {
  doctorId: string;
  personalAssistants: any[] = []; // Array to store the fetched PAs
  AllowAlert: boolean;
  AllowAnalytics: boolean;
  AllowClinic: boolean;
  AllowChild: boolean;
  AllowSchedule: boolean;
  AllowStock: boolean;
  AllowVacation: boolean;
  IsVerified: boolean;

  constructor(
    private paService: PaService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchPersonalAssistants();
    this.storage.get(environment.DOCTOR_Id).then((id) => {
      this.doctorId = id;
      console.log('Doctor ID:', this.doctorId);
      if (this.doctorId) {
        this.fetchPersonalAssistants();
      } else {
        this.toastService.create('Doctor ID not found', 'danger');
      }
    });
  }

  async updatePA(pa: any) {
    console.log('Update PA button clicked for:', pa);
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    // Example: Access all checkbox values for the selected PA
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
        console.log('Response:', res.message);
        this.toastService.create(res.message, 'success');
         // Refresh the list of personal assistants after update
        loading.dismiss();
          this.personalAssistants = res;
          console.log('Personal Assistants:', this.personalAssistants);
          this.fetchPersonalAssistants();
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Error fetching Personal Assistants', 'danger');
        console.error(err);
      },
    });
  
    // Navigate to the update page or handle the update logic
    // Example: this.router.navigate(['/members/doctor/personal-assistant/update'], { queryParams: { paId: pa.id } });
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
          this.toastService.create(res.message, 'success'); 
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Error fetching Personal Assistants', 'danger');
        console.error(err);
      },
    });
  }
}