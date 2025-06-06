import { Component, OnInit, ViewChild } from '@angular/core';
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
  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private clinicService: ClinicService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private callNumber: CallNumber,
    private http: HttpClient,

  ) {
    this.fg = this.formBuilder.group({
      Name: ["", Validators.required],
    });
  }

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
    });
    this.storage.get(environment.ON_CLINIC).then((clinic) => {
      this.clinic = clinic;
    });
    this.storage.get('searchInput').then((searchValue) => {
      if (searchValue) {
        this.fg.controls['Name'].setValue(searchValue); // Restore the search input value
        this.search = true;
        this.page = 0;
        this.childs = [];
        this.getChlidbyUser(false); // Perform the search
      } else {
        this.page = 0;
        this.search = false;
        this.childs = [];
        this.getChlidByClinic(false); // Load default data
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
          // this.toastService.create(res.Message);
          // Refresh the child list or update the specific child's status in the UI
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
      let filename = 'Patient-ID.pdf'; // Default filename

      if (contentDisposition) {
        // Try to get filename from the attachment; filename= part
        let matches = /filename=(.*?)(;|$)/.exec(contentDisposition);

        if (matches && matches[1]) {
          // Remove quotes if present
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
