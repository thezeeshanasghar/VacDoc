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
  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private callNumber: CallNumber,
  ) {
    this.fg = this.formBuilder.group({
      Name: ["", Validators.required],
    });
  }

  ionViewWillEnter() {
    this.storage.get(environment.USER).then((user) => {
      this.usertype = user.UserType;
    });
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
    });
    this.storage.get(environment.ON_CLINIC).then((clinic) => {
      this.clinic = clinic;
    });
    this.storage.get('searchInput').then((searchValue) => {
      if (searchValue) {
        this.fg.controls['Name'].setValue(searchValue);
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
      message: 'Loading'
    });
    await loading.present();
    if (isdelete) {
      this.page = 0;
      this.childs = [];
      this.search = false;
      this.fg.controls['Name'].setValue(null);
      this.storage.remove('searchInput');
    }
    await this.childService.getChildByClinic(this.clinic.Id, this.page).subscribe(
      res => {
        console.log(res);
        if (res.IsSuccess) {
          if (res.ResponseData.length < 10)
            this.infiniteScroll.disabled = true;
          this.childs = this.childs.concat(res.ResponseData);
          this.page += 1;
          loading.dismiss();
          this.infiniteScroll.complete();
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

  approveChild(childId: number) {
    this.loadingController.create({ message: 'Approving...' }).then((loading) => {
      loading.present();
  
      console.log('Approving child with ID:', childId);
      loading.dismiss();
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

  async getUnapprovedPatients() {
    const loading = await this.loadingController.create({ 
      message: 'Loading Unapproved Patients...' 
    }); 
     await loading.present();
  
      this.childService.getUnapprovedPatients(this.clinic.Id).subscribe({
        next: (res) => {
          loading.dismiss();
          console.log(res);
          if (res.IsSuccess) {
            this.infiniteScroll.disabled = true;
            this.childs = res.ResponseData;
            this.search = true; 
            loading.dismiss();
            this.infiniteScroll.complete();
          } else {
            this.toastService.create(res.Message, 'danger');
          }
        },
        error: (err) => {
          loading.dismiss();
          this.toastService.create('Failed to fetch unapproved patients', 'danger');
          console.error(err);
        },
      })
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
}
