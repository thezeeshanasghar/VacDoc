import { Component, ViewChild } from '@angular/core';
import { IonInfiniteScroll, LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { HttpResponse } from '@angular/common/http';
import { PaService } from 'src/app/services/pa.service';

@Component({
  selector: 'app-unapprove',
  templateUrl: './unapprove.page.html',
  styleUrls: ['./unapprove.page.scss'],
})
export class UnapprovePage {
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll: IonInfiniteScroll;
  fg: FormGroup;
  childs: any = [];
  userId: any;
  doctorId: number;
  page: number = 0;
  search: boolean = false;
  clinic: any;
  usertype: any;
  isSearchDisabled: boolean = false;
  clinics: any;
  selectedClinicId: any;

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
  ) {
    this.fg = this.formBuilder.group({
      Name: ["", Validators.required],
    });
  }

  ionViewWillEnter() {
    // Always fetch fresh unapproved patients when entering this page
    this.isSearchDisabled = true;
    this.storage.get(environment.USER).then((user) => {
      this.usertype = user;
      // For PA users, load clinics to get PA-specific online clinic
      if (user.UserType === 'PA') {
        this.loadPaClinics();
      } else {
        // For DOCTOR users, use clinic from storage
        this.storage.get(environment.ON_CLINIC).then((clinic) => {
          this.clinic = clinic;
          this.getUnapprovedPatients(false);
        });
      }
    });
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
    });
  }

  async loadPaClinics() {
    const loading = await this.loadingController.create({
      message: 'Loading clinics...',
    });
    await loading.present();

    try {
      this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.clinics = response.ResponseData;
            // Find the online clinic for PA (using PA-specific IsOnline)
            const onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
            if (onlineClinic) {
              this.clinic = onlineClinic;
              this.selectedClinicId = onlineClinic.Id;
              this.storage.set(environment.ON_CLINIC, onlineClinic);
              this.storage.set(environment.CLINIC_Id, onlineClinic.Id);
            } else {
              // If no online clinic, use first clinic
              this.clinic = this.clinics.length > 0 ? this.clinics[0] : null;
              this.selectedClinicId = this.clinic ? this.clinic.Id : null;
              if (this.clinic) {
                this.storage.set(environment.ON_CLINIC, this.clinic);
                this.storage.set(environment.CLINIC_Id, this.selectedClinicId);
              }
            }
            console.log('PA Clinics loaded, using clinic:', this.clinic);
            this.getUnapprovedPatients(false);
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
    } catch (error) {
      loading.dismiss();
      console.error('Error in loadPaClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getUnapprovedPatients(isdelete: boolean) {
    const loading = await this.loadingController.create({
      message: 'Loading Unapproved Patients...',
    });
    await loading.present();

    if (isdelete) {
      this.page = 0;
      this.childs = [];
      this.search = false;
      this.fg.controls['Name'].setValue(null);
      this.isSearchDisabled = false;
    } else {
      this.page = 0;
      this.childs = [];
      this.infiniteScroll.disabled = false;
      this.isSearchDisabled = true;
    }

    this.childService.getUnapprovedPatients(this.clinic.Id).subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.infiniteScroll.disabled = true;
          this.childs = res.ResponseData;
          console.log(this.childs);
          this.search = true;
          this.isSearchDisabled = true;
          this.infiniteScroll.complete();
        } else {
          this.toastService.create(res.Message, 'danger');
          this.isSearchDisabled = false;
        }
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Failed to fetch unapproved patients', 'danger');
        this.isSearchDisabled = false;
        console.error(err);
      },
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
          this.getUnapprovedPatients(true);
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
    this.isSearchDisabled = true;
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
          this.isSearchDisabled = false;
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.isSearchDisabled = false;
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
    }

    this.isSearchDisabled = true;
    // Use clinic.Id for both DOCTOR and PA (clinic should be set correctly in ionViewWillEnter)
    const clinicIdToUse = this.clinic ? this.clinic.Id : null;
    
    if (!clinicIdToUse) {
      loading.dismiss();
      this.toastService.create('No clinic selected or available.', 'danger');
      return;
    }

    this.childService.getChildByClinic(clinicIdToUse, this.page).subscribe({
      next: (res) => {
        if (res.IsSuccess) {
          if (res.ResponseData.length < 10) this.infiniteScroll.disabled = true;
          this.childs = this.childs.concat(res.ResponseData);
          this.page += 1;
          loading.dismiss();
          this.infiniteScroll.complete();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
        this.isSearchDisabled = false;
      },
      error: (err) => {
        loading.dismiss();
        this.isSearchDisabled = false;
        this.toastService.create(err, 'danger');
      },
    });
  }

  navigateToRoute(route: string) {
    this.router.navigate([route]);
  }

  async approveChild(childId: number) {
    const loading = await this.loadingController.create({
      message: 'Approving'
    });
    await loading.present();

    this.childService.approveChild(childId).subscribe({
      next: (res) => {
        loading.dismiss();
        this.toastService.create('Child approved successfully', 'success');
        this.getUnapprovedPatients(false);
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
          this.getUnapprovedPatients(false);
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
}