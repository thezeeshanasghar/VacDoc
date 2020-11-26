import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { DoseService } from "src/app/services/dose.service";
import { ToastService } from "src/app/shared/toast.service";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  FormArray
} from "@angular/forms";
import { SignupService } from "src/app/services/signup.service";
import { Router, ActivatedRoute } from "@angular/router";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { TitleCasePipe } from '@angular/common';

//https://www.joshmorony.com/dynamic-infinite-input-fields-in-an-ionic-application/

@Component({
  selector: "app-schedueedit",
  templateUrl: "./sceduleedit.page.html",
  styleUrls: ["./sceduleedit.page.scss"]
})
export class SceduleEditPage implements OnInit {
  public fg: FormGroup;
  doctorId: any;

  doses: any;
  constructor(
    private loadingController: LoadingController,
    private doseService: DoseService,
    private signupService: SignupService,
    private toastService: ToastService,
    private formBuilder: FormBuilder,
    private router: Router,
    private storage: Storage,
    private activatedRoute: ActivatedRoute,
    private androidPermissions: AndroidPermissions ,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe
    
  ) {}
 async ngOnInit() {
    this.fg = this.formBuilder.group({});
    await this.storage.get(environment.DOCTOR_Id).then(docId => {
      this.doctorId = docId;
    });
    this.getVaccineInfo(this.doctorId);
  }

  async getVaccineInfo(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doseService.getNewDoses(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
         // this.signupService.vaccineData2 = this.doses;
          this.doses.forEach(dose => {
              let value = dose.MinAge == null ? 0 : dose.MinAge;
            this.fg.addControl(
              dose.Name,
              new FormControl(value, Validators.required)
            );   

          });
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

  onSubmit() {
    console.log(this.fg.value);
  }

  async updateDoctorSchedule(id) {
    this.signupService.vaccineData = this.fg.value;
    await this.signupService.addSchedule(id).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("successfully added");
          this.router.navigate(["/login"]);
        } else {
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        this.toastService.create(err, "danger");
      }
    );
  }

 
  async getdoses(){
   let newschedule=[]
    this.doses.forEach(dose => {
      if (dose.IsSpecial)
      {
        newschedule.push({
          DoseId: dose.Id,
          DoctorId: this.doctorId,
          GapInDays: dose.MinAge
        });
      }
    });
    
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    if(newschedule)
    this.doseService.addScheduleDose(newschedule).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create("successfully Added", "success");
        this.router.navigate(['/members/doctor/schedule']);
      },
      err => {
        loading.dismiss();
      //  this.formcontroll = false;
        this.toastService.create(err, "danger");
      }
    );
    
  }
}
