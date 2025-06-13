import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from '../../../../environments/environment';
import { PaService } from 'src/app/services/pa.service';
import { Router } from '@angular/router';

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
}