import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators
} from "@angular/forms";
import * as moment from "moment";
import { LoadingController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ToastService } from "src/app/shared/toast1.service";
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
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CityService } from "src/app/services/city.service";
import { AgentService } from "src/app/services/agent.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-add",
  templateUrl: "./add.page.html",
  styleUrls: ["./add.page.scss"]
})

export class AddPage implements OnInit {
  isRadioDisabled: boolean = true;
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
  City2: any;
  Agent: any;
  Agent2: any;
  CNIC: any;
  Doctor: any;
  epiDone = false;
  Messages: any = [];
  Nationality: any;
  originalCities: string[];
  filteredOptions: Observable<string[]>;
  travel: [false];
  isCnicRequired: boolean = false;
  originalAgents: any[];
  cities: string[] = [];
  agents: string[] = [];
  isButtonEnabled: boolean;
  isTravel: boolean;
  usertype: any;
  selectedClinicId: any;
  clinicid: Promise<any>;
  type: any;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private vaccineService: VaccineService,
    private cityService: CityService,
    public childService: ChildService,
    public agentService: AgentService,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
    public clinicService: ClinicService,
    private doctorService: DoctorService,
    private androidPermissions: AndroidPermissions,
    private sms: SMS,
    private titlecasePipe: TitleCasePipe,
    public alertCtrl: AlertController,
    private http: HttpClient,
    private paService: PaService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.loadCities();
    this.logDoctorId();
    this.fetchAgent();
    this.loadCities();
    this.doctorId = this.storage.get(environment.DOCTOR_Id);
    this.clinicid = this.storage.get(environment.CLINIC_Id);
    this.storage.get(environment.USER).then((user) => {
      if (user) {
        this.usertype = user;
        console.log('User Type:', this.usertype.UserType);
        this.type=user.UserType;
        if (this.usertype.UserType === 'PA') {
        this.loadClinics();
        }
      } else {
        console.error('No user data found in storage.');
      }
    });
  }

  loadCities(): void {
    this.cityService.getCities().subscribe(
      (cities: any) => {
        this.cities = cities;
        this.originalCities = [...cities];
      },
      (error: any) => {
        console.error('Error loading cities', error);
      }
    );
  }

  fetchAgent() {
    this.childService.getAgent(1).subscribe(
      (agents: any) => {
        this.agents = agents.ResponseData;
        this.originalAgents = [...this.agents];
      },
      (error: any) => {
        console.error('Error fetching agents:', error);
      }
    );
  }

  filterAgents(value: string) {
    if (!value.trim()) {
      this.agents = [...this.originalAgents];
    } else {
      this.agents = this.originalAgents.filter(agent =>
        agent.toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  async loadClinics() {
    const loading = await this.loadingController.create({
      message: 'Loading clinics...',
    });
    await loading.present();

    try {
       if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
              console.log('PA Clinics:', this.clinics);
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      loading.dismiss();
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  ionViewWillEnter() {
    this.storage.set(environment.MESSAGES, this.Messages);
    this.todaydate = new Date();
    this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format("YYYY-MM-DD");
    this.fg1 = this.formBuilder.group({
      ClinicId: [""],
      Name: ['', Validators.compose([
        Validators.required,
        Validators.pattern(/^[^\d]+$/)
      ])],
      Guardian: ["Guardian", Validators.required],
      FatherName: new FormControl("", Validators.compose([
        Validators.required,
        Validators.pattern(/^[^\d]+$/)
      ])),
      Email: new FormControl(""),
      DOB: new FormControl('', Validators.required),
      CountryCode: ["92", Validators.required],
      MobileNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^[0-9]+$")
        ])
      ),
      city: ['', Validators.compose([
        Validators.required
      ])],
      City2: [{ value: '', disabled: true }, Validators.compose([
        Validators.required
      ])],
      Agent2: [{ value: '', disabled: true }, Validators.compose([])],
      Gender: [null, Validators.required],
      Type: [null, Validators.required],
      agent: [''],
      travel: [false],
      CNIC: [''],
      IsEPIDone: [false],
      IsSkip: [true],
      IsVerified: [false],
      Password: [null],
      ChildVaccines: [null],
      Nationality: ['', Validators.compose([
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ])],
    });
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
      this.logDoctorId(); 
    });
    console.log(this.doctorId);
    this.storage.get(environment.ON_CLINIC).then(val => {
      this.clinic = val;
    });
    this.storage.get(environment.CITY).then(val => {
      val == null ? "" : this.fg1.controls['City'].setValue(val);
    });
    this.storage.get(environment.DOCTOR).then(doc => {
      this.Doctor = doc;
    });
    this.storage.get(environment.MESSAGES).then(messages => {
      messages == null ? "" : this.Messages = messages;
    });
    this.cities = this.cities;
  }

  logDoctorId() {
    if (this.doctorId == 1) {
      this.isTravel = true;
    }
  }

  public filter(value: string) {
    if (!value.trim()) {
      this.cities = [...this.originalCities];
    } else {
      this.cities = this.originalCities.filter(option => (
        option.toLowerCase().includes(value.toLowerCase()) || option.includes(value)
      ));
    }
    this.fg1.get('City2').setValue('');
  }

  countryCodes = [
    { name: 'Afghanistan', code: '93' },
    { name: 'Albania', code: '355' },
    { name: 'Algeria', code: '213' },
    { name: 'American Samoa', code: '1-684' },
    { name: 'Andorra', code: '376' },
    { name: 'Angola', code: '244' },
    { name: 'Anguilla', code: '1-264' },
    { name: 'Antarctica', code: '672' },
    { name: 'Antigua and Barbuda', code: '1-268' },
    { name: 'Argentina', code: '54' },
    { name: 'Armenia', code: '374' },
    { name: 'Aruba', code: '297' },
    { name: 'Australia', code: '61' },
    { name: 'Austria', code: '43' },
    { name: 'Azerbaijan', code: '994' },
    { name: 'Bahamas', code: '1-242' },
    { name: 'Bahrain', code: '973' },
    { name: 'Bangladesh', code: '880' },
    { name: 'Barbados', code: '1-246' },
    { name: 'Belarus', code: '375' },
    { name: 'Belgium', code: '32' },
    { name: 'Belize', code: '501' },
    { name: 'Benin', code: '229' },
    { name: 'Bermuda', code: '1-441' },
    { name: 'Bhutan', code: '975' },
    { name: 'Bolivia', code: '591' },
    { name: 'Bosnia and Herzegovina', code: '387' },
    { name: 'Botswana', code: '267' },
    { name: 'Brazil', code: '55' },
    { name: 'British Indian Ocean Territory', code: '246' },
    { name: 'British Virgin Islands', code: '1-284' },
    { name: 'Brunei', code: '673' },
    { name: 'Bulgaria', code: '359' },
    { name: 'Burkina Faso', code: '226' },
    { name: 'Burundi', code: '257' },
    { name: 'Cambodia', code: '855' },
    { name: 'Cameroon', code: '237' },
    { name: 'Canada', code: '1' },
    { name: 'Cape Verde', code: '238' },
    { name: 'Cayman Islands', code: '1-345' },
    { name: 'Central African Republic', code: '236' },
    { name: 'Chad', code: '235' },
    { name: 'Chile', code: '56' },
    { name: 'China', code: '86' },
    { name: 'Christmas Island', code: '61' },
    { name: 'Cocos Islands', code: '61' },
    { name: 'Colombia', code: '57' },
    { name: 'Comoros', code: '269' },
    { name: 'Cook Islands', code: '682' },
    { name: 'Costa Rica', code: '506' },
    { name: 'Croatia', code: '385' },
    { name: 'Cuba', code: '53' },
    { name: 'Curacao', code: '599' },
    { name: 'Cyprus', code: '357' },
    { name: 'Czech Republic', code: '420' },
    { name: 'Democratic Republic of the Congo', code: '243' },
    { name: 'Denmark', code: '45' },
    { name: 'Djibouti', code: '253' },
    { name: 'Dominica', code: '1-767' },
    { name: 'Dominican Republic', code: '1-809' },
    { name: 'East Timor', code: '670' },
    { name: 'Ecuador', code: '593' },
    { name: 'Egypt', code: '20' },
    { name: 'El Salvador', code: '503' },
    { name: 'Equatorial Guinea', code: '240' },
    { name: 'Eritrea', code: '291' },
    { name: 'Estonia', code: '372' },
    { name: 'Ethiopia', code: '251' },
    { name: 'Falkland Islands', code: '500' },
    { name: 'Faroe Islands', code: '298' },
    { name: 'Fiji', code: '679' },
    { name: 'Finland', code: '358' },
    { name: 'France', code: '33' },
    { name: 'French Polynesia', code: '689' },
    { name: 'Gabon', code: '241' },
    { name: 'Gambia', code: '220' },
    { name: 'Georgia', code: '995' },
    { name: 'Germany', code: '49' },
    { name: 'Ghana', code: '233' },
    { name: 'Gibraltar', code: '350' },
    { name: 'Greece', code: '30' },
    { name: 'Greenland', code: '299' },
    { name: 'Grenada', code: '1-473' },
    { name: 'Guam', code: '1-671' },
    { name: 'Guatemala', code: '502' },
    { name: 'Guernsey', code: '44-1481' },
    { name: 'Guinea', code: '224' },
    { name: 'Guinea-Bissau', code: '245' },
    { name: 'Guyana', code: '592' },
    { name: 'Haiti', code: '509' },
    { name: 'Honduras', code: '504' },
    { name: 'Hong Kong', code: '852' },
    { name: 'Hungary', code: '36' },
    { name: 'Iceland', code: '354' },
    { name: 'India', code: '91' },
    { name: 'Indonesia', code: '62' },
    { name: 'Iran', code: '98' },
    { name: 'Iraq', code: '964' },
    { name: 'Ireland', code: '353' },
    { name: 'Isle of Man', code: '44-1624' },
    { name: 'Israel', code: '972' },
    { name: 'Italy', code: '39' },
    { name: 'Ivory Coast', code: '225' },
    { name: 'Jamaica', code: '1-876' },
    { name: 'Japan', code: '81' },
    { name: 'Jersey', code: '44-1534' },
    { name: 'Jordan', code: '962' },
    { name: 'Kazakhstan', code: '7' },
    { name: 'Kenya', code: '254' },
    { name: 'Kiribati', code: '686' },
    { name: 'Kosovo', code: '383' },
    { name: 'Kuwait', code: '965' },
    { name: 'Kyrgyzstan', code: '996' },
    { name: 'Laos', code: '856' },
    { name: 'Latvia', code: '371' },
    { name: 'Lebanon', code: '961' },
    { name: 'Lesotho', code: '266' },
    { name: 'Liberia', code: '231' },
    { name: 'Libya', code: '218' },
    { name: 'Liechtenstein', code: '423' },
    { name: 'Lithuania', code: '370' },
    { name: 'Luxembourg', code: '352' },
    { name: 'Macau', code: '853' },
    { name: 'Macedonia', code: '389' },
    { name: 'Madagascar', code: '261' },
    { name: 'Malawi', code: '265' },
    { name: 'Malaysia', code: '60' },
    { name: 'Maldives', code: '960' },
    { name: 'Mali', code: '223' },
    { name: 'Malta', code: '356' },
    { name: 'Marshall Islands', code: '692' },
    { name: 'Mauritania', code: '222' },
    { name: 'Mauritius', code: '230' },
    { name: 'Mayotte', code: '262' },
    { name: 'Mexico', code: '52' },
    { name: 'Micronesia', code: '691' },
    { name: 'Moldova', code: '373' },
    { name: 'Monaco', code: '377' },
    { name: 'Mongolia', code: '976' },
    { name: 'Montenegro', code: '382' },
    { name: 'Montserrat', code: '1-664' },
    { name: 'Morocco', code: '212' },
    { name: 'Mozambique', code: '258' },
    { name: 'Myanmar', code: '95' },
    { name: 'Namibia', code: '264' },
    { name: 'Nauru', code: '674' },
    { name: 'Nepal', code: '977' },
    { name: 'Netherlands', code: '31' },
    { name: 'Netherlands Antilles', code: '599' },
    { name: 'New Caledonia', code: '687' },
    { name: 'New Zealand', code: '64' },
    { name: 'Nicaragua', code: '505' },
    { name: 'Niger', code: '227' },
    { name: 'Nigeria', code: '234' },
    { name: 'Niue', code: '683' },
    { name: 'North Korea', code: '850' },
    { name: 'Northern Mariana Islands', code: '1-670' },
    { name: 'Norway', code: '47' },
    { name: 'Oman', code: '968' },
    { name: 'Pakistan', code: '92' },
    { name: 'Palau', code: '680' },
    { name: 'Palestine', code: '970' },
    { name: 'Panama', code: '507' },
    { name: 'Papua New Guinea', code: '675' },
    { name: 'Paraguay', code: '595' },
    { name: 'Peru', code: '51' },
    { name: 'Philippines', code: '63' },
    { name: 'Pitcairn', code: '870' },
    { name: 'Poland', code: '48' },
    { name: 'Portugal', code: '351' },
    { name: 'Puerto Rico', code: '1-787' },
    { name: 'Qatar', code: '974' },
    { name: 'Republic of the Congo', code: '242' },
    { name: 'Reunion', code: '262' },
    { name: 'Romania', code: '40' },
    { name: 'Russia', code: '7' },
    { name: 'Rwanda', code: '250' },
    { name: 'Saint Barthelemy', code: '590' },
    { name: 'Saint Helena', code: '290' },
    { name: 'Saint Kitts and Nevis', code: '1-869' },
    { name: 'Saint Lucia', code: '1-758' },
    { name: 'Saint Martin', code: '590' },
    { name: 'Saint Pierre and Miquelon', code: '508' },
    { name: 'Saint Vincent and the Grenadines', code: '1-784' },
    { name: 'Samoa', code: '685' },
    { name: 'San Marino', code: '378' },
    { name: 'Sao Tome and Principe', code: '239' },
    { name: 'Saudi Arabia', code: '966' },
    { name: 'Senegal', code: '221' },
    { name: 'Serbia', code: '381' },
    { name: 'Seychelles', code: '248' },
    { name: 'Sierra Leone', code: '232' },
    { name: 'Singapore', code: '65' },
    { name: 'Sint Maarten', code: '1-721' },
    { name: 'Slovakia', code: '421' },
    { name: 'Slovenia', code: '386' },
    { name: 'Solomon Islands', code: '677' },
    { name: 'Somalia', code: '252' },
    { name: 'South Africa', code: '27' },
    { name: 'South Korea', code: '82' },
    { name: 'South Sudan', code: '211' },
    { name: 'Spain', code: '34' },
    { name: 'Sri Lanka', code: '94' },
    { name: 'Sudan', code: '249' },
    { name: 'Suriname', code: '597' },
    { name: 'Svalbard and Jan Mayen', code: '47' },
    { name: 'Swaziland', code: '268' },
    { name: 'Sweden', code: '46' },
    { name: 'Switzerland', code: '41' },
    { name: 'Syria', code: '963' },
    { name: 'Taiwan', code: '886' },
    { name: 'Tajikistan', code: '992' },
    { name: 'Tanzania', code: '255' },
    { name: 'Thailand', code: '66' },
    { name: 'Togo', code: '228' },
    { name: 'Tokelau', code: '690' },
    { name: 'Tonga', code: '676' },
    { name: 'Trinidad and Tobago', code: '1-868' },
    { name: 'Tunisia', code: '216' },
    { name: 'Turkey', code: '90' },
    { name: 'Turkmenistan', code: '993' },
    { name: 'Turks and Caicos Islands', code: '1-649' },
    { name: 'Tuvalu', code: '688' },
    { name: 'U.S. Virgin Islands', code: '1-340' },
    { name: 'Uganda', code: '256' },
    { name: 'Ukraine', code: '380' },
    { name: 'United Arab Emirates', code: '971' },
    { name: 'United Kingdom', code: '44' },
    { name: 'United States', code: '1' },
    { name: 'Uruguay', code: '598' },
    { name: 'Uzbekistan', code: '998' },
    { name: 'Vanuatu', code: '678' },
    { name: 'Vatican', code: '379' },
    { name: 'Venezuela', code: '58' },
    { name: 'Vietnam', code: '84' },
    { name: 'Wallis and Futuna', code: '681' },
    { name: 'Western Sahara', code: '212' },
    { name: 'Yemen', code: '967' },
    { name: 'Zambia', code: '260' },
    { name: 'Zimbabwe', code: '263' },
  ];

  sendMessage(sms1: string): void {
    const url = 'https://graph.facebook.com/v19.0/331514553372468/messages';
    const accessToken = 'EAANxUIaDgugBO5XJ4tQLZBHcRQgF7l9znlMHTl1QXgjx4WXmMjF1J7hqAnFdQxUOOgsc7YMhj7FvBRWG60QdMNitVTeaZAI49YidLNZB2dtfKRDyBYOY28hQUYkvxg2hvqCrOvupbAGPfcC3ZBDSejZAv8ZBxts3qTjsh1tN8TCiqEwKYqGuaMPKA4wPkCzUzteXjbCSCOvgP5gdN2rC8ZD';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    const data = {
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": "whatsapp:+923259944582",
      "type": "text",
      "text": {
        "body": sms1
      }
    };
    this.http.post(url, data, { headers })
      .subscribe(
        (response) => {
          console.log('Message sent successfully:', response);
        },
        (error) => {
          console.error('Error sending message:', error);
        }
      );
  }

  async moveNextStep() {
    console.log('Form Group Value:', this.fg1.value);
    this.fg1.value.DOB = await moment(this.fg1.value.DOB, "YYYY-MM-DD").format("DD-MM-YYYY");
    await this.PasswordGenerator();
    await this.addNewChild(this.fg1.value);
  }

  updateGender(g: any) {
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

  async addNewChild(data: { agent: string; city: string; }) {
    console.log('City2 value:', this.fg1.get('City2').value);
    console.log('City2 value:', this.fg1.value.Agent2);
    if (data.agent == "") {
      data.agent = this.fg1.get('Agent2').value;
      console.log('city2 data', data.agent)
    }
    if (data.city == "") {
      data.city = this.fg1.get('City2').value;
      console.log('city2 data')
    }
    console.log(data);
    const loading = await this.loadingController.create({
      message: "loading"
    });
    await loading.present();
    if (this.usertype.UserType === 'DOCTOR') {
      this.fg1.value.IsPAApprove = true;
    } else {
      this.fg1.value.IsPAApprove = false;
    }
    if (this.usertype.UserType === 'DOCTOR') {
       this.fg1.value.ClinicId = this.clinic.Id;
    } else {
      this.fg1.value.ClinicId;
    }
    // this.fg1.value.ClinicId = this.clinic.Id;
    console.log("data", data);
    await this.childService.addChild(data).subscribe(
      async res => {
        this.setCity(this.fg1.value.City);
        if (res.IsSuccess) {
          console.log("res", res.ResponseData)
          var sms1 = "";
          if (res.ResponseData.Gender == "Boy")
            sms1 += ("Mr. " + this.titlecasePipe.transform(res.ResponseData.Name));
          if (res.ResponseData.Gender == "Girl")
            sms1 += ("Miss. " + this.titlecasePipe.transform(res.ResponseData.Name));
          sms1 += " has been registered Successfully at ";
          if (res.ResponseData.DoctorId === 1) {
            sms1 += "Vaccine.pk";
          } else {
            sms1 += "https://vaccinationcentre.com/";
          }
          sms1 += "\nId: +" + res.ResponseData.CountryCode + res.ResponseData.MobileNumber + " \nPassword: " + res.ResponseData.Password;
          sms1 += "\nClinic Phone Number: " + this.clinic.PhoneNumber;
          sms1 += "\nWeb Link:  https://client.vaccinationcentre.com/";
          console.log(sms1);
          const ChildId = res.ResponseData.Id
          console.log('child id', ChildId)
          loading.dismiss();
          const whatsappNumber = "+" + res.ResponseData.CountryCode + res.ResponseData.MobileNumber;
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(sms1)}`;
          const alert = await this.alertCtrl.create({
            header: 'Send WhatsApp Message',
            message: 'Would you like to open WhatsApp to send the registration details?',
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel'
              },
              {
                text: 'Open WhatsApp',
                handler: () => {
                  window.open(whatsappUrl, '_system');
                }
              }
            ]
          });
          await alert.present();
          this.toastService.create('Child added successfully.');
          if (res.ResponseData.Type == "special") {
            this.router.navigate([`/members/child/vaccine/${ChildId}`]);
          } else {
            this.router.navigate(["/members/child"]);
          }
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

  sendsms(number: string, message: string) {
    console.log(number + message);
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
      result => {
        if (result.hasPermission) {
          this.sms.send('+92' + number, message)
            .then(() => {
              let obj = { 'toNumber': '+92' + number, 'message': message, 'created': Date.now(), 'status': true };
              this.toastService.create("Message Sent Successful");
              this.Messages.push(obj);
              this.storage.set(environment.MESSAGES, this.Messages);
            }).catch((error) => {
              let obj = { 'toNumber': '+92' + number, 'message': message, 'created': Date.now(), 'status': false };
              this.Messages.push(obj);
              this.storage.set(environment.MESSAGES, this.Messages);
              this.toastService.create("Message Sent Failed", "danger");
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

  async setCity(city: any) {
    this.storage.set(environment.CITY, city);
  }

  async checkEpi() {
    let days = await this.calculateDiff(this.fg1.value.DOB);
    console.log(days);
    this.epiDone = days > 272;
    this.isRadioDisabled = !this.epiDone;
    if (this.isRadioDisabled) {
      this.fg1.get('IsEPIDone').setValue(false);
    }
    this.cd.detectChanges();
  }

  onTravelChange(event: any) {
    const selectedValue = event.detail.value;
    console.log('Selected Type:', selectedValue);
    this.fg1.get('CNIC').clearValidators();
    this.fg1.get('agent').clearValidators();
    this.fg1.get('Agent2').clearValidators();
    if (selectedValue === 'travel') {
      this.isCnicRequired = true;
      this.fg1.get('CNIC').setValidators([Validators.required]);
      this.fg1.get('agent').setValidators([Validators.required]);
      this.fg1.get('Nationality').setValidators([Validators.required]);
      this.isButtonEnabled = true;
      this.fg1.get('agent').enable();
      this.onAgentChange();
    } else {
      this.isCnicRequired = false;
      this.isButtonEnabled = true;
      this.fg1.get('agent').disable();
      this.fg1.get('Agent2').disable();
      this.fg1.get('agent').setValue('');
      this.fg1.get('Agent2').setValue('');
    }
    this.fg1.get('CNIC').updateValueAndValidity();
    this.fg1.get('agent').updateValueAndValidity();
    this.fg1.get('Agent2').updateValueAndValidity();
    this.fg1.get('Nationality').updateValueAndValidity();
    this.isRadioDisabled = this.isCnicRequired && !this.epiDone;
    this.checkEpi();
  }

  onCityChange() {
    const cityValue = this.fg1.get('city').value;
    const city2Value = this.fg1.get('City2').value;
    console.log('City:', cityValue);
    console.log('City2:', city2Value);
    if (cityValue) {
      this.fg1.get('City2').clearValidators();
      this.fg1.get('City2').updateValueAndValidity();
      this.fg1.get('city').setValidators([Validators.required]);
    }
    else if (city2Value) {
      this.fg1.get('city').clearValidators();
      this.fg1.get('city').updateValueAndValidity();
      this.fg1.get('City2').setValidators([Validators.required]);
    }
    else {
      this.fg1.get('city').setValidators([Validators.required]);
      this.fg1.get('City2').setValidators([Validators.required]);
    }
    this.fg1.get('city').updateValueAndValidity();
    this.fg1.get('City2').updateValueAndValidity();
  }

  onAgentChange() {
    const agentValue = this.fg1.get('agent').value;
    const agent2Value = this.fg1.get('Agent2').value;
    console.log('Agent:', agentValue);
    console.log('Agent2:', agent2Value);
    if (agentValue) {
      this.fg1.get('Agent2').clearValidators();
      this.fg1.get('Agent2').updateValueAndValidity();
      this.fg1.get('agent').setValidators([Validators.required]);
    }
    else if (agent2Value) {
      this.fg1.get('agent').clearValidators();
      this.fg1.get('agent').updateValueAndValidity();
      this.fg1.get('Agent2').setValidators([Validators.required]);
    }
    else {
      this.fg1.get('agent').setValidators([Validators.required]);
      this.fg1.get('Agent2').setValidators([Validators.required]);
    }
    this.fg1.get('agent').updateValueAndValidity();
    this.fg1.get('Agent2').updateValueAndValidity
  }

  calculateDiff(dateSent: string | number | Date) {
    let currentDate = new Date();
    dateSent = new Date(dateSent);
    return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
  }

  async otherCityAlert() {
    let alert = await this.alertCtrl.create({
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
              this.cityService.cities.push(data.cityname);
              this.City = data.cityname;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  validation_messages = {
    name: [{ type: "required", message: "Name is required." },
    { type: 'pattern', message: 'Please enter only characters in the first name.' }],
    City2: [
      { type: 'pattern', message: 'Please enter only characters in the city.' }],
    fatherName: [{ type: "required", message: "Guardian name is required." },
    { type: 'pattern', message: 'Only letters, spaces, commas, and hyphens are allowed in Guardian.' }],
    DOB: [{ type: "required", message: "Date of Birth is required." }],
    mobileNumber: [
      {
        type: "required",
        message: "Mobile number is required"
      },
    ],
    gender: [{ type: "required", message: "Gender is required." }],
    Agent2: [
      { type: "required", message: "Agent is required." }
    ],
    email: [
      { type: "pattern", message: "Please enter a valid email address" },
      { type: "email", message: "Please enter a valid email address" }
    ],
    nationality: [
      { type: "required", message: "Nationality is required." },
      { type: "pattern", message: "Please enter a valid nationality (letters and spaces only)." }
    ],
  };
}