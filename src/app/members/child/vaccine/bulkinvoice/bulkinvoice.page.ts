import { Component, OnInit } from "@angular/core";
import { Route, ActivatedRoute, Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { BulkService } from "src/app/services/bulk.service";
import { ToastService } from "src/app/shared/toast.service";
import { InvoiceService } from "src/app/services/invoice.service";
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
  currentDate1: any;
  bulkData: any;
  fg: FormGroup;
  consultationfee: number = 0;
  private readonly API_VACCINE = `${environment.BASE_URL}`
  BrandIds = [];
  usertype: any;
  invoiceData: any;
  bulkDatadiff: any;
  // invoiceNumber: string;
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
    public platform: Platform,
    private invoiceService: InvoiceService
  ) { }

  hasActiveValidations(): boolean {
    return (this.fg.get('ConsultationFee').invalid && (this.fg.get('ConsultationFee').dirty || this.fg.get('ConsultationFee').touched)) ||
      (this.bulkData && Array.isArray(this.bulkData) && this.bulkData.some(bulk => isNaN(Number(bulk.Amount))));
  }


  // Validations on amount
  bulk = { Amount: '' };
  isValidInput = true;

  validateInput(event: any) {
    const inputValue: string = event.target.value;
    this.isValidInput = /^\d*$/.test(inputValue);
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");
    this.currentDate = this.activatedRoute.snapshot.paramMap.get("childId");
    // const storedInvoiceId = localStorage.getItem('invoiceId');
    // console.log('Stored Invoice ID:', storedInvoiceId);
    this.currentDate1 = new Date(this.currentDate);
    this.getBulk();
    this.fg = this.formBuilder.group({
      IsConsultationFee: false,
      ConsultationFee: [null, Validators.pattern('^[0-9]*$')] // Add Validators.pattern to allow only numbers
    });

    this.storage.get(environment.ON_CLINIC).then(val => {
      this.fg.controls['ConsultationFee'].setValue(val.ConsultationFee);
      // this.fg.value.ConsultationFee = val.ConsultationFee;
    });
    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; // Ensure this is set correctly
      } else {
        console.error('No user data found in storage.');
      }
    });
    // this.loadInvoiceData();
    // this.getInvoiceId(this.childId, this.doseId);
  }
//   loadInvoiceData() {
//     const storedInvoiceId = localStorage.getItem('invoiceId');
//     if (storedInvoiceId) {
//       this.invoiceService.getInvoiceById(storedInvoiceId).subscribe(
//         (res) => {
//           if (res && res.InvoiceId) {
//             console.log(res.InvoiceId);
//             this.invoiceNumber = res.InvoiceId; // Store the invoice number
//           } else {
//           console.error('Failed to fetch invoice data.');
//         }
//       },
//       (error) => {
//         console.error('Error fetching invoice data:', error);
//       }
//     );
//   }
// }

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
          // console.log(this.bulkData);
          console.log(res.ResponseData);
          this.bulkDatadiff = this.bulkData.map(item => {
              console.log(item.Dose.Id);
              this.getInvoiceId(item.Dose.Id, this.childId);
              // this.getFee(res.ResponseData.InvoiceId)
          });
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
          this.download(this.childId, this.currentDate, this.consultationfee);
          window.location.reload();
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

async getInvoiceId(doseId: string, childId: string) {
  const loading = await this.loadingController.create({
    message: "Loading"
  });
  await loading.present();
  this.invoiceService.getInvoiceId(doseId, childId).subscribe(
    res => {
      if (res.IsSuccess) {
        const bulkItem = this.bulkData.find(item => item.Dose.Id === doseId);
        this.getFee(res.ResponseData.InvoiceId)
        if (bulkItem) {
          bulkItem.InvoiceId = res.ResponseData.InvoiceId;
          console.log(bulkItem);
          bulkItem.Amount = res.ResponseData.Amount; 
        }
      } else {
      }
      loading.dismiss();
    },
    err => {
      loading.dismiss();
    }
  );
}

async getFee(Id: string) {
  const loading = await this.loadingController.create({
    message: "Loading"
  });
  await loading.present();
  this.invoiceService.getFee(Id).subscribe(
    res => {
        console.log(res.ResponseData);
         this.fg.controls['ConsultationFee'].setValue(res.ResponseData.Amount);
         this.fg.controls['IsConsultationFee'].setValue(true);
      loading.dismiss();
    },
    err => {
      loading.dismiss();
      // this.toastService.create(err, "danger");
    }
  );
}

// hasAnyInvoiceId(): boolean {
//   console.log(Array.isArray(this.bulkData) && this.bulkData.some(bulk => !!bulk.InvoiceId));
//   return Array.isArray(this.bulkData) && this.bulkData.some(bulk => !!bulk.InvoiceId);
// }

  download(id, date, fee) {
    const today = new Date(date); // Use the provided date instead of today's date
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
    const day = today.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      const url = `${this.API_VACCINE}child/${id}/${formattedDate}/${formattedDate}/${fee}/Verify-Invoice-PDF`;
      window.open(url);
    } else {
      var request: DownloadRequest = {
        uri: `${this.API_VACCINE}child/${id}/${formattedDate}/${fee}/Download-Invoice-PDF`,
        title: 'Invoice',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Invoice.pdf'
        }
      };
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch((error: any) => console.error(error));
    }
  }
}
