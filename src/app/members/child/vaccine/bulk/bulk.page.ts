import { Component, OnInit } from "@angular/core";
import { Route, ActivatedRoute, Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { BulkService } from "src/app/services/bulk.service";
import { ToastService } from "src/app/shared/toast.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import * as moment from "moment";
import { AlertController } from '@ionic/angular';

@Component({
  selector: "app-bulk",
  templateUrl: "./bulk.page.html",
  styleUrls: ["./bulk.page.scss"]
})
export class BulkPage implements OnInit {
  childId: any;
  doctorId: any;
  currentDate: any;
  bulkData: any;
  fg: FormGroup;
  constructor(
    private loadingController: LoadingController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private bulkService: BulkService,
    private toastService: ToastService,
    private storage: Storage,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");
    console.log(this.childId);

    this.currentDate = this.activatedRoute.snapshot.paramMap.get("childId");
    console.log(this.currentDate);

    this.getBulk();

    this.fg = this.formBuilder.group({
      DoctorId: [""],
      Id: [null],
      Weight: [null],
      Height: [null],
      Circle: [null],
      BrandId0: [null],
      BrandId1: [null],
      BrandId2: [null],
      BrandId3: [null],
      GivenDate: [null]
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
    let data = {
      Circle: this.fg.value.Circle,
      Date: this.fg.value.Date,
      DoctorId: this.doctorId,
      GivenDate: this.fg.value.GivenDate,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: true,
      ScheduleBrands: [
        { BrandId: "", ScheduleId: "" },
        { BrandId: "", ScheduleId: "" },
        { BrandId: "", ScheduleId: "" }
      ],
      Id: ""
    };
    if (this.fg.value.BrandId0) {
      data.ScheduleBrands[0].ScheduleId = this.bulkData[0].Id;
      data.ScheduleBrands[0].BrandId = this.fg.value.BrandId0;
      data.Id = this.bulkData[0].Id;
    }

    if (this.fg.value.BrandId1) {
      data.ScheduleBrands[1].ScheduleId = this.bulkData[1].Id;
      data.ScheduleBrands[1].BrandId = this.fg.value.BrandId1;
    }
    if (this.fg.value.BrandId2) {
      data.ScheduleBrands[2].ScheduleId = this.bulkData[2].Id;
      data.ScheduleBrands[2].BrandId = this.fg.value.BrandId2;
    }
    console.log(data);
    this.fillVaccine(data);
  }

  async fillVaccine(data) {
    this.fg.value.GivenDate = moment(
      this.fg.value.GivenDate,
      "YYYY-MM-DD"
    ).format("DD-MM-YYYY");
    const loading = await this.loadingController.create({
      message: "Loading"
    });

    await loading.present();
    await this.bulkService.updateVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("Succfully Update");
          this.router.navigate(["/members/child/vaccine/"+this.childId]);
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
}
