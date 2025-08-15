// import { Component, OnInit } from '@angular/core';
// import { ClinicService } from "src/app/services/clinic.service";
import { Router } from '@angular/router';
// import { ToastService } from "src/app/shared/toast.service";
import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { AlertService } from "src/app/services/alert.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { CallNumber } from '@ionic-native/call-number/ngx';
import { TitleCasePipe } from '@angular/common';
import { SMS } from '@ionic-native/sms/ngx';
// import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Platform } from '@ionic/angular';
import { DoctorService } from "src/app/services/doctor.service";
import { VaccineService } from 'src/app/services/vaccine.service'; 
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";
// import { Console } from 'console';
@Component({
  selector: 'app-alert',
  templateUrl: './alert.page.html',
  styleUrls: ['./alert.page.scss'],
})
export class AlertPage implements OnInit {
 showClinicDropdown: boolean = false;
   doctorId: any;
  clinicId: any;
  SMSKey: any;
  displayName: any;
  clinicName: any;
  clinicPhoneNumber: any;
  formattedDate: string;
  Childs: any;
  private readonly API_VACCINE = `${environment.BASE_URL}`;
  Messages = [];
  numOfDays: number = 0;
  selectedDate: string = new Date().toISOString();
  usertype: any;
  clinics: any;
  selectedClinicId: any;
  constructor(
  // public clinicService: ClinicService,
              private router: Router,
              // private toastService: ToastService,
                  public loadingController: LoadingController,
    private alertService: AlertService,
    private doctorService: DoctorService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private callNumber: CallNumber,
    private titlecasePipe: TitleCasePipe,
    private sms: SMS,
    // private downloader: Downloader,
    public platform: Platform,
    private vaccineService: VaccineService,
    private clinicService: ClinicService,
    private paService: PaService
  ) { }

  ngOnInit() {
     this.showClinicDropdown = this.router.url.includes('members/alert/vaccine-alert');
  console.log('Show Clinic Dropdown:', this.showClinicDropdown);
    }

  // async loadClinics() {
  //   try {
  //     const loading = await this.loadingController.create({
  //       message: 'Loading clinics...',
  //     });
  //     await loading.present();
  //     if (this.usertype.UserType === 'DOCTOR') {
  //       this.clinicService.getClinics(Number(this.doctorId)).subscribe({
  //         next: (response) => {
  //           loading.dismiss();
  //           if (response.IsSuccess) {
  //             this.clinics = response.ResponseData;
  //             // console.log('Clinics:', this.clinics);
  //             this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
  //             // console.log('Selected Clinic ID:', this.selectedClinicId);
  //             if (this.selectedClinicId) {
  //               // this.getChlid(this.numOfDays, this.formattedDate);
  //               this.clinicId = this.selectedClinicId;
  //             }
  //           } else {
  //             this.toastService.create(response.Message, 'danger');
  //           }
  //         },
  //         error: (error) => {
  //           loading.dismiss();
  //           console.error('Error fetching clinics:', error);
  //           this.toastService.create('Failed to load clinics', 'danger');
  //         },
  //       });
  //     } else if (this.usertype.UserType === 'PA') {
  //       this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
  //         next: (response) => {
  //           loading.dismiss();
  //           if (response.IsSuccess) {
  //             this.clinics = response.ResponseData;
  //             // console.log('PA Clinics:', this.clinics);
  //             this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
  //             // console.log('Selected PA Clinic ID:', this.selectedClinicId);
  //             if (this.selectedClinicId) {
  //             //  this.getChlid(this.numOfDays, this.formattedDate);
  //               this.clinicId = this.selectedClinicId;
  //             }
  //           } else {
  //             this.toastService.create(response.Message, 'danger');
  //           }
  //         },
  //         error: (error) => {
  //           loading.dismiss();
  //           console.error('Error fetching PA clinics:', error);
  //           this.toastService.create('Failed to load clinics', 'danger');
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error in loadClinics:', error);
  //     this.toastService.create('An unexpected error occurred', 'danger');
  //   }
  // }

}
