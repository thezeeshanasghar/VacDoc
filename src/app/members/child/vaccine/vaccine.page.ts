import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { LoadingController, IonContent, PopoverController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ScheduleService } from "src/app/services/schedule.service";
import { ToastService } from "src/app/shared/toast.service";
import { ActivatedRoute, Router } from "@angular/router";
import * as moment from "moment";
import { BulkService } from "src/app/services/bulk.service";
import { AlertController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { FormBuilder, FormGroup } from "@angular/forms";
import { PaService } from "src/app/services/pa.service";
import { InvoiceService } from "src/app/services/invoice.service";
import { AuditPopoverComponent } from "./audit-popover/audit-popover.component";

@Component({
  selector: "app-vaccine",
  templateUrl: "./vaccine.page.html",
  styleUrls: ["./vaccine.page.scss"]
})
export class VaccinePage {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  vaccine: any[] = [];
  specialvaccineids: any[] = [];
  dataGrouping: { [date: string]: any[] } = {};
  vaccinesData = [];
  childId: any;
  alphabetically: any;
  Pneum2Date: any;
  BirthYear: any;
  ChildName: string;
  fgAddData: FormGroup;
  today: Date = new Date();
  private readonly API_VACCINE = `${environment.BASE_URL}`
  type: string;
  istravel: boolean = true;
  usertype: any;
  paId: number = null;
  retryCount = 0;
  maxRetries = 3;
  canGiveVaccine = true;
  canUngiveVaccine = true;
  canReschedule = true;
  canBulkGive = true;
  canBulkUngive = true;
  canBulkReschedule = true;
  canInvoice = true;
  canAddParams = true;
  canPrint = true;
  canSkip = true;
  canUnskip = true;
  canEditSchedule = true;
  doctorId: number = null;
  clinicId: number = null;
  clinicPAs: any[] = [];
  assignPopupOpen: boolean = false;
  assignPopupLoading: boolean = false;
  assigningPA: boolean = false;
  activeAssignment: any = null;
  activeAssignmentLoading: boolean = false;
  reassignPopupOpen: boolean = false;
  paGuidelines: string = '';
  pendingAssignPA: any = null;
  pendingAssignScheduleIds: number[] = [];
  pendingReassignPA: any = null;
  paymentPopupOpen: boolean = false;
  paymentTargetScheduleId: number = null;
  paymentTargetScheduleIds: number[] = [];
  paymentDueAmount: number = 0;
  canCollectPayment = true;
  invoiceExistsMap: { [date: string]: boolean } = {};

  isFilledToday(doneAt: any): boolean {
    if (!doneAt) return false;
    const today = new Date().toISOString().split('T')[0];
    const done = String(doneAt).split('T')[0];
    return done === today;
  }

  private isInfiniteVaccine(data: any): boolean {
    const dose = data && data.Dose ? data.Dose : null;
    const vaccine = dose && dose.Vaccine ? dose.Vaccine : null;
    const flag = !!(vaccine && vaccine.isInfinite);
    const doseName = ((dose && dose.Name) || '').toString().toLowerCase();
    const vaccineName = ((vaccine && vaccine.Name) || '').toString().toLowerCase();
    const fullName = `${doseName} ${vaccineName}`;

    return flag
      || doseName.startsWith('flu')
      || doseName.startsWith('typhoid')
      || fullName.includes('vitamin a');
  }

  constructor(
    public loadingController: LoadingController,
    public route: ActivatedRoute,
    public router: Router,
    private vaccineService: VaccineService,
    private bulkService: BulkService,
    private toastService: ToastService,
    public alertController: AlertController,
    private downloader: Downloader,
    private storage: Storage,
    public platform: Platform,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private paService: PaService,
    private invoiceService: InvoiceService,
    private popoverController: PopoverController,
    private cdr: ChangeDetectorRef,
  ) {
    this.type = '';
  }

  ionViewWillEnter() {
    this.childId = this.route.snapshot.paramMap.get("id");
    this.vaccinesData = [];
    this.getVaccination();
    // this.removal();
    this.fgAddData = this.formBuilder.group({
      'DoctorId': [''],
      'IsDone': [null],
      // 'Weight': [null],
      // 'Height': [null],
      // 'Circle': [null],
      'BrandId': [null],
      // 'GivenDate': [null],
      'IsDisease': [false],
      'DiseaseYear': ['2019'],
      'DoseId': [null],
      'ChildId': [null],
      'Date': [null]
    });
    this.loadUserAndPAs();
  }

  ngOnInit() {}

  private loadUserAndPAs() {
    this.storage.get(environment.USER).then((user) => {
      if (!user) { console.error('No user data found in storage.'); return; }
      this.usertype = user.UserType;
      if (user.UserType === 'PA') {
        this.paId = Number(user.PAId) || null;
        this.paService.getPaPermissions(Number(user.PAId)).subscribe(perm => {
          this.canGiveVaccine    = (perm && perm.GiveVaccine)        || false;
          this.canUngiveVaccine  = (perm && perm.UngiveVaccine)      || false;
          this.canReschedule     = (perm && perm.RescheduleVaccine)  || false;
          this.canBulkGive       = (perm && perm.BulkGiveVaccines)   || false;
          this.canBulkUngive     = (perm && perm.BulkUngiveVaccines) || false;
          this.canBulkReschedule = (perm && perm.BulkReschedule)     || false;
          this.canInvoice        = (perm && perm.ManageInvoice)      || false;
          this.canCollectPayment = (perm && perm.GiveVaccine)        || false;
          this.canAddParams      = (perm && perm.AddVaccineParams)   || false;
          this.canPrint          = (perm && perm.PrintSchedulePdf)   || false;
          this.canSkip           = (perm && perm.SkipVaccine)        || false;
          this.canUnskip         = (perm && perm.UnskipVaccine)      || false;
          this.canEditSchedule   = (perm && perm.EditVaccineSchedule)|| false;
        });
        this.loadActivePAAssignment();
      }
      if (user.UserType === 'DOCTOR') {
        this.doctorId = user.DoctorId ? Number(user.DoctorId) : null;
        this.storage.get(environment.ON_CLINIC).then(clinic => {
          this.clinicId = clinic ? Number(clinic.Id) : null;
          if (this.clinicId) {
            this.paService.getPAsForClinic(this.clinicId).subscribe(res => {
              if (res && res.IsSuccess) { this.clinicPAs = res.ResponseData || []; }
            });
          }
          this.loadActiveAssignment();
        });
      }
    });
  }

  handleSkipClick(event: Event, id: number, doseName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.SkipVaccine(id, doseName);
  }

  handleUnSkipClick(event: Event, id: number, doseName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.UnSkipVaccine(id, doseName);
  }

  // generateInvoice(item: any): void {
  //   const invoiceDTO = {
  //     amount: 0,
  //     childId: this.childId  // Use the existing childId property
  //   };

  //   console.log(invoiceDTO);
  //   this.invoiceService.CreateInvoice(invoiceDTO).subscribe(
  //     (res) => {
  //       // Assuming res contains the created invoice details
  //       console.log(res);
  //       if (res && res.InvoiceId) {  // Adjust this check based on your actual API response structure
  //         console.log("Invoice created successfully.");
  //         console.log(res.Id);
  //         localStorage.setItem('invoiceId', res.Id);
  //         const url = `/members/child/vaccine/${this.childId}/bulkinvoice/${item.key}`;
  //         this.router.navigateByUrl(url)
  //       } else {
  //         console.log("Failed to create invoice.");
  //       }
  //     },
  //     (error) => {
  //       console.error('Error creating invoice:', error);
  //       this.toastService.create('Error creating invoice.', "danger");
  //     }
  //   );
  // }

  checkVaccineIsDon(data): boolean {
    for (let i = 0; i < data.length; i++) {
      if (!data[i].IsDone) { return false; }
    }
    return true;
  }

  anyVaccineGiven(data: any[]): boolean {
    return data.some(v => v.IsDone && !v.Due2EPI);
  }
  

 async getVaccination() {
  const scrollPosition = await this.content.getScrollElement().then(element => element.scrollTop); 
  const loading = await this.loadingController.create({
    message: "Loading Vaccines"
  });
  await loading.present();

  this.vaccineService.getVaccinationById(this.childId).subscribe(
    res => {
      if (res.IsSuccess && res.ResponseData && res.ResponseData.length > 0) {
        setTimeout(() => {
          this.content.scrollToPoint(0, scrollPosition);
        }, 100);

        this.BirthYear = res.ResponseData[0].Child.DOB;
        this.storage.set('BirthYear', this.BirthYear);
        this.vaccine = res.ResponseData;
        this.ChildName = this.vaccine[0].Child.Name;
        this.type = this.vaccine[0].Child.Type;
        this.removal(this.type);

        this.vaccine.forEach(doc => {
          doc.Date = moment(doc.Date, "DD-MM-YYYY").format("YYYY-MM-DD");
          if (doc.GivenDate)
            doc.GivenDate = moment(doc.GivenDate, "DD-MM-YYYY").format("YYYY-MM-DD");
          this.vaccinesData.push({ childId: doc.Child.Id, vaccineId: doc.Dose.VaccineId, brandId: doc.BrandId });
        });

        this.storage.set("vaccinesData", this.vaccinesData);
        this.dataGrouping = this.groupBy(this.vaccine, "Date");
        this.loadInvoiceExistence();
        loading.dismiss();

      } else if (res.IsSuccess === false) {
        loading.dismiss();
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying... Attempt ${this.retryCount}`);
          setTimeout(() => {
            this.getVaccination();
          }, 2000); // wait 2 seconds before retry
        } else {
          this.toastService.create("Failed after multiple retries.");
        }

      } else {
        this.toastService.create("Vaccines Not Found! Please Add vaccines");
        loading.dismiss();
      }
    },
    err => {
      this.toastService.create("Error: server failure");
      loading.dismiss();
    }
  );
}

  groupBy(objectArray, property) {
    return objectArray.reduce(
      function (acc, obj) {
        var key = obj[property];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
      },
      {}
    );
  }

  async updateDate($event, vacId) {
    // console.log($event.value);
    let newDate = $event.value;
    newDate = moment(newDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    let data = { Date: newDate, Id: vacId };
    await this.vaccineService.updateVaccinationDate(data, false, false, false).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          //this.toastService.create(res.Message, "danger");
          this.resheduleAlert(res.Message, data);
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

  async updateBulkDate($event, id) {
    let newDate = $event.value; //$event.detail.value;
    newDate = moment(newDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    let data = { Date: newDate, Id: id };

    await this.bulkService.updateInjectionDate(data, false, false, false).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          //this.toastService.create(res.Message, "danger");
          this.resheduleBulkAlert(res.Message, data);
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

  async resheduleAlert(message, data) {
    if (message.includes('before or on the same date as the previous dose')) {
      const alert = await this.alertController.create({
        header: 'Cannot Reschedule',
        message: message,
        buttons: ['Ok']
      });
      await alert.present();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Alert',
      // message: message,
      message: message,
      buttons: [
        {
          text: 'Ignore Rule',
          // role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            if (message.search("it is greater than the Max Age of dose") != -1) {
              this.vaccineService.updateVaccinationDate(data, true, false, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (message.search("Minimum Age of this vaccine from date of birth should be") != -1) {
              this.vaccineService.updateVaccinationDate(data, false, true, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (message.search("Minimum Gap from previous dose of this vaccine should be") != -1) {
              this.vaccineService.updateVaccinationDate(data, false, false, true).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }

          }
        },
        {
          text: 'Ok',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
      // buttons: ['OK']
    });
    await alert.present();
  }

  async resheduleBulkAlert(message, data) {
    if (message.includes('before or on the same date as the previous dose')) {
      const alert = await this.alertController.create({
        header: 'Cannot Reschedule',
        message: message,
        buttons: ['Ok']
      });
      await alert.present();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Alert',
      message: message,
      buttons: [
        {
          text: 'Ignore Rule',
          // role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            if (message.search("it is greater than the Max Age of dose") != -1) {
              this.bulkService.updateInjectionDate(data, true, false, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }
            else if (message.search("Minimum Age of this vaccine from date of birth should be") != -1) {
              this.bulkService.updateInjectionDate(data, false, true, false).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }else if (message.search("Minimum Gap from previous dose of this vaccine should be") != -1) {
              this.bulkService.updateInjectionDate(data, false, false, true).subscribe(
                res => {
                  if (res.IsSuccess) {
                    this.getVaccination();
                    this.toastService.create(res.Message);
                  } else {
                    //this.toastService.create(res.Message, "danger");
                    this.resheduleBulkAlert(res.Message, data);
                  }
                },
                err => {
                  this.toastService.create(err, "danger");
                }
              );
            }

          }
        }, {
          text: 'Ok',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
      // buttons: ['OK']
    });
    await alert.present();
  }

  checkforpnemococal(name, DOB, Id) {
    if ((name == 'Pneumococcal # 3') || (name == 'Pneumococcal # 4')) {
      // console.log(name);
      //       const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      let firstDate = new Date(DOB);
      const secondDate = new Date(this.Pneum2Date);

      // const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
      var diff = Math.abs(firstDate.getTime() - secondDate.getTime());
      var diffDays = Math.ceil(diff / (1000 * 3600 * 24));
      // console.log(diffDays); console.log(firstDate); console.log(secondDate);

    }
    else {
      this.router.navigate(["/members/child/vaccine/" + this.childId + "/fill/" + Id]);
    }
    // let Date = moment(DOB, 'DD-MM-YYYY');
    // console.log(DOB);
    // console.log(this.Pneum2Date);
  }

removal(type: string){
    // console.log(this.type);
    if(this.type === 'travel') {
     this.istravel= false;
    }
}

  printdata() {
    if (this.type === 'travel') {
      this.downloadTravelPdf();
    } else if (this.type === 'special'){
this.downloadSpecialPdf();
    }
    else {
      if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
        const url = `${this.API_VACCINE}child/${this.childId}/ScheduleVerify`;
        window.open(url);
      } else {
        this.download(this.childId);
      }
    }
  }

  download(id) {
    var request: DownloadRequest = {
      uri: `${this.API_VACCINE}child/${id}/Download-Schedule-PDF`,
      title: this.ChildName + '-Schedule',
      description: '',
      mimeType: '',
      visibleInDownloadsUi: true,
      notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
      // notificationVisibility: 0,
      destinationInExternalFilesDir: {
        dirType: 'Downloads',
        subPath: 'ChildSchedule.pdf'
      }
    };
    this.downloader.download(request)
      .then((location: string) => console.log('File downloaded at:' + location))
      .catch((error: any) => console.error(error));
  }

  async unfillbulk(item: any) {
    // console.log(item);
    let data = []
    for (const element of item.value) {
      let tempdata = {
        Id: element.Id,
        IsDone: element.isdone ? false : false,
      }
      data.push(tempdata);
    }
    const loading = await this.loadingController.create({
      message: 'Unfilling vaccine'
    });

    for (const d of data) {
      await this.UnfillVaccine(d.Id, d)
    }
  }

  async UnfillVaccine(id, Data = null) {
    const loading = await this.loadingController.create({
      message: 'Unfilling vaccine'
    });
    if (!Data) {
      await loading.present();
    }

    var unfillData: any = {
      Id: id,
      IsDone: false,
    };
    if (this.usertype === 'PA' && this.paId) {
      unfillData.PaId = this.paId;
    }
    if (Data) {
      unfillData = Data;
      if (this.usertype === 'PA' && this.paId) {
        unfillData.PaId = this.paId;
      }
    }

    await this.vaccineService.UnfillChildVaccine(unfillData)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            if (this.isInfiniteVaccine(res.ResponseData)) {
              var cId = res.ResponseData.ChildId;
              var dId = res.ResponseData.Dose.Id;
              var dSchedule = res.ResponseData.Date;
              this.deleteFutureSchedules(cId, dId, dSchedule);
              loading.dismiss();
            }
            else {
              this.getVaccination();
              loading.dismiss();
            }
          }
          else if (res.IsWarning) {
            // v2 §6.5a: doctor ungiving a pre-reset historical dose — confirm "history only".
            loading.dismiss();
            this.alertController.create({
              header: 'Undo a historical dose?',
              message: res.Message,
              buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                  text: 'Undo anyway',
                  handler: () => {
                    unfillData.ConfirmPreResetUngive = true;
                    this.vaccineService.UnfillChildVaccine(unfillData).subscribe(
                      res2 => {
                        if (res2.IsSuccess) { this.getVaccination(); }
                        else { this.toastService.create(res2.Message || 'Error: failed to undo', 'danger'); }
                      },
                      () => { this.toastService.create('Error: server failure', 'danger'); }
                    );
                  }
                }
              ]
            }).then(a => a.present());
          }
          else {
            loading.dismiss();
            this.alertController.create({
              header: 'Cannot Ungive',
              message: res.Message,
              buttons: ['OK']
            }).then(a => a.present());
          }
        },
        err => {
          loading.dismiss();
          this.toastService.create('Error: server failure');
        }
      );
  }

  // §6.3a: correct a given dose's batch/expiry/manufacturer label — used to fill in a
  // give-at-zero dose's blank batch later, or fix a typo'd lot. Moves NO stock. Doctor + PA.
  async correctBatch(v: any) {
    if (!v || !v.IsDone) { return; }
    if (!v.BrandId) {
      this.toastService.create('This dose is OHF (no brand); there is no batch to correct.', 'warning');
      return;
    }

    const existingExpiry = v.Expiry ? new Date(v.Expiry).toISOString().substring(0, 10) : '';
    const alert = await this.alertController.create({
      header: 'Correct Batch Details',
      subHeader: (v.Brand && v.Brand.Name) ? v.Brand.Name : '',
      message: 'Label only — this does not change any stock quantity.',
      inputs: [
        { name: 'lot', type: 'text', placeholder: 'Batch / Lot no.', value: v.Lot || '' },
        { name: 'manufacturer', type: 'text', placeholder: 'Manufacturer', value: v.Manufacturer || '' },
        { name: 'expiry', type: 'date', value: existingExpiry }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.submitCorrectBatch(v.Id, data);
          }
        }
      ]
    });
    await alert.present();
  }

  private async submitCorrectBatch(scheduleId: number, data: any) {
    const loading = await this.loadingController.create({ message: 'Saving batch details' });
    await loading.present();

    const payload: any = {
      Lot: (data && data.lot) ? data.lot : '',
      Manufacturer: (data && data.manufacturer) ? data.manufacturer : '',
      Expiry: (data && data.expiry) ? data.expiry : null,
      DoctorId: this.doctorId
    };
    if (this.usertype === 'PA' && this.paId) {
      payload.CorrectByPaId = this.paId;
    }

    this.vaccineService.CorrectBatch(scheduleId, payload).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Batch details corrected.', 'success');
          this.getVaccination();
        } else {
          this.toastService.create(res.Message || 'Could not correct batch.', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Error: server failure', 'danger');
      }
    );
  }

  async deleteFutureSchedules(ChildId: string, DoseId: string, date: String) {
    const loading = await this.loadingController.create({
      message: 'Deleting Doses'
    });

    await loading.present();
    const delPaId = (this.usertype === 'PA' && this.paId) ? this.paId : undefined;
    const delDoctorId = this.doctorId ? this.doctorId : undefined;
    await this.vaccineService.DeleteVaccineByChildidDoseidDate(ChildId, DoseId, date, delPaId, delDoctorId)
      .subscribe(
        (result) => {
          let data: any = result;
          if (data.IsSuccess) {
            this.toastService.create('Success: Deleted future doses', 'success', false, 3000);
            this.getVaccination();
            loading.dismiss();
          }
          else {
            this.toastService.create('Error: Try again\nFailed to delete future doses', 'danger', false, 7000);
            loading.dismiss();
          }

        }, err => {
          this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
          loading.dismiss();
        }
      );
  }

  async SkipVaccine(id, doseName) {
    const loading = await this.loadingController.create({
      message: 'Skipping ' + doseName
    });
    await loading.present();
    var skipData: any = {
      Id: id,
      IsSkip: true,
    };
    if (this.usertype === 'PA' && this.paId) {
      skipData.PaId = this.paId;
    }

    await this.vaccineService.UnfillChildVaccine(skipData).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Success: Skipped ' + res.ResponseData.Dose.Name, 'success', false, 3000);
          if (this.isInfiniteVaccine(res.ResponseData)) {
            let scheduleDate: any = this.addDays(res.ResponseData.Date, res.ResponseData.Dose.MinGap);
            // this.addNewVaccineInScheduleTable(scheduleDate, res.ResponseData);
            this.getVaccination();
            loading.dismiss();
          } else {
            this.getVaccination();
            loading.dismiss();
          }
        }
        else {
          loading.dismiss();
          this.alertController.create({
            header: 'Cannot Skip',
            message: res.Message,
            buttons: ['OK']
          }).then(a => a.present());
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  allVaccinesGiven(vaccines: any[]): boolean {
    return vaccines.every(vaccine => vaccine.IsDone);
  }

  // Returns CSS class for the date group label colour:
  // green = all given, orange = all given but payment pending, red = missed (past + not all done), yellow = due within 7 days
  getGroupDateClass(dateKey: string, vaccines: any[]): string {
    if (this.allVaccinesGiven(vaccines)) {
      if (this.canCollectPayment && this.hasUnpaidDoneVaccine(vaccines, dateKey))
        return 'date-label--payment-pending';
      return 'date-label--given';
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(dateKey); d.setHours(0, 0, 0, 0);
    if (d < today) return 'date-label--missed';
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return 'date-label--due-soon';
    return 'date-label--upcoming';
  }

  // Tag shown to a PA on each date-group: tells them whether this group is
  // theirs to act on, or was already handled by the doctor.
  getPaAssignmentTag(vaccines: any[]): 'assigned' | 'given-by-doctor' | null {
    if (this.usertype !== 'PA' || !this.activeAssignment) return null;
    // GetByPA's Schedules array is pinned via PAAssignmentSchedule — only Schedule IDs
    // actually linked to this assignment, not every group for this child. Check this
    // group's own IDs against that list instead of assuming any active assignment
    // applies to every date-group.
    const pinnedIds = new Set((this.activeAssignment.Schedules || []).map((s: any) => s.Id));
    const groupIsPinned = vaccines.some(v => pinnedIds.has(v.Id));
    if (!groupIsPinned) return null;
    if (this.allVaccinesGiven(vaccines)) {
      const givenByDoctor = vaccines.some(v => !v.GivenByPaId);
      return givenByDoctor ? 'given-by-doctor' : null;
    }
    return 'assigned';
  }

  async addNewVaccineInScheduleTable(scheduleDate, unfillData) {
    const loading = await this.loadingController.create({
      message: 'Updating Schedule'
    });
    await loading.present();
    this.fgAddData.value.DoctorId = unfillData.DoctorId;
    this.fgAddData.value.IsDone = false;
    this.fgAddData.value.BrandId = unfillData.BrandId;
    this.fgAddData.value.IsDisease = unfillData.IsDisease;
    this.fgAddData.value.DiseaseYear = unfillData.DiseaseYear;
    this.fgAddData.value.ChildId = unfillData.ChildId;
    this.fgAddData.value.DoseId = unfillData.DoseId;
    this.fgAddData.value.Date = scheduleDate;

    await this.vaccineService.AddChildSchedule(this.fgAddData.value).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Success: Created new dose of ' + unfillData.Dose.Name, 'success', false, 3000);
          console.log("Added vaccine");
          // console.log(res.ResponseData);
          this.getVaccination();
          loading.dismiss();
        }
        else {
          this.toastService.create("Error: Try Again\nFailed to create new dose of " + unfillData.Dose.Name + "\nRequired Action: Unskip and Skip Again", 'danger', false, 7000);
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  async UnSkipVaccine(id, doseName) {
    const loading = await this.loadingController.create({
      message: 'Unskipping ' + doseName
    });

    await loading.present();
    var unskipData: any = {
      Id: id,
      IsSkip: false,
    };
    if (this.usertype === 'PA' && this.paId) {
      unskipData.PaId = this.paId;
    }

    await this.vaccineService.UnfillChildVaccine(unskipData).subscribe(
      res => {
        if (res.IsSuccess) {
          // console.log(res.ResponseData)
          this.toastService.create('Success: Unskipped ' + doseName, 'success', false, 3000);
          if (this.isInfiniteVaccine(res.ResponseData)) {
            var cId = res.ResponseData.ChildId;
            var dId = res.ResponseData.Dose.Id;
            var dSchedule = res.ResponseData.Date;
            this.deleteFutureSchedules(cId, dId, dSchedule);
            loading.dismiss();
          }
          else {
            this.getVaccination();
            loading.dismiss();
          }
        }
        else {
          loading.dismiss();
          this.alertController.create({
            header: 'Cannot Unskip',
            message: res.Message,
            buttons: ['OK']
          }).then(a => a.present());
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  // Keep MinGap conversion aligned with backend ScheduleController.calculateDate
  addDays(date, days) {
    const baseDate = this.toLocalDate(date);
    const safeDays = Number(days);
    const gapDays = !isNaN(safeDays) ? safeDays : 0;

    if (gapDays === 30 || gapDays === 31) {
      return this.addMonths(baseDate, 1);
    }

    if (gapDays === 150) {
      return this.addMonths(baseDate, 5);
    }

    if (gapDays === 84) {
      return this.addMonths(baseDate, 3);
    }

    if (gapDays === 3315) {
      return this.addMonths(this.addYears(baseDate, 9), 1);
    }

    if (gapDays === 3833) {
      return this.addMonths(this.addYears(baseDate, 10), 6);
    }

    if (gapDays >= 365 && gapDays <= 9125 && gapDays % 365 === 0) {
      return this.addYears(baseDate, Math.floor(gapDays / 365));
    }

    if (gapDays >= 168 && gapDays <= 334) {
      return this.addMonths(baseDate, Math.floor(gapDays / 28));
    }

    if (gapDays >= 401 && gapDays <= 460) {
      return this.addMonths(baseDate, gapDays - 400);
    }

    if (gapDays >= 395 && gapDays <= 608) {
      return this.addMonths(baseDate, Math.floor(gapDays / 29));
    }

    if (gapDays >= 639 && gapDays <= 1795) {
      return this.addMonths(baseDate, Math.floor(gapDays / 30));
    }

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + gapDays);
    return nextDate;
  }

  private toLocalDate(input: any): Date {
    if (input instanceof Date) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }

    if (typeof input === 'string') {
      const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
      const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

      let m = input.match(ddmmyyyy);
      if (m) {
        return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      }

      m = input.match(yyyymmdd);
      if (m) {
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      }
    }

    const fallback = new Date(input);
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  private addMonths(date: Date, months: number): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);
    return nextDate;
  }

  private addYears(date: Date, years: number): Date {
    const nextDate = new Date(date);
    nextDate.setFullYear(nextDate.getFullYear() + years);
    return nextDate;
  }

  async updateScheduleApproval(scheduleId: number) {
    const loading = await this.loadingController.create({ message: 'Approving…' });
    await loading.present();
    this.scheduleService.patchIsApproved(scheduleId).subscribe(
      (response: any) => {
        loading.dismiss();
        this.toastService.create(response.message || 'Approved', 'success');
        // Update in-memory — no full reload needed
        for (const key of Object.keys(this.dataGrouping)) {
          const group = this.dataGrouping[key];
          if (Array.isArray(group)) {
            const row = group.find((v: any) => v.Id === scheduleId);
            if (row) { row.IsPAApprove = true; break; }
          }
        }
      },
      (error) => {
        loading.dismiss();
        this.toastService.create((error.error && error.error.message) || 'Approval failed', 'danger');
      }
    );
  }

  async showAuditPopover(event: Event, vaccine: any) {
    const popover = await this.popoverController.create({
      component: AuditPopoverComponent,
      componentProps: { vaccine },
      event,
      translucent: true,
      cssClass: 'audit-popover',
    });
    await popover.present();
  }

  // async UnfillVaccine(id, Data = null) {
  //   const loading = await this.loadingController.create({
  //     message: 'Unfilling vaccine'
  //   });
  //   if (!Data) {
  //     await loading.present();
  //   }

  //   let data = {
  //     Id: id,
  //     IsDone: false,
  //   }
  //   if (Data) {
  //     data = Data;
  //   }

  //   await this.vaccineService.UnfillChildVaccine(data)
  //     .subscribe(
  //       res => {
  //         if (res.IsSuccess) {
  //           if (res.ResponseData.Dose.Vaccine.isInfinite) {
  //             var cId = res.ResponseData.ChildId;
  //             var dId = res.ResponseData.Dose.Id;
  //             var dSchedule = res.ResponseData.Date;
  //             this.deleteFutureSchedules(cId, dId, dSchedule);
  //             loading.dismiss();
  //           }
  //           else {
  //             this.getVaccination();
  //             loading.dismiss();
  //           }
  //         }
  //         else {
  //           loading.dismiss();
  //           this.toastService.create(res.Message, 'danger');
  //         }
  //       },
  //       err => {
  //         this.toastService.create('Error: server failure');
  //         loading.dismiss();
  //       }
  //     );
  // }
  // Method to download the travel PDF
  downloadTravelPdf() {
    this.vaccineService.generateTravelPdf(this.childId).subscribe((response: Blob) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = this.vaccineService.getLastContentDisposition();
      let filename = 'Immunization-Record.pdf';
      
      if (contentDisposition) {
        // Extract filename from Content-Disposition header
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

  downloadSpecialPdf() {
    this.vaccineService.generateSpecialPdf(this.childId).subscribe((response: Blob) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = this.vaccineService.getLastContentDisposition();
      let filename = 'Immunization-Record.pdf';

      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

  openAssignPopup(groupVaccines: any[]) {
    if (this.assigningPA) { return; }
    if (this.clinicPAs.length === 0) {
      this.toastService.create('No PAs assigned to this clinic', 'warning');
      return;
    }
    this.paGuidelines = '';
    this.pendingAssignPA = null;
    // Undone schedule IDs in this date-group only — pinned to the new assignment
    // via PAAssignmentSchedule at creation time, no later re-inference.
    this.pendingAssignScheduleIds = (groupVaccines || [])
      .filter(function(v) { return !v.IsDone; })
      .map(function(v) { return v.Id; });
    this.assignPopupOpen = true;
  }

  selectPendingAssign(pa: any) {
    this.pendingAssignPA = pa;
  }

  confirmAssign() {
    if (!this.pendingAssignPA) { return; }
    this.doAssign(this.pendingAssignPA);
    this.pendingAssignPA = null;
  }

  closeAssignPopup() {
    this.assignPopupOpen = false;
    this.pendingAssignPA = null;
    this.paGuidelines = '';
    this.pendingAssignScheduleIds = [];
  }

  // GivenDate arrives over the wire as a "DD-MM-YYYY" string (OnlyDateConverter on the API
  // side), but getVaccination() (line ~254) already normalizes it to "YYYY-MM-DD" before
  // dataGrouping is built — so by the time this runs it's usually already YYYY-MM-DD.
  // Accept both formats; reject anything else (e.g. "01-01-0001" null-date edge case),
  // NOT new Date() / split('T'), which misreads "12-06-2026" as Dec 6 instead of Jun 12
  // for any day-of-month <= 12.
  private toInvoiceDateStr(givenDate: any): string | null {
    const parsed = moment(givenDate, ["YYYY-MM-DD", "DD-MM-YYYY"], true);
    return parsed.isValid() && parsed.year() > 2020 ? parsed.format("YYYY-MM-DD") : null;
  }

  private loadInvoiceExistence() {
    this.invoiceExistsMap = {};
    const childId = Number(this.childId);
    const grouped: any = this.dataGrouping;
    // Check all dates that have at least one given vaccine — EPI included, invoice existence is the only gate
    const doneDates = Object.keys(grouped).filter(date =>
      grouped[date].some((v: any) => v.IsDone)
    );
    doneDates.forEach(date => {
      const group: any[] = grouped[date];
      const doneVaccine = group.find(function(v: any) { return v.IsDone && v.GivenDate; });
      if (!doneVaccine) { return; }
      const givenDateStr = this.toInvoiceDateStr(doneVaccine.GivenDate);
      if (!givenDateStr) { return; }
      this.invoiceService.getInvoiceTotal(childId, givenDateStr).toPromise().then(res => {
        if (res && res.IsSuccess) {
          this.invoiceExistsMap[date] = true;
          this.cdr.detectChanges();
        } else {
          // PKT/UTC midnight boundary fallback
          const prev = new Date(givenDateStr);
          prev.setDate(prev.getDate() - 1);
          const prevStr = prev.toISOString().split('T')[0];
          this.invoiceService.getInvoiceTotal(childId, prevStr).toPromise().then(res2 => {
            if (res2 && res2.IsSuccess) {
              this.invoiceExistsMap[date] = true;
              this.cdr.detectChanges();
            }
          }).catch(function() {});
        }
      }).catch(function() {});
    });
  }

  hasUnpaidDoneVaccine(data: any[], date: string): boolean {
    if (!this.invoiceExistsMap[date]) { return false; }

    const isPA = this.usertype === 'PA' && !!this.paId;

    if (isPA) {
      return data.some((v) => {
        // No per-schedule Amount check here — invoiceExistsMap[date] already confirms an
        // invoice exists for this visit (e.g. consultation-fee-only invoices have Amount=0
        // on every schedule row, but still need a payment mode recorded).
        // No DoneAt recency window either — PaymentCollectorPaId is the correct, exact gate
        // (backfilled at invoice-link time even for doses given before the PA was assigned,
        // see SyncInvoicePaToActiveAssignment/PAAssignmentController.Create). A recency window
        // here would only re-hide the icon for exactly the doctor-gives-then-assigns-later
        // ordering this gate exists to support.
        if (!v.IsDone || v.IsPaymentCollected) return false;
        return v.PaymentCollectorPaId === this.paId;
      });
    }

    return data.some(function(v) { return v.IsDone && !v.IsPaymentCollected; });
  }

  getDoneScheduleId(data: any[]): number {
    const done = data.find(v => v.IsDone && !v.Due2EPI);
    return done ? done.Id : data[0].Id;
  }

  async openPaymentPopup(scheduleId: number, groupVaccines: any[]) {
    this.paymentTargetScheduleId = scheduleId;
    // Collect ALL done schedule IDs in this group — payment mode is recorded for the whole
    // visit even when individual schedules have Amount=0 (e.g. consultation-fee-only invoices).
    this.paymentTargetScheduleIds = (groupVaccines || [])
      .filter(function(v) { return v.IsDone && v.Id; })
      .map(function(v) { return v.Id; });
    this.paymentDueAmount = 0;
    this.paymentPopupOpen = true;
    const doneVaccine = groupVaccines.find(function(v) { return v.IsDone && v.GivenDate; });
    if (doneVaccine) {
      const givenDateStr = this.toInvoiceDateStr(doneVaccine.GivenDate);
      const childId = Number(this.childId);
      // Try current date first, then previous day (UTC vs local timezone offset)
      try {
        if (!givenDateStr) { return; }
        const res = await this.invoiceService.getInvoiceTotal(childId, givenDateStr).toPromise();
        if (res && res.IsSuccess && res.ResponseData > 0) {
          this.paymentDueAmount = res.ResponseData;
        } else {
          const prev = new Date(givenDateStr);
          prev.setDate(prev.getDate() - 1);
          const prevStr = prev.toISOString().split('T')[0];
          const res2 = await this.invoiceService.getInvoiceTotal(childId, prevStr).toPromise();
          if (res2 && res2.IsSuccess && res2.ResponseData > 0) {
            this.paymentDueAmount = res2.ResponseData;
          }
        }
      } catch { /* amount stays 0 — user can still proceed */ }
    }
  }

  closePaymentPopup() {
    this.paymentPopupOpen = false;
    this.paymentTargetScheduleId = null;
    this.paymentTargetScheduleIds = [];
    this.paymentDueAmount = 0;
  }

  async submitPayment(mode: 'Cash' | 'Online') {
    const ids = this.paymentTargetScheduleIds.length > 0
      ? this.paymentTargetScheduleIds
      : (this.paymentTargetScheduleId ? [this.paymentTargetScheduleId] : []);
    if (ids.length === 0) return;
    const loading = await this.loadingController.create({ message: 'Recording payment...' });
    await loading.present();
    // Record payment mode for ALL schedules in this visit in parallel
    const calls = ids.map(id => this.scheduleService.recordPaymentMode(id, { PaymentMode: mode }).toPromise());
    try {
      await Promise.all(calls);
      loading.dismiss();
      this.closePaymentPopup();
      this.toastService.create('Payment recorded: ' + mode, 'success');
      this.getVaccination();
    } catch {
      loading.dismiss();
      this.toastService.create('Error recording payment — please try again', 'danger');
      // popup stays open so user can retry
    }
  }

  doAssign(pa: any) {
    if (this.assigningPA) { return; }
    if (!this.doctorId || !this.clinicId || !this.childId) {
      this.toastService.create('Patient or clinic info not loaded yet', 'warning');
      return;
    }
    this.assigningPA = true;
    this.assignPopupOpen = false;
    const payload = {
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      PersonalAssistantId: pa.Id,
      ChildId: Number(this.childId),
      Notes: this.paGuidelines || '',
      ScheduleIds: this.pendingAssignScheduleIds || []
    };
    this.paGuidelines = '';
    this.pendingAssignScheduleIds = [];
    this.paService.createAssignment(payload).subscribe(res => {
      if (res && res.IsSuccess) {
        this.loadActiveAssignment(() => {
          this.assigningPA = false;
          this.toastService.create('Assigned to ' + pa.Name, 'success');
        });
      } else {
        this.assigningPA = false;
        this.toastService.create(res.Message || 'Failed to assign', 'danger');
      }
    }, (err) => {
      this.assigningPA = false;
      const msg = err && err.error && err.error.Message ? err.error.Message
                : err && err.message ? err.message
                : 'Failed to assign';
      this.toastService.create(msg, 'danger');
    });
  }

  loadActiveAssignment(onDone?: () => void) {
    if (!this.doctorId || !this.childId) { if (onDone) onDone(); return; }
    this.activeAssignmentLoading = true;
    this.paService.getActiveAssignmentsForDoctor(this.doctorId).subscribe(res => {
      this.activeAssignmentLoading = false;
      if (res && res.IsSuccess) {
        const all: any[] = res.ResponseData || [];
        this.activeAssignment = all.find(a => a.ChildId === Number(this.childId)) || null;
      }
      if (onDone) onDone();
    }, () => {
      this.activeAssignmentLoading = false;
      if (onDone) onDone();
    });
  }

  // PA view of the active assignment — GetByPA is PA-scoped (no doctorId needed),
  // and already returns AssignmentId + AssignmentStatus for this child.
  loadActivePAAssignment(onDone?: () => void) {
    if (!this.paId || !this.childId) { if (onDone) onDone(); return; }
    this.paService.getAssignments(this.paId).subscribe(res => {
      if (res && res.IsSuccess) {
        const all: any[] = res.ResponseData || [];
        this.activeAssignment = all.find(a => a.ChildId === Number(this.childId)) || null;
      }
      if (onDone) onDone();
    }, () => { if (onDone) onDone(); });
  }

  // Mirrors payables.page.ts's promptDone()/doCompleteAssignment(), but checks payment
  // status against this.vaccine (already loaded on this page) instead of a separate
  // Schedules array — same source of truth, no extra request.
  async promptDoneFromVaccinePage() {
    if (!this.activeAssignment) { return; }
    const unpaid = (this.vaccine || []).filter((s: any) =>
      s.IsDone && s.PaymentCollectorPaId === this.paId && !s.IsPaymentCollected);

    if (unpaid.length > 0) {
      const names = unpaid.map((s: any) => s.Dose && s.Dose.Name ? s.Dose.Name : '').filter((n: string) => !!n).join(', ');
      const alert = await this.alertController.create({
        header: 'Payment Pending',
        message: 'Please record payment for: ' + names + '. Use the money icon above first.',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertController.create({
      header: 'Mark as Done',
      message: 'Mark this assignment as done? This will move it to Pending Cash Handover for the doctor to confirm.',
      buttons: [
        { text: 'Back', role: 'cancel' },
        { text: 'Mark Done', handler: () => { this.doCompleteAssignmentFromVaccinePage(); } }
      ]
    });
    await confirm.present();
  }

  async doCompleteAssignmentFromVaccinePage() {
    if (!this.activeAssignment || !this.paId) { return; }
    const loading = await this.loadingController.create({ message: 'Marking done...' });
    await loading.present();
    this.paService.markAssignmentDone(this.activeAssignment.AssignmentId, this.paId).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Marked as done — pending cash handover', 'success');
          this.getVaccination();
          this.loadActivePAAssignment();
        } else {
          this.toastService.create((res && res.Message) || 'Mark done failed', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Mark done failed', 'danger'); }
    );
  }

  async confirmCancelAssignment() {
    const alert = await this.alertController.create({
      header: 'Cancel Assignment',
      message: `Cancel the active assignment for ${this.activeAssignment ? this.activeAssignment.ChildName : 'this patient'}?`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Yes, Cancel', handler: (data) => { this.doCancelAssignment(data.reason || ''); } }
      ]
    });
    await alert.present();
  }

  async doCancelAssignment(reason: string) {
    if (!this.activeAssignment) return;
    const loading = await this.loadingController.create({ message: 'Cancelling...' });
    await loading.present();
    this.paService.cancelAssignment(this.activeAssignment.AssignmentId, 'DOCTOR', this.doctorId, reason).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment cancelled', 'success');
          this.activeAssignment = null;
        } else {
          this.toastService.create(res.Message || 'Failed to cancel', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Failed to cancel assignment', 'danger'); }
    );
  }

  openReassignPopup() {
    if (!this.activeAssignment) {
      this.toastService.create('No active assignment to reassign', 'warning');
      return;
    }
    if (this.clinicPAs.length === 0) {
      this.toastService.create('No PAs available at this clinic', 'warning');
      return;
    }
    this.paGuidelines = '';
    this.pendingReassignPA = null;
    this.reassignPopupOpen = true;
  }

  selectPendingReassign(pa: any) {
    this.pendingReassignPA = pa;
  }

  confirmReassign() {
    if (!this.pendingReassignPA) { return; }
    this.doReassign(this.pendingReassignPA);
    this.pendingReassignPA = null;
  }

  closeReassignPopup() {
    this.reassignPopupOpen = false;
    this.pendingReassignPA = null;
    this.paGuidelines = '';
  }

  async doReassign(pa: any) {
    this.reassignPopupOpen = false;
    if (!this.activeAssignment) return;
    const loading = await this.loadingController.create({ message: 'Reassigning...' });
    await loading.present();
    this.paService.reassignAssignment(this.activeAssignment.AssignmentId, pa.Id).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Reassigned to ' + pa.Name, 'success');
          this.loadActiveAssignment();
        } else {
          this.toastService.create(res.Message || 'Failed to reassign', 'danger');
        }
      },
      () => { loading.dismiss(); this.toastService.create('Failed to reassign', 'danger'); }
    );
  }
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects
