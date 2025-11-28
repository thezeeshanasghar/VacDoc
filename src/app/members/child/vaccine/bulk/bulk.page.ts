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
  usertype: any;
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
      GivenDate: this.currentDate,
      IsPAApprove: [null]
    });

    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; // Ensure this is set correctly
      } else {
        console.error('No user data found in storage.');
      }
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
          console.log(this.bulkData);
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
    console.log(this.usertype)
    if (this.usertype === 'DOCTOR') {
      this.fg.value.IsPAApprove = true;
    } else {
      this.fg.value.IsPAApprove = false;
    }
    let data = {
      Circle: this.fg.value.Circle,
      Date: this.fg.value.Date,
      DoctorId: this.doctorId,
      GivenDate: this.fg.value.GivenDate,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: true,
      ScheduleBrands: brands,
      Id: this.bulkData[0].Id,
      IsPAApprove: this.fg.value.IsPAApprove,	
    };

    this.fillVaccine(data);
  }

  isScheduleDateValid(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const givenDate = this.fg.get('GivenDate').value; 
    const formattedDate = new Date(givenDate).toISOString().split('T')[0];
    return formattedDate > today;
  }

  async fillVaccine(data) {
    data.GivenDate = moment(this.fg.value.GivenDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    const loading = await this.loadingController.create({
      message: "Filling Vaccine"
    });

    await loading.present();

    const givenDate = new Date(this.fg.value.GivenDate);
    const currentDate = new Date();

    // Reset time portions to compare just the dates
    givenDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (givenDate > currentDate) {
      this.toastService.create("Given date is not today. Cannot update injection.", 'danger');
      loading.dismiss();
      return;
    }

    await this.bulkService.updateVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("Successfully Update");
          this.validationOfInfiniteVaccine();
          loading.dismiss();
        } else {
          this.toastService.create("Error: failed to fill vaccine", "danger");
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create("Error: server failure", "danger");
        loading.dismiss();
      }
    );
  }

  async validationOfInfiniteVaccine() {
    const loading = await this.loadingController.create({
      message: "Adding Infinite Vaccines"
    });

    await loading.present();
    
    // Collect all promises for infinite vaccines
    const promises = [];
    this.bulkData.forEach(element => {
      if (element.Dose.Vaccine.isInfinite) {
        promises.push(this.addNewVaccineInScheduleTable(element));
      }
    });

    // Wait for all infinite vaccines to be added
    try {
      await Promise.all(promises);
      loading.dismiss();
      // Navigate only once after all vaccines are added
      this.router.navigate(["/members/child/vaccine/" + this.childId]);
    } catch (error) {
      loading.dismiss();
      this.toastService.create("Error adding infinite vaccines", "danger");
      console.error("Error in validationOfInfiniteVaccine:", error);
    }
  }

  async addNewVaccineInScheduleTable(element): Promise<void> {
    let scheduleDate: Date = this.addDays(this.fg.value.GivenDate, element.Dose.MinGap, element.Dose.Id);
    
    // Normalize date to midnight (remove time portion)
    scheduleDate.setHours(0, 0, 0, 0);

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

    return new Promise((resolve, reject) => {
      this.vaccineService.AddChildSchedule(VaccineData).subscribe(
        res => {
          if (res.IsSuccess) {
            console.log(`Added infinite vaccine: ${element.Dose.Name}`);
            resolve();
          }
          else {
            this.toastService.create("Error: failed to add injection", "danger");
            reject(new Error("Failed to add injection"));
          }
        },
        err => {
          this.toastService.create("Error: server failure", "danger");
          reject(err);
        }
      );
    });
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