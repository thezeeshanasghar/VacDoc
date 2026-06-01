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
export class ChildSceduleEditPage implements OnInit {
  public fg: FormGroup;
  ChildId: any;
  NewDoses = true;

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
    this.ChildId = await this.activatedRoute.snapshot.paramMap.get('id');
    this.getVaccineInfo(this.ChildId);
  }

  async getVaccineInfo(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    
    await this.doseService.getDosesChild(this.ChildId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doses = res.ResponseData;
  
          // Sort the doses by Name
          this.doses.sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
          });
  
          this.doses.forEach(dose => {
            let value = dose.MinAge == null ? 0 : dose.MinAge;
            this.fg.addControl(
              dose.Name,
              new FormControl(value, Validators.required)
            );
            dose.IsSpecial = false;
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
    console.log(this.doses);
    const user = await this.storage.get(environment.USER);
    const paId = (user && user.UserType === 'PA') ? (Number(user.PAId) || null) : null;
    const doctorId = (user && user.DoctorId) ? Number(user.DoctorId) : null;

    let newschedule = [];
    this.doses.forEach(dose => {
      if (dose.IsSpecial == true) {
        const entry: any = {
          DoseId: dose.Id,
          ChildId: this.ChildId,
          IsDone: false,
          Due2EPI: false,
        };
        if (paId) { entry.PaId = paId; }
        if (doctorId) { entry.DoctorId = doctorId; }
        newschedule.push(entry);
      }
    });
    console.log(newschedule);
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    if (newschedule)
    this.doseService.addScheduleDoseChild(newschedule).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create("successfully Added", "success");
        this.router.navigate([`/members/child/vaccine/${this.ChildId}`]);
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
}
