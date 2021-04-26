import { Component, OnInit } from "@angular/core";
import { Route, ActivatedRoute, Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { BulkService } from "src/app/services/bulk.service";
import { ToastService } from "src/app/shared/toast.service";
import { FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import * as moment from "moment";
import { AlertController } from '@ionic/angular';
import { elementAt } from 'rxjs/operators';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: "app-bulk",
  templateUrl: "./bulk.page.html",
  styleUrls: ["./bulk.page.scss"]
})
export class BulkInvoicePage implements OnInit {
  childId: any;
  doctorId: any;
  currentDate: any;
  InvoiceDate: any;
  currentDate1: any;
  bulkData: any;
  fg: FormGroup;
  consultationfee: number = 0;
  private readonly API_VACCINE = `${environment.BASE_URL}`
  BrandIds = [];
  constructor(
    private loadingController: LoadingController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private bulkService: BulkService,
    private toastService: ToastService,
    private storage: Storage,
    public alertController: AlertController,
    private downloader: Downloader,
    public platform: Platform
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");
    this.currentDate = this.activatedRoute.snapshot.paramMap.get("childId");
    this.currentDate1 = new Date(this.currentDate);
     
    this.getBulk();
    this.fg = this.formBuilder.group({
      IsConsultationFee: false,
      ConsultationFee: null
    });
    this.storage.get(environment.ON_CLINIC).then(val => {
      this.fg.controls['ConsultationFee'].setValue(val.ConsultationFee);
      // this.fg.value.ConsultationFee = val.ConsultationFee;
    });
  }

  async getBulk() {
    let data = { ChildId: this.childId, Date: this.currentDate1 };
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.bulkService.getBulk(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.bulkData = res.ResponseData.filter(x => x.IsDone == true);
          this.InvoiceDate = moment(this.bulkData[0].InvoiceDate, "DD-MM-YYYY").format("YYYY-MM-DD");
          // console.log(this.bulkData);
        } else {
          this.toastService.create(res.Message, "danger");
        }

        loading.dismiss();
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );

  }

  onSubmit() {
    let data = [];
    this.bulkData.forEach(schedule => {
      let obj = {
        Id: schedule.Id,
        Amount: schedule.Amount
      }
      data.push(obj);
    });

    this.fillVaccine(data);
  }

  async fillVaccine(data) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.bulkService.updateVaccineInvoice(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("Successfully Updated");
          this.router.navigate(["/members/child/vaccine/" + this.childId]);
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async saveanddownload() {
    if (this.fg.value.IsConsultationFee) {
      this.consultationfee = this.fg.value.ConsultationFee;
    }
    else
      this.consultationfee = 0;

    let data = [];
    this.bulkData.forEach(schedule => {
      let obj = {
        Id: schedule.Id,
        Amount: schedule.Amount
      }
      data.push(obj);
    });

    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    this.bulkService.updateVaccineInvoice(data).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.download(this.childId, this.currentDate, this.InvoiceDate, this.consultationfee);
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  download(id,scheduledate, invoicedate, fee) {

    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      const url = `${this.API_VACCINE}child/${id}/${scheduledate}/${invoicedate}/${fee}/Download-Invoice-PDF`;
      window.open(url);
    }
    else {

      var request: DownloadRequest = {
        uri: `${this.API_VACCINE}child/${id}/${scheduledate}/${invoicedate}/${fee}/Download-Invoice-PDF`,
        title: 'Invoice',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        // notificationVisibility: 0,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Invoice.pdf'
        }
      };
      // console.log(request.uri);
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch((error: any) => console.error(error));
    }

  }
}
