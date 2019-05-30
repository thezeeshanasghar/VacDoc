import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ToastService } from "src/app/shared/toast.service";
import { ActivatedRoute, Router } from "@angular/router";
import * as moment from "moment";
import { BulkService } from "src/app/services/bulk.service";

@Component({
  selector: "app-vaccine",
  templateUrl: "./vaccine.page.html",
  styleUrls: ["./vaccine.page.scss"]
})
export class VaccinePage {
  vaccine: any[] = [];
  dataGrouping: any[] = [];
  childID: any;
  constructor(
    public loadingController: LoadingController,
    public route: ActivatedRoute,
    public router: Router,
    private vaccineService: VaccineService,
    private bulkService: BulkService,
    private toastService: ToastService
  ) {}

  ionViewWillEnter() {
    this.childID = this.route.snapshot.paramMap.get("id");
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
          if (res.IsSuccess) {
            this.vaccine = res.ResponseData;
            this.dataGrouping = this.groupBy(this.vaccine, "Date");
            console.log(this.dataGrouping);
            loading.dismiss();
            this.vaccine.forEach(doc => {
              doc.Date = moment(doc.Date, "DD-MM-YYYY").format("YYYY-MM-DD");
            });
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

  groupBy(objectArray, property) {
    return objectArray.reduce(
      function(acc, obj) {
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
    let newDate = $event.detail.value;
    newDate = moment(newDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    let data = { Date: newDate, ID: vacId };
    await this.vaccineService.updateVaccinationDate(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

  async updateBulkDate($event, id) {
    let newDate = $event.detail.value;
    newDate = moment(newDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    let data = { Date: newDate, ID: id };

    await this.bulkService.updateInjectionDate(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message);
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }
  printdata() {
    //this.vaccineService.printVaccineSchedule(this.childID);
  }
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects
