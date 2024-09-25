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
import { VaccineService } from "src/app/services/vaccine.service";

@Component({
  selector: "app-bulk",
  templateUrl: "./bulk.page.html",
  styleUrls: ["./bulk.page.scss"]
})
export class BulkPage implements OnInit {
  childId: any;
  doctorId: any;
  currentDate: any;
  currentDate1: any;
  bulkData: any;
  fg: FormGroup;
  todaydate: any;
  BrandIds = [];
  customActionSheetOptions: any = {
    header: 'Select Brand',
    cssClass: 'action-sheet-class'
  };
  constructor(
    private loadingController: LoadingController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private bulkService: BulkService,
    private toastService: ToastService,
    private storage: Storage,
    public alertController: AlertController,
    private vaccineService: VaccineService
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");

    this.currentDate = new Date(this.activatedRoute.snapshot.paramMap.get("childId"));
    this.currentDate1 = moment(this.currentDate).format("YYYY-MM-DD");
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, 'DD-MM-YYYY').format("YYYY-MM-DD");

    this.getBulk();

    this.fg = this.formBuilder.group({
      DoctorId: [""],
      Id: [null],
      Weight: ['', [Validators.required, Validators.pattern('^[0-9.]*$')]],
      Height: ['', [Validators.required, Validators.pattern('^[0-9.]*$')]],
      Circle: ['', [Validators.required, Validators.pattern('^[0-9.]*$')]],
      BrandId0: [null],
      BrandId1: [null],
      BrandId2: [null],
      BrandId3: [null],
      //  BrandId: this.BrandId,
      GivenDate: this.currentDate
    });
  }

  async getBulk() {
    let data = { ChildId: this.childId, Date: this.currentDate };
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.bulkService.getBulk(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.bulkData = res.ResponseData;
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
    var brands = [];
    var i = 0;
    this.bulkData.forEach(element => {
      if (this.BrandIds[i])
        brands.push({ BrandId: this.BrandIds[i], ScheduleId: element.Id });
      i++;
    });

    let data = {
      Circle: this.fg.value.Circle,
      Date: this.fg.value.Date,
      DoctorId: this.doctorId,
      GivenDate: this.fg.value.GivenDate,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: true,
      ScheduleBrands: brands,
      Id: this.bulkData[0].Id
    };

    this.fillVaccine(data);
  }

  async fillVaccine(data) {
    data.GivenDate = moment(this.fg.value.GivenDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    const loading = await this.loadingController.create({
      message: "Filling Vaccine"
    });

    await loading.present();
    await this.bulkService.updateVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("Succfully Update");
          this.validationOfInfiniteVaccine();
          loading.dismiss();

        } else {
          this.toastService.create("Error: failed to fill vaccine");
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create("Error: server failure");
        loading.dismiss();
      }
    );
  }

  async validationOfInfiniteVaccine() {
    const loading = await this.loadingController.create({
      message: "Loading Infinite Vaccine"
    });

    await loading.present();
    this.bulkData.forEach(element => {
      if (element.Dose.Vaccine.isInfinite) {
        this.addNewVaccineInScheduleTable(element);
      }
    });
    this.router.navigate(["/members/child/vaccine/" + this.childId]);
    loading.dismiss();
  }

  async addNewVaccineInScheduleTable(element) {
    const loading = await this.loadingController.create({
      message: 'Adding Infinite Vaccine'
    });

    let scheduleDate: Date = this.addDays(this.fg.value.GivenDate, element.Dose.MinGap, element.Dose.Id);

    await loading.present();

    let VaccineData = {
      Date: scheduleDate,
      DoctorId: this.doctorId,
      GivenDate: this.fg.value.GivenDate,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: false,
      ChildId: this.childId,
      DoseId: element.Dose.Id,
      IsSkip: false
    };

    await this.vaccineService.AddChildSchedule(VaccineData).subscribe(
      res => {
        if (res.IsSuccess) {
          this.router.navigate(["/members/child/vaccine/" + this.childId]);
          window.location.reload();
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create("Error: failed to add injection");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create("Error: server failure");
      }
    );


  }



  addDays(date, days, doseId) {
    var myDate = new Date(date);
    if (doseId === 30 && days === 1095) {
        myDate.setFullYear(myDate.getFullYear() + 3);
    } else {
        myDate.setDate(myDate.getDate() + days);
    }

    // Handle leap year for future vaccines
    if (myDate.getMonth() === 1 && myDate.getDate() === 29 && !this.isLeapYear(myDate.getFullYear())) {
        myDate.setDate(28); // Adjust to February 28 if not a leap year
    }

    return myDate;
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  isSubmitDisabled(): boolean {
    for (let brandId of this.BrandIds) {
      if (brandId) {
        return false;
      }
    }
    return true;
  }
  
  
}
