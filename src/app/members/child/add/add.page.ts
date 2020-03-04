import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  FormArray,
  Validators
} from "@angular/forms";
import * as moment from "moment";
import { LoadingController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ToastService } from "src/app/shared/toast.service";
import { ChildService } from "src/app/services/child.service";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ClinicService } from "src/app/services/clinic.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: "app-add",
  templateUrl: "./add.page.html",
  styleUrls: ["./add.page.scss"]
})
export class AddPage implements OnInit {
  fg1: FormGroup;
  fg2: FormGroup;
  formcontroll: boolean = false;
  vaccines: any;
  doctorId: any;
  clinicId: any;
  clinics: any;
  todaydate: any;
  gender: any;
  City: any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private vaccineService: VaccineService,
    public childService: ChildService,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
    private clinicService: ClinicService,
    private androidPermissions: AndroidPermissions ,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe
  ) {}

  ngOnInit() {
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format("YYYY-MM-DD");
    this.getVaccine();

    this.fg1 = this.formBuilder.group({
      ClinicId: [""],
      Name: new FormControl("", Validators.required),
      FatherName: new FormControl("", Validators.required),
      Email: new FormControl(
        "",
        Validators.compose([
         // Validators.required,
          Validators.pattern(
            "^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$"
          )
        ])
      ),
      DOB: new FormControl(this.todaydate, Validators.required),
      CountryCode: ["92"],
      MobileNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("[0-9]{10}$")
        ])
      ),
      PreferredDayOfWeek: [null],
      Gender: [null],
      City: [null],
      PreferredDayOfReminder: 0,
      PreferredSchedule: [null],
      IsEPIDone: [false],
      IsVerified: [false],
      Password: [null],
      ChildVaccines: [null]
    });

    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.getClinics();

    this.storage.get(environment.CLINIC_Id).then(val => {
      this.clinicId = val;
    });
    
    this.storage.get(environment.CITY).then(val => {
      this.City = val;
    });
    // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
    //   result => {
    //     if(!result.hasPermission){
    //       this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
    //     }
    //   }
    // );
  }

  moveNextStep() {
    this.fg1.value.DOB = moment(this.fg1.value.DOB, "YYYY-MM-DD").format(
      "DD-MM-YYYY"
    );
    this.formcontroll = true;
    this.fg1.value.Gender = this.gender;
    this.PasswordGenerator();
  }
  updateGender(g) {
    this.gender = g;
  }

  getChildVaccinefromUser() {
    this.fg2.value.ChildVaccines = this.fg2.value.ChildVaccines.map((v, i) =>
      v ? this.vaccines[i].Id : null
    ).filter(v => v !== null);

    this.fg2.value.ChildVaccines = this.fg2.value.ChildVaccines;
    let vaccine = this.fg1.value;
    vaccine.ChildVaccines = [];
    for (let i = 0; i < this.fg2.value.ChildVaccines.length; i++) {
      vaccine.ChildVaccines.push({ Id: this.fg2.value.ChildVaccines[i] });
    }
    this.addNewChild(vaccine);
  }

  async getClinics() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();

    await this.clinicService.getClinics(this.doctorId).subscribe(
      res => {
        this.clinics = res.ResponseData;
        loading.dismiss();
        if (res.IsSuccess) {
          for (let i = 0; i < this.clinics.length; i++) {
            if (this.clinics[i].IsOnline == true) {
              this.storage.set(environment.CLINIC_Id, this.clinics[i].Id);
            }
          }
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

  PasswordGenerator() {
    var length = 4,
      charset = "0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    this.fg1.value.Password = retVal;
  }

  async getVaccine() {
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    await this.vaccineService.getVaccine().subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccines = res.ResponseData;
          this.PasswordGenerator();

          const controls = this.vaccines.map(c => new FormControl(true));
          this.fg2 = this.formBuilder.group({
            ChildVaccines: new FormArray(controls)
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

  async addNewChild(data) {
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    let str = this.fg1.value.PreferredDayOfWeek;
    this.fg1.value.PreferredDayOfWeek = str.toString();
    this.fg1.value.ClinicId = this.clinicId;
    await this.childService.addChild(data).subscribe(
      res => {
        if (res.IsSuccess) {
          var sms1 = "Mr. " + res.ResponseData.FatherName + "\n";
          if (res.ResponseData.Gender == "Boy")
              sms1 += "Your Son " + this.titlecasePipe.transform(res.ResponseData.Name);

          if (res.ResponseData.Gender == "Girl")
              sms1 += "Your Daughter " + this.titlecasePipe.transform(res.ResponseData.Name);

        //  sms1 += " has been registered with Dr. " + this.titlecasePipe.transform(res.ResponseData.Clinic.Doctor.FirstName) + " " + this.titlecasePipe.transform(res.ResponseData.Clinic.Doctor.LastName);
        //  sms1 += " at " + res.ResponseData.Clinic.Name.Replace("&", "and") + "\n";

          // sendsms 1
          this.sendsms(res.ResponseData.MobileNumber , sms1);

           var sms2 = "Id: " + res.ResponseData.MobileNumber + "\nPassword: " + res.ResponseData.Password;
          //       + "\nClinic: " + res.ResponseData.Clinic.PhoneNumber + "\nhttps://vaccs.io/";
          // send sms 2
          this.sendsms(res.ResponseData.MobileNumber , sms2);
         
          loading.dismiss();
          this.toastService.create("successfully added");
          this.router.navigate(["/members/child"]);
        } else {
          loading.dismiss();
          this.formcontroll = false;
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.formcontroll = false;
        this.toastService.create(err, "danger");
      }
    );
  }
  sendsms(number , message)
  {
    console.log(number + message);
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
      result => {
        console.log('Has permission?',result.hasPermission);
        if(result.hasPermission){
          this.sms.send('+92' + number, message)
          .then(()=>{
          console.log("The Message is sent");
          }).catch((error)=>{
          console.log("The Message is Failed",error);
          });
        }
        else {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
        this.sms.send('+92' + number, message);
        }
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
    );
    console.log('success');
  }
  setCity(city)
  {
    this.storage.set(environment.CITY, city);
  }

  validation_messages = {
    name: [{ type: "required", message: "Name is required." }],
    fatherName: [{ type: "required", message: "Father name is required." }],
    // email: [
    //   { type: "required", message: "Email is required." },
    //   { type: "pattern", message: "Please enter a valid email." }
    // ],
    DOB: [{ type: "required", message: "Date of Birth is required." }],
    mobileNumber: [
      {
        type: "required",
        message: "Mobile number is required like 3331231231"
      },
      { type: "pattern", message: "Mobile number is required like 3331231231" }
    ],
    gender: [{ type: "required", message: "Gender is required." }]
  };
}
