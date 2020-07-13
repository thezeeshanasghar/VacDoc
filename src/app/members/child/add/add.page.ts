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
import { DoctorService } from "src/app/services/doctor.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { TitleCasePipe } from '@angular/common';
import { AlertController } from '@ionic/angular';

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
  Doctor:any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private vaccineService: VaccineService,
    public childService: ChildService,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
    private clinicService: ClinicService,
    private doctorService: DoctorService,
    private androidPermissions: AndroidPermissions ,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe,
    public alertCtrl: AlertController
  ) {}

 async  ngOnInit() {
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
      PreferredDayOfWeek: 'Any',
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
    
    this.storage.get(environment.CITY).then(val => {
      this.City = val;
    });
  await this.storage.get(environment.DOCTOR).then(doc => {
      this.Doctor = doc;
    });
    // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
    //   result => {
    //     if(!result.hasPermission){
    //       this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
    //     }
    //   }
    // );
    console.log(this.Doctor);
    console.log(this.clinicService.OnlineClinic);
    console.log(this.clinicService.OnlineClinic.Id);
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
    console.log(data);
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    let str = this.fg1.value.PreferredDayOfWeek;
    this.fg1.value.PreferredDayOfWeek = str.toString();
    this.fg1.value.ClinicId = this.clinicService.OnlineClinic.Id;
    await this.childService.addChild(data).subscribe(
      res => {
        if (res.IsSuccess) {
          // loading.dismiss();
          // this.toastService.create("successfully added");
          // this.router.navigate(["/members/child"]);
          var sms1 = "Mr. " + res.ResponseData.FatherName + "\n";
          if (res.ResponseData.Gender == "Boy")
              sms1 += "Your Son " + this.titlecasePipe.transform(res.ResponseData.Name);

          if (res.ResponseData.Gender == "Girl")
              sms1 += "Your Daughter " + this.titlecasePipe.transform(res.ResponseData.Name);

          sms1 += " has been registered with Dr. " + this.titlecasePipe.transform(this.Doctor.FirstName) + " " + this.titlecasePipe.transform(this.Doctor.LastName);
          sms1 += " at " + this.clinicService.OnlineClinic.Name;
          console.log(sms1);

          // sendsms 1
          this.sendsms(res.ResponseData.MobileNumber , sms1);

           var sms2 = "Id: " + res.ResponseData.MobileNumber + "\nPassword: " + res.ResponseData.Password
                 + "\nClinic: " + this.clinicService.OnlineClinic.PhoneNumber + "\nhttps://vaccs.io/";
          // send sms 2
          console.log(sms2);
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
  async setCity(city)
  {
    if(city == 'Other')
    await this.otherCityAlert();
    this.storage.set(environment.CITY, city);
  }
  uncheckany(){
    if(this.fg1.value.PreferredDayOfWeek.length > 1)
    this.fg1.value.PreferredDayOfWeek = this.fg1.value.PreferredDayOfWeek.filter(x=> (x !== 'Any'));
  }
 async otherCityAlert() {
    let alert = await this.alertCtrl.create({
     // title: 'Login',
      inputs: [
        {
          name: 'cityname',
          placeholder: 'Enter City Name',

        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Login',
          handler: data => {
            if (data.cityname) {
            this.City = data.cityname;
            } 
          }
        }
      ]
    });
   await alert.present();
  }
  // removeSelection(){

  // }

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
