import { Component, OnInit, ViewChild, ɵConsole } from "@angular/core";
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
import { env } from 'process';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

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
  clinic: any;
  clinics: any;
  todaydate: any;
  gender: any;
  City: any;
  CNIC: any;
  Doctor: any;
  epiDone = false;
  Messages:any = [];
  cities: string[];
  filteredOptions: Observable<string[]>;
  //cities: any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private vaccineService: VaccineService,
    public childService: ChildService,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
    public clinicService: ClinicService,
    private doctorService: DoctorService,
    private androidPermissions: AndroidPermissions,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe,
    public alertCtrl: AlertController
  ) { }

  ngOnInit() {}
  ionViewWillEnter()//ngAfterContentInit() 
  {
    // let obj = {'toNumber':'+923143041544' , 'message': 'this is test message' , 'created': Date.now(), 'status':false};
    // this.Messages.push(obj); this.Messages.push(obj); this.Messages.push(obj);
    this.storage.set(environment.MESSAGES , this.Messages);
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format("YYYY-MM-DD");
    // this.getVaccine();
    this.fg1 = this.formBuilder.group({
      ClinicId: [""],
      Name: new FormControl("", Validators.required),
      Guardian: new FormControl("", Validators.required),
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
      DOB: new FormControl('', Validators.required),
      CountryCode: ["92"],
      MobileNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("[0-9]{10}$")
        ])
      ),
      PreferredDayOfWeek: 'Any',
      Gender: [null,Validators.required],
      Type: [null,Validators.required],
      City: [null],
      CNIC:[null],
      PreferredDayOfReminder: 0,
      PreferredSchedule: [null],
      IsEPIDone: [false],
      IsSkip: [true],
      IsVerified: [false],
      Password: [null],
      ChildVaccines: [null]
    });

    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });

    this.storage.get(environment.ON_CLINIC).then(val => {
      this.clinic = val;
    });

    this.storage.get(environment.CITY).then(val => {
      val == null? "": this.fg1.controls['City'].setValue(val);
    });

     this.storage.get(environment.DOCTOR).then(doc => {
      this.Doctor = doc;
    });
    
     this.storage.get(environment.MESSAGES).then(messages => {messages==null?"": this.Messages = messages;
    });

    this.cities = this.childService.cities;
   
  }

  public filter(value: string) {
    this.cities =  this.childService.cities.filter(option => (option.toLowerCase().includes(value) || option.includes(value)));
  }


  async moveNextStep() {
    this.fg1.value.DOB = await moment(this.fg1.value.DOB, "YYYY-MM-DD").format("DD-MM-YYYY");
    // this.formcontroll = true;
    //this.fg1.value.Gender = this.gender;
    await this.PasswordGenerator();
    //console.log(this.fg1.value);
    await this.addNewChild(this.fg1.value);
  }
  updateGender(g) {
    this.fg1.controls['Gender'].setValue(g);
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



  async addNewChild(data) {
  //  console.log(data);
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    let str = this.fg1.value.PreferredDayOfWeek;
    this.fg1.value.PreferredDayOfWeek = str.toString();
    this.fg1.value.ClinicId = this.clinic.Id;
    await this.childService.addChild(data).subscribe(
      async res => {
        this.setCity(this.fg1.value.City);
        if (res.IsSuccess) {
          var sms1 = "";
          if (res.ResponseData.Gender == "Boy")
            sms1 += ("Mr. " + this.titlecasePipe.transform(res.ResponseData.Name));

          if (res.ResponseData.Gender == "Girl")
            sms1 += ("Miss. " + this.titlecasePipe.transform(res.ResponseData.Name));

          sms1 += " has been registered Succesfully at Vaccine.pk";
          sms1 += "\nId: " + res.ResponseData.MobileNumber + " \nPassword: " + res.ResponseData.Password;
          sms1 += "\nClinic Phone Number: " + this.clinic.PhoneNumber;
          sms1 += "\nWeb Link:  https://vaccine.pk/";
          console.log(sms1);
          const ChildId=res.ResponseData.Id
          if (data.Type === 'regular') {
            try {
              const apiUrl = `${environment.BASE_URL}/Schedule/regular?DoctorId=${this.doctorId}&ChildId=${ChildId}`; // Replace this with your API endpoint
              console.log(apiUrl)
          
              const response = await fetch(apiUrl, {
                method: 'POST', // Specify your HTTP method (POST, GET, etc.)
                headers: {
                  'Content-Type': 'application/json', // Set your request content type if needed
                  // Add any other headers if required
                },
               
              });
          
              if (response.ok) {
                const responseData = await response.json(); // Parse JSON response if needed
                console.log('API Response:', responseData);
                // Handle API response as needed
              } else {
                console.error('API Error:', response.statusText);
                // Handle API error if needed
              }
            } catch (error) {
              console.error('Error calling API:', error);
              // Handle error if API call fails
            }
           
          }
          loading.dismiss();
          this.toastService.create("successfully added");
          const loading1 = await this.loadingController.create({
            message: "sending Message"
          });
          await loading1.present();
          // sendsms 1
          await this.sendsms(res.ResponseData.MobileNumber, sms1);
          loading1.dismiss();
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

  sendsms(number, message) {
    console.log(number + message);
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
      result => {
        // console.log('Has permission?',result.hasPermission);
        if (result.hasPermission) {
          this.sms.send('+92' + number, message)
            .then(() => {
              let obj = {'toNumber':'+92' + number , 'message': message , 'created': Date.now(), 'status':true};
              this.toastService.create("Message Sent Successful");
              this.Messages.push(obj);
              this.storage.set(environment.MESSAGES , this.Messages);
            }).catch((error) => {
              let obj = {'toNumber':'+92' + number , 'message': message , 'created': Date.now(), 'status':false};
              this.Messages.push(obj);
              this.storage.set(environment.MESSAGES , this.Messages);
              this.toastService.create("Message Sent Failed" , "danger");
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

  async setCity(city) {
    // if (city == 'Other')
    //   await this.otherCityAlert();
    // this.childService.othercity = true;
    this.storage.set(environment.CITY, city);
  }

  uncheckany() {
    if (this.fg1.value.PreferredDayOfWeek.length > 1)
      this.fg1.value.PreferredDayOfWeek = this.fg1.value.PreferredDayOfWeek.filter(x => (x !== 'Any'));
  }
  
  async checkEpi() {
    let days = await this.calculateDiff(this.fg1.value.DOB);
    console.log(days);
    if (days > 272)
      this.epiDone = true;
    else
      this.epiDone = false;
  }

  calculateDiff(dateSent) {
    let currentDate = new Date();
    dateSent = new Date(dateSent);
    return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
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
          text: 'ok',
          handler: data => {
            if (data.cityname) {
              this.childService.cities.push(data.cityname);
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
    fatherName: [{ type: "required", message: "Guardian name is required." }],
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
  //cities = ['Islamabad', 'Rawalpindi', 'Multan', 'Other']
}

///
