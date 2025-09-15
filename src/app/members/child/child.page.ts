import { Component, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { PaService } from "src/app/services/pa.service";
// import { ClinicService } from 'src/app/services/clinic.service';

@Component({
  selector: 'app-child',
  templateUrl: './child.page.html',
  styleUrls: ['./child.page.scss'],
})
export class ChildPage {
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll: IonInfiniteScroll;
  fg: FormGroup;
  childs: any = [];
  userId: any;
  doctorId: number;
  page: number;
  search: boolean;
  clinic: any;
  usertype: any;
  isSearchDisabled: boolean;
  clinics: any;
  selectedClinicId: any;
  type: any;
  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private callNumber: CallNumber,
    private paService: PaService,
    public clinicService: ClinicService,
  ) {
    this.fg = this.formBuilder.group({
      Name: ["", Validators.required],
       ClinicId: [""],
    });
  }

 async ionViewWillEnter() {
  window.onbeforeunload = () => {
    this.storage.remove('searchInput');
  };
  this.isSearchDisabled = false;

  await this.storage.get(environment.USER).then((user) => {
    this.usertype = user;
    this.type = user.UserType;
  });
  await this.storage.get(environment.DOCTOR_Id).then((docId) => {
    this.doctorId = docId;
  });
  await this.storage.get(environment.ON_CLINIC).then((clinic) => {
    this.clinic = clinic;
  });
  
  // Load clinics for both DOCTOR and PA users
  await this.loadClinics();
  
 this.storage.get('searchInput').then((searchValue) => {
    if (searchValue) {
      this.fg.controls['Name'].setValue(searchValue);
      this.search = true;
      this.page = 0;
      this.childs = [];
      this.getChlidbyUser(false);
    } else {
          this.page = 0;
          this.search = false;
          this.childs = [];
          this.getChlidByClinic(false);
        }
      });
}

  getStringValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return value.toString();
    }
  }

  loadData() {
    if (this.search)
      this.getChlidbyUser(false);
    else
      this.getChlidByClinic(false);
  }

  async alertforDeleteChild(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
      .then((yes) => {
        if (yes) {
          this.Deletechild(id);
        }
      });
  }

  async Deletechild(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.childService.deleteChild(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create(res.Message);
          this.getChlidByClinic(true);
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      }
    );
  }

  async getChlidbyUser(keypress: boolean) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    if (keypress) {
      this.search = true;
      this.page = 0;
      this.childs = [];
      this.infiniteScroll.disabled = false;
    }
    this.storage.set('searchInput', this.fg.value.Name);
    await this.childService.getChildByUserSearch(this.doctorId, this.page, this.fg.value.Name).subscribe(
      res => {
        if (res.IsSuccess) {
          if (res.ResponseData.length < 15)
            this.infiniteScroll.disabled = true;
          this.childs = (this.childs.concat(res.ResponseData));
          this.page += 1;
          this.infiniteScroll.complete();
          this.isSearchDisabled = false;
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
    )
  }

  async getChlidByClinic(isdelete: boolean) {
  const loading = await this.loadingController.create({
    message: 'Loading',
  });
  await loading.present();

  if (isdelete) {
    this.page = 0;
    this.childs = [];
    this.search = false;
    this.fg.controls['Name'].setValue(null);
    this.storage.remove('searchInput');
  }
  this.storage.remove('searchInput');

  let clinicIdToUse = this.clinic.Id;
  if (this.usertype.UserType === 'PA') {
    clinicIdToUse = this.selectedClinicId;
  }

  this.childService.getChildByClinic(clinicIdToUse, this.page).subscribe({
    next: (res) => {
      if (res.IsSuccess) {
        if (res.ResponseData.length < 10)
          this.infiniteScroll.disabled = true;

        this.childs = this.childs.concat(res.ResponseData);
        this.page += 1;
        this.isSearchDisabled = false;
        loading.dismiss();
        this.infiniteScroll.complete();
      } else {
        loading.dismiss();
        this.toastService.create(res.Message, 'danger');
      }
    },
    error: (err) => {
      loading.dismiss();
      this.toastService.create(err, 'danger');
    },
  });
}

onClinicChange(event: any) {
  const clinicId = event.detail.value;
  console.log('Selected Clinic ID:', clinicId);
  this.selectedClinicId = clinicId;
  this.setOnlineClinic(clinicId);
  this.page = 0;
  this.childs = [];
  this.getChlidByClinic(true);
}

  navigateToRoute(route: string) {
    this.storage.remove('unapprovedSearch'); // Clear the flag
    this.router.navigate([route]);
  }

    async loadClinics() {
    const loading = await this.loadingController.create({
      message: 'Loading clinics...',
    });
    await loading.present();

    try {
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
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
              console.log('Clinics:', this.clinics);
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
              // Check if there's already an online clinic, if not set the first one
              const onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
              } else {
                this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('PA Clinics:', this.clinics);
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
      loading.dismiss();
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async approveChild(childId: number) {
    console.log('Approving child with ID:', childId);
    const loading = await this.loadingController.create({
      message: 'Approving'
    });
    await loading.present();
  
      this.childService.approveChild(childId).subscribe({
        next: (res) => {
          loading.dismiss();
            this.toastService.create('Child approved successfully', 'success');
            this.refreshPage();
        },
        error: (err) => {
          loading.dismiss();
          this.toastService.create('Failed to approve child', 'danger');
          console.error(err);
        },
      });
  }

  callFunction(celnumber) {
    this.callNumber.callNumber(0 + celnumber, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  async toggleChildActiveStatus(childId: number) {
    const loading = await this.loadingController.create({
      message: 'Updating status...'
    });
    await loading.present();

    this.childService.toggleChildActiveStatus(childId).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.refreshPage();
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create('An error occurred while updating status', 'danger');
      }
    );
  }

  refreshPage() {
    this.page = 0;
    this.childs = [];
    this.search = false;
    this.fg.controls['Name'].setValue(null);
    this.getChlidByClinic(false);
  }

  downloadPdf(childId: number) {
    this.childService.downloadPdf(childId, { observe: 'response', responseType: 'blob' }).subscribe((response: HttpResponse<Blob>) => {
      const blob = new Blob([response.body], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Patient-ID.pdf';
      if (contentDisposition) {
        let matches = /filename=(.*?)(;|$)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/["']/g, '');
        }
      }
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }, error => {
      console.error('Error downloading the PDF', error);
    });
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
