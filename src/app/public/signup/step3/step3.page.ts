import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { DoseService } from "src/app/services/dose.service";
import { ToastService } from "src/app/shared/toast.service";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators
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
  selector: "app-step3",
  templateUrl: "./step3.page.html",
  styleUrls: ["./step3.page.scss"]
})
export class Step3Page implements OnInit {
  public fg: FormGroup;

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
  ngOnInit() {
    this.fg = this.formBuilder.group({});

    this.getVaccineInfo();
  }

  async getVaccineInfo() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.doseService.getDoses().subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
         // this.signupService.vaccineData2 = this.doses;
           this.doses.forEach(dose => {
         
               let value = dose.MinAge == null ? 0 : dose.MinAge;
               let name = dose.Name;
              // if (dose.DoseOrder == 1)
              // name = dose.Name+'_first';
              // else if (dose.DoseOrder == 2)
              // name = dose.Name+'_second';
              // else if (dose.DoseOrder == 3)
              // name = dose.Name+'_third';
              // else if (dose.DoseOrder == 4)
              // name = dose.Name+'_fourth';
              // else if (dose.DoseOrder == 5)
              // name = dose.Name+'_fifth'
              // else if (dose.DoseOrder == 6)
              // name = dose.Name+'_sixth'
              // else if (dose.DoseOrder == 7)
              // name = dose.Name+'_seventh'
              
            this.fg.addControl(
              name,
              new FormControl(value, Validators.required)
            );
            dose.IsSpecial = false;
           // changes in old copy
          });
console.log(this.fg);

          // for(var i=0; i<this.doses.length; i++)
          // {
          //   //let value = 
          //  // if (this.doses[i].MinAge == null)  
          //  // this.doses[i].MinAge = 0;
          //   // this.fg.addControl(
          //   //       this.doses[i].Name,
          //   //       new FormControl(value, Validators.required)
          //   //     );
                
          // }
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
    this.addNewClinic();
  }


  async addNewClinic() {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.signupService.addDoctor().subscribe(
      res => {
        if (res.IsSuccess) {
          this.addDoctorSchedule(res.ResponseData.Id);
          // create sms
          // {
          //   var sms = "Hi Dr. " + this.titlecasePipe.transform(res.ResponseData.FirstName) + " " + this.titlecasePipe.transform(res.ResponseData.LastName) + " \n"
          //   + "You are registered at Vaccs.io\n\n"
          //   + "Your account credentials are: \n"
          //   + "Id/Mobile Number: " + res.ResponseData.MobileNumber + "\n"
          //   + "Password: " + res.ResponseData.Password + "\n"
          //   + "https://vaccs.io/";
          // }

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

  async addDoctorSchedule(id) {
    this.signupService.vaccineData = this.fg.value;
    this.signupService.vaccineData2 = this.doses;
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


//   checkScheduleValidity(minage,key) {
//   console.log(minage);
//   console.log(key);
// //  console.log(select);

//  // this.fg.controls[key].setErrors({ required: true });
//   }
//   validation_messages = {
//     MinAge: [{ type: "required", message: "Can not reschedule" }]
//   };
}
