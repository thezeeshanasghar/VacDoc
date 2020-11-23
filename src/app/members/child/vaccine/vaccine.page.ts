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
import { Downloader , DownloadRequest , NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Storage } from '@ionic/storage';


@Component({
  selector: "app-vaccine",
  templateUrl: "./vaccine.page.html",
  styleUrls: ["./vaccine.page.scss"]
})
export class VaccinePage {
  vaccine: any[] = [];
  specialvaccineids: any[] = [];
  dataGrouping: any[] = [];
  childId: any;
  Pneum2Date: any;
  BirthYear: any;
  ChildName: string;
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

    // private document: DocumentViewer,
  ) { }

  ionViewWillEnter() {
    this.childId = this.route.snapshot.paramMap.get("id");
    this.getVaccination();
  }
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
      message: "Loading"
    });

    await loading.present();
    await this.vaccineService
      .getVaccinationById(this.route.snapshot.paramMap.get("id"))
      .subscribe(
        res => {
          if (res.IsSuccess && res.ResponseData.length > 0 ) {
          // res.ResponseData = res.ResponseData.filter(item=> (!item.IsSkip));
           // console.log(res.ResponseData);
           this.BirthYear = res.ResponseData[0].Child.DOB;
           console.log(this.BirthYear);
           this.storage.set('BirthYear' , this.BirthYear);
           
            //original code
            this.vaccine = res.ResponseData;
            this.ChildName = this.vaccine[0].Child.Name;
            this.vaccine.forEach(doc => {
              doc.Date = moment(doc.Date, "DD-MM-YYYY").format("YYYY-MM-DD");
              if (doc.GivenDate)
              doc.GivenDate = moment(doc.GivenDate, "DD-MM-YYYY").format("YYYY-MM-DD");
            });
           
            this.dataGrouping = this.groupBy(this.vaccine, "Date");
            console.log(this.dataGrouping);
            loading.dismiss();
          
          } else {
            loading.dismiss();
           // this.toastService.create(res.Message, "danger");
          }
        },
        err => {
          loading.dismiss();
          this.toastService.create(err, "danger");
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
 let firstDate =  new Date(DOB);
 const secondDate = new Date(this.Pneum2Date);

// const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
var diff = Math.abs(firstDate.getTime() - secondDate.getTime());
var diffDays = Math.ceil(diff / (1000 * 3600 * 24)); 
console.log(diffDays);console.log(firstDate);console.log(secondDate);

    }
    else {
      this.router.navigate(["/members/child/vaccine/" + this.childId + "/fill/" + Id]);
    }
   // let Date = moment(DOB, 'DD-MM-YYYY');
    console.log(DOB);
    console.log(this.Pneum2Date);
  }



  printdata() {
    this.download(this.childId);
  }
  
  download(id){
    var request: DownloadRequest = {
      uri: `${this.API_VACCINE}child/${id}/Download-Schedule-PDF`,
      title: 'Child Schedule',
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
  .then((location: string) => console.log('File downloaded at:'+location))
  .catch((error: any) => console.error(error));
  
  }

  async UnfillVaccine(id) {
    console.log(5);
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    let data = {
      Id: id,
      IsDone: false,
    }
    await this.vaccineService.UnfillChildVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Succfully Update');
          loading.dismiss();
          this.getVaccination();
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
    );
  }

  async SkipVaccine(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    let data = {
      Id: id,
      IsSkip: true,
    }
    await this.vaccineService.UnfillChildVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Succfully Update');
          loading.dismiss();
          this.getVaccination();

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
    );
  }

  async UnSkipVaccine(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    let data = {
      Id: id,
      IsSkip: false,
    }
    await this.vaccineService.UnfillChildVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create('Succfully Update');
          loading.dismiss();
          this.getVaccination();

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
    );
  }
  // getprint(id)
  // {
  //   this.vaccineService.getscheduleprint(id).subscribe(
  //     res => {
  //       console.log("success");
  //     },
  //     err => {
  //       this.toastService.create(err, "danger");
  //     }
  //   );
  // }


}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects
