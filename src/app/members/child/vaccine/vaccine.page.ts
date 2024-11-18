import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ToastService } from "src/app/shared/toast.service";
import { ActivatedRoute, Router } from "@angular/router";
import * as moment from "moment";
import { BulkService } from "src/app/services/bulk.service";
import { AlertController } from '@ionic/angular';
//import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
import { environment } from 'src/environments/environment';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { FormBuilder, FormGroup } from "@angular/forms";
// import { InvoiceService } from "src/app/services/invoice.service";


@Component({
  selector: "app-vaccine",
  templateUrl: "./vaccine.page.html",
  styleUrls: ["./vaccine.page.scss"]
})
export class VaccinePage {
  vaccine: any[] = [];
  specialvaccineids: any[] = [];
  dataGrouping: any[] = [];
  vaccinesData = [];
  childId: any;
  alphabetically: any;
  Pneum2Date: any;
  BirthYear: any;
  ChildName: string;
  fgAddData: FormGroup;
  today: Date = new Date();
  private readonly API_VACCINE = `${environment.BASE_URL}`

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
    // private invoiceService: InvoiceService
    // private document: DocumentViewer,
  ) { }
  

  ionViewWillEnter() {
    this.childId = this.route.snapshot.paramMap.get("id");
    this.vaccinesData = [];
    this.getVaccination();

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
    var isdone: boolean = true;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].IsDone == false) {
        isdone = false;
        break;
      }
    }
    return isdone;
  }
  

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: "Loading Vaccines"
    });

    await loading.present();
    await this.vaccineService
      .getVaccinationById(this.route.snapshot.paramMap.get("id"))
      .subscribe(
        res => {
          if (res.IsSuccess && res.ResponseData.length > 0) {
            this.BirthYear = res.ResponseData[0].Child.DOB;
            this.storage.set('BirthYear', this.BirthYear);

            //original code
            this.vaccine = res.ResponseData;
            this.ChildName = this.vaccine[0].Child.Name;
            this.vaccine.forEach(doc => {
              doc.Date = moment(doc.Date, "DD-MM-YYYY").format("YYYY-MM-DD");
              if (doc.GivenDate)
                doc.GivenDate = moment(doc.GivenDate, "DD-MM-YYYY").format("YYYY-MM-DD");
              this.vaccinesData.push({ childId: doc.Child.Id, vaccineId: doc.Dose.VaccineId, brandId: doc.BrandId });
            });

            this.storage.set("vaccinesData", this.vaccinesData);

            this.dataGrouping = this.groupBy(this.vaccine, "Date");
            loading.dismiss();

          } else {
            this.toastService.create("Vaccines Not Found ! Please Add vaccines");
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
    console.log($event.value);
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
            }

            else if (message.search("Minimum Gap from previous dose of this vaccine should be") != -1) {
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
      console.log(name);
      //       const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      let firstDate = new Date(DOB);
      const secondDate = new Date(this.Pneum2Date);

      // const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
      var diff = Math.abs(firstDate.getTime() - secondDate.getTime());
      var diffDays = Math.ceil(diff / (1000 * 3600 * 24));
      console.log(diffDays); console.log(firstDate); console.log(secondDate);

    }
    else {
      this.router.navigate(["/members/child/vaccine/" + this.childId + "/fill/" + Id]);
    }
    // let Date = moment(DOB, 'DD-MM-YYYY');
    console.log(DOB);
    console.log(this.Pneum2Date);
  }

  printdata() {
    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      const url = `${this.API_VACCINE}child/${this.childId}/Download-Schedule-PDF`;
      window.open(url);
    }
    else
      this.download(this.childId);
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

  async UnfillVaccine(id) {
    const loading = await this.loadingController.create({
      message: 'Unfilling vaccine'
    });

    await loading.present();
    let data = {
      Id: id,
      IsDone: false,
    }

    await this.vaccineService.UnfillChildVaccine(data)
      .subscribe(
        res => {
          if (res.IsSuccess) {
            if (res.ResponseData.Dose.Vaccine.isInfinite) {
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
            this.toastService.create(res.Message, 'danger');
          }
        },
        err => {
          this.toastService.create('Error: server failure');
          loading.dismiss();
        }
      );
  }

  async deleteFutureSchedules(ChildId: string, DoseId: string, date: String) {
    const loading = await this.loadingController.create({
      message: 'Deleting Doses'
    });

    await loading.present();
    await this.vaccineService.DeleteVaccineByChildidDoseidDate(ChildId, DoseId, date)
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
    let data = {
      Id: id,
      IsSkip: true,
    }
 
    await this.vaccineService.UnfillChildVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Success: Skipped ' + res.ResponseData.Dose.Name, 'success', false, 3000);
          if (res.ResponseData.Dose.Vaccine.isInfinite) {
            let scheduleDate: any = this.addDays(res.ResponseData.Date, res.ResponseData.Dose.MinGap);
            this.addNewVaccineInScheduleTable(scheduleDate, res.ResponseData);
            loading.dismiss();
          } else {
            this.getVaccination();
            loading.dismiss();
          }
        }
        else {
          this.toastService.create('Error: Try again\nFailed to fill ' + res.ResponseData.Dose.Name, 'danger', false, 3000);
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
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
          console.log(res.ResponseData);
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
    let data = {
      Id: id,
      IsSkip: false,
    }


    await this.vaccineService.UnfillChildVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          console.log(res.ResponseData)
          this.toastService.create('Success: Unskipped ' + doseName, 'success', false, 3000);
          if (res.ResponseData.Dose.Vaccine.isInfinite) {
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
          this.toastService.create('Error: Try again\nFailed to Unskip ' + doseName, 'danger', false, 7000);
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create('Error: Try Again\nServer failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  addDays(date, days) {
    console.log("days");
    console.log(days);
    console.log("date");
    console.log(date);

    let momentVariable = moment(date, 'DD-MM-YYYY');
    var stringvalue = momentVariable.format('YYYY-MM-DD');
    var myDate = new Date(stringvalue);
    myDate.setDate(myDate.getDate() + days);

    console.log("schedule date")
    console.log(myDate)

    return myDate;
  }

}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects
