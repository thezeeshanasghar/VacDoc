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
  styleUrls: ["./add.page.scss"],
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

  async ngOnInit() {
    this.loadCities();
    this.logDoctorId();
    this.fetchAgent();
    this.loadCities();
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.clinicid = await this.storage.get(environment.CLINIC_Id);
    this.usertype = await this.storage.get(environment.USER);
    if (this.usertype) {
      console.log('User Type:', this.usertype.UserType);
      this.type = this.usertype.UserType;
      // Load clinics for both DOCTOR and PA users
      await this.loadClinics();
    } else {
      console.error('No user data found in storage.');
    }
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
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              // Check if there's already an online clinic from storage or API response
              let onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              
              // If no online clinic found in API response, check storage
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(storedOnlineClinic => {
                  if (storedOnlineClinic) {
                    onlineClinic = this.clinics.find(clinic => clinic.Id === storedOnlineClinic.Id);
                    if (onlineClinic) {
                      this.selectedClinicId = onlineClinic.Id;
                      this.clinicService.updateClinic(onlineClinic);
                      console.log('Found online clinic from storage:', onlineClinic.Name);
                    }
                  }
                });
              }
              
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
                console.log('Found online clinic from API:', onlineClinic.Name);
              } else {
                this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('Clinics:', this.clinics);
              console.log('Selected Clinic ID:', this.selectedClinicId);
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              // Check if there's already an online clinic, if not set the first one
              const onlineClinic = this.clinics.find(clinic => clinic.IsOnline);
              if (onlineClinic) {
                this.selectedClinicId = onlineClinic.Id;
                this.clinicService.updateClinic(onlineClinic);
              } else {
                this.selectedClinicId = this.clinics.length > 0 ? this.clinics[0].Id : null;
                if (this.selectedClinicId) {
                  this.setOnlineClinic(this.selectedClinicId);
                }
              }
              console.log('PA Clinics:', this.clinics);
              console.log('Selected PA Clinic ID:', this.selectedClinicId);
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
  { name: 'Afghanistan', code: '93', flag: 'af' },
  { name: 'Albania', code: '355', flag: 'al' },
  { name: 'Algeria', code: '213', flag: 'dz' },
  { name: 'American Samoa', code: '1-684', flag: 'as' },
  { name: 'Andorra', code: '376', flag: 'ad' },
  { name: 'Angola', code: '244', flag: 'ao' },
  { name: 'Anguilla', code: '1-264', flag: 'ai' },
  { name: 'Antarctica', code: '672', flag: 'aq' },
  { name: 'Antigua and Barbuda', code: '1-268', flag: 'ag' },
  { name: 'Argentina', code: '54', flag: 'ar' },
  { name: 'Armenia', code: '374', flag: 'am' },
  { name: 'Aruba', code: '297', flag: 'aw' },
  { name: 'Australia', code: '61', flag: 'au' },
  { name: 'Austria', code: '43', flag: 'at' },
  { name: 'Azerbaijan', code: '994', flag: 'az' },
  { name: 'Bahamas', code: '1-242', flag: 'bs' },
  { name: 'Bahrain', code: '973', flag: 'bh' },
  { name: 'Bangladesh', code: '880', flag: 'bd' },
  { name: 'Barbados', code: '1-246', flag: 'bb' },
  { name: 'Belarus', code: '375', flag: 'by' },
  { name: 'Belgium', code: '32', flag: 'be' },
  { name: 'Belize', code: '501', flag: 'bz' },
  { name: 'Benin', code: '229', flag: 'bj' },
  { name: 'Bermuda', code: '1-441', flag: 'bm' },
  { name: 'Bhutan', code: '975', flag: 'bt' },
  { name: 'Bolivia', code: '591', flag: 'bo' },
  { name: 'Bosnia and Herzegovina', code: '387', flag: 'ba' },
  { name: 'Botswana', code: '267', flag: 'bw' },
  { name: 'Brazil', code: '55', flag: 'br' },
  { name: 'British Indian Ocean Territory', code: '246', flag: 'io' },
  { name: 'British Virgin Islands', code: '1-284', flag: 'vg' },
  { name: 'Brunei', code: '673', flag: 'bn' },
  { name: 'Bulgaria', code: '359', flag: 'bg' },
  { name: 'Burkina Faso', code: '226', flag: 'bf' },
  { name: 'Burundi', code: '257', flag: 'bi' },
  { name: 'Cambodia', code: '855', flag: 'kh' },
  { name: 'Cameroon', code: '237', flag: 'cm' },
  { name: 'Canada', code: '1', flag: 'ca' },
  { name: 'Cape Verde', code: '238', flag: 'cv' },
  { name: 'Cayman Islands', code: '1-345', flag: 'ky' },
  { name: 'Central African Republic', code: '236', flag: 'cf' },
  { name: 'Chad', code: '235', flag: 'td' },
  { name: 'Chile', code: '56', flag: 'cl' },
  { name: 'China', code: '86', flag: 'cn' },
  { name: 'Christmas Island', code: '61', flag: 'cx' },
  { name: 'Cocos Islands', code: '61', flag: 'cc' },
  { name: 'Colombia', code: '57', flag: 'co' },
  { name: 'Comoros', code: '269', flag: 'km' },
  { name: 'Cook Islands', code: '682', flag: 'ck' },
  { name: 'Costa Rica', code: '506', flag: 'cr' },
  { name: 'Croatia', code: '385', flag: 'hr' },
  { name: 'Cuba', code: '53', flag: 'cu' },
  { name: 'Curacao', code: '599', flag: 'cw' },
  { name: 'Cyprus', code: '357', flag: 'cy' },
  { name: 'Czech Republic', code: '420', flag: 'cz' },
  { name: 'Democratic Republic of the Congo', code: '243', flag: 'cd' },
  { name: 'Denmark', code: '45', flag: 'dk' },
  { name: 'Djibouti', code: '253', flag: 'dj' },
  { name: 'Dominica', code: '1-767', flag: 'dm' },
  { name: 'Dominican Republic', code: '1-809', flag: 'do' },
  { name: 'East Timor', code: '670', flag: 'tl' },
  { name: 'Ecuador', code: '593', flag: 'ec' },
  { name: 'Egypt', code: '20', flag: 'eg' },
  { name: 'El Salvador', code: '503', flag: 'sv' },
  { name: 'Equatorial Guinea', code: '240', flag: 'gq' },
  { name: 'Eritrea', code: '291', flag: 'er' },
  { name: 'Estonia', code: '372', flag: 'ee' },
  { name: 'Ethiopia', code: '251', flag: 'et' },
  { name: 'Falkland Islands', code: '500', flag: 'fk' },
  { name: 'Faroe Islands', code: '298', flag: 'fo' },
  { name: 'Fiji', code: '679', flag: 'fj' },
  { name: 'Finland', code: '358', flag: 'fi' },
  { name: 'France', code: '33', flag: 'fr' },
  { name: 'French Polynesia', code: '689', flag: 'pf' },
  { name: 'Gabon', code: '241', flag: 'ga' },
  { name: 'Gambia', code: '220', flag: 'gm' },
  { name: 'Georgia', code: '995', flag: 'ge' },
  { name: 'Germany', code: '49', flag: 'de' },
  { name: 'Ghana', code: '233', flag: 'gh' },
  { name: 'Gibraltar', code: '350', flag: 'gi' },
  { name: 'Greece', code: '30', flag: 'gr' },
  { name: 'Greenland', code: '299', flag: 'gl' },
  { name: 'Grenada', code: '1-473', flag: 'gd' },
  { name: 'Guam', code: '1-671', flag: 'gu' },
  { name: 'Guatemala', code: '502', flag: 'gt' },
  { name: 'Guernsey', code: '44-1481', flag: 'gg' },
  { name: 'Guinea', code: '224', flag: 'gn' },
  { name: 'Guinea-Bissau', code: '245', flag: 'gw' },
  { name: 'Guyana', code: '592', flag: 'gy' },
  { name: 'Haiti', code: '509', flag: 'ht' },
  { name: 'Honduras', code: '504', flag: 'hn' },
  { name: 'Hong Kong', code: '852', flag: 'hk' },
  { name: 'Hungary', code: '36', flag: 'hu' },
  { name: 'Iceland', code: '354', flag: 'is' },
  { name: 'India', code: '91', flag: 'in' },
  { name: 'Indonesia', code: '62', flag: 'id' },
  { name: 'Iran', code: '98', flag: 'ir' },
  { name: 'Iraq', code: '964', flag: 'iq' },
  { name: 'Ireland', code: '353', flag: 'ie' },
  { name: 'Isle of Man', code: '44-1624', flag: 'im' },
  { name: 'Israel', code: '972', flag: 'il' },
  { name: 'Italy', code: '39', flag: 'it' },
  { name: 'Ivory Coast', code: '225', flag: 'ci' },
  { name: 'Jamaica', code: '1-876', flag: 'jm' },
  { name: 'Japan', code: '81', flag: 'jp' },
  { name: 'Jersey', code: '44-1534', flag: 'je' },
  { name: 'Jordan', code: '962', flag: 'jo' },
  { name: 'Kazakhstan', code: '7', flag: 'kz' },
  { name: 'Kenya', code: '254', flag: 'ke' },
  { name: 'Kiribati', code: '686', flag: 'ki' },
  { name: 'Kosovo', code: '383', flag: 'xk' },
  { name: 'Kuwait', code: '965', flag: 'kw' },
  { name: 'Kyrgyzstan', code: '996', flag: 'kg' },
  { name: 'Kazakhstan', code: '7', flag: 'kz' },
  { name: 'kenya', code: '254', flag: 'ke' },
{ name: 'kiribati', code: '686', flag: 'ki' },
{ name: 'kosovo', code: '383', flag: 'xk' },
{ name: 'kuwait', code: '965', flag: 'kw' },
{ name: 'kyrgyzstan', code: '996', flag: 'kg' },
{ name: 'laos', code: '856', flag: 'la' },
{ name: 'latvia', code: '371', flag: 'lv' },
{ name: 'lebanon', code: '961', flag: 'lb' },
{ name: 'lesotho', code: '266', flag: 'ls' },
{ name: 'liberia', code: '231', flag: 'lr' },
{ name: 'libya', code: '218', flag: 'ly' },
{ name: 'liechtenstein', code: '423', flag: 'li' },
{ name: 'lithuania', code: '370', flag: 'lt' },
{ name: 'luxembourg', code: '352', flag: 'lu' },
{ name: 'macau', code: '853', flag: 'mo' },
{ name: 'macedonia', code: '389', flag: 'mk' },
{ name: 'madagascar', code: '261', flag: 'mg' },
{ name: 'malawi', code: '265', flag: 'mw' },
{ name: 'malaysia', code: '60', flag: 'my' },
{ name: 'maldives', code: '960', flag: 'mv' },
{ name: 'mali', code: '223', flag: 'ml' },
{ name: 'malta', code: '356', flag: 'mt' },
{ name: 'marshall islands', code: '692', flag: 'mh' },
{ name: 'mauritania', code: '222', flag: 'mr' },
{ name: 'mauritius', code: '230', flag: 'mu' },
{ name: 'mayotte', code: '262', flag: 'yt' },
{ name: 'mexico', code: '52', flag: 'mx' },
{ name: 'micronesia', code: '691', flag: 'fm' },
{ name: 'moldova', code: '373', flag: 'md' },
{ name: 'monaco', code: '377', flag: 'mc' },
{ name: 'mongolia', code: '976', flag: 'mn' },
{ name: 'montenegro', code: '382', flag: 'me' },
{ name: 'montserrat', code: '1-664', flag: 'ms' },
{ name: 'morocco', code: '212', flag: 'ma' },
{ name: 'mozambique', code: '258', flag: 'mz' },
{ name: 'myanmar', code: '95', flag: 'mm' },
{ name: 'namibia', code: '264', flag: 'na' },
{ name: 'nauru', code: '674', flag: 'nr' },
{ name: 'nepal', code: '977', flag: 'np' },
{ name: 'netherlands', code: '31', flag: 'nl' },
{ name: 'new caledonia', code: '687', flag: 'nc' },
{ name: 'new zealand', code: '64', flag: 'nz' },
{ name: 'nicaragua', code: '505', flag: 'ni' },
{ name: 'niger', code: '227', flag: 'ne' },
{ name: 'nigeria', code: '234', flag: 'ng' },
{ name: 'niue', code: '683', flag: 'nu' },
{ name: 'north korea', code: '850', flag: 'kp' },
{ name: 'northern mariana islands', code: '1-670', flag: 'mp' },
{ name: 'norway', code: '47', flag: 'no' },
{ name: 'oman', code: '968', flag: 'om' },
{ name: 'pakistan', code: '92', flag: 'pk' },
{ name: 'palau', code: '680', flag: 'pw' },
{ name: 'palestine', code: '970', flag: 'ps' },
{ name: 'panama', code: '507', flag: 'pa' },
{ name: 'papua new guinea', code: '675', flag: 'pg' },
{ name: 'paraguay', code: '595', flag: 'py' },
{ name: 'peru', code: '51', flag: 'pe' },
{ name: 'philippines', code: '63', flag: 'ph' },
{ name: 'pitcairn', code: '870', flag: 'pn' },
{ name: 'poland', code: '48', flag: 'pl' },
{ name: 'portugal', code: '351', flag: 'pt' },
{ name: 'puerto rico', code: '1-787', flag: 'pr' },
{ name: 'qatar', code: '974', flag: 'qa' },
{ name: 'republic of the congo', code: '242', flag: 'cg' },
{ name: 'reunion', code: '262', flag: 're' },
{ name: 'romania', code: '40', flag: 'ro' },
{ name: 'russia', code: '7', flag: 'ru' },
{ name: 'rwanda', code: '250', flag: 'rw' },
{ name: 'saint barthelemy', code: '590', flag: 'bl' },
{ name: 'saint helena', code: '290', flag: 'sh' },
{ name: 'saint kitts and nevis', code: '1-869', flag: 'kn' },
{ name: 'saint lucia', code: '1-758', flag: 'lc' },
{ name: 'saint martin', code: '590', flag: 'mf' },
{ name: 'saint pierre and miquelon', code: '508', flag: 'pm' },
{ name: 'saint vincent and the grenadines', code: '1-784', flag: 'vc' },
{ name: 'samoa', code: '685', flag: 'ws' },
{ name: 'san marino', code: '378', flag: 'sm' },
{ name: 'sao tome and principe', code: '239', flag: 'st' },
{ name: 'saudi arabia', code: '966', flag: 'sa' },
{ name: 'senegal', code: '221', flag: 'sn' },
{ name: 'serbia', code: '381', flag: 'rs' },
{ name: 'seychelles', code: '248', flag: 'sc' },
{ name: 'sierra leone', code: '232', flag: 'sl' },
{ name: 'singapore', code: '65', flag: 'sg' },
{ name: 'slovakia', code: '421', flag: 'sk' },
{ name: 'slovenia', code: '386', flag: 'si' },
{ name: 'solomon islands', code: '677', flag: 'sb' },
{ name: 'somalia', code: '252', flag: 'so' },
{ name: 'south africa', code: '27', flag: 'za' },
{ name: 'south korea', code: '82', flag: 'kr' },
{ name: 'south sudan', code: '211', flag: 'ss' },
{ name: 'spain', code: '34', flag: 'es' },
{ name: 'sri lanka', code: '94', flag: 'lk' },
{ name: 'sudan', code: '249', flag: 'sd' },
{ name: 'suriname', code: '597', flag: 'sr' },
{ name: 'swaziland', code: '268', flag: 'sz' },
{ name: 'sweden', code: '46', flag: 'se' },
{ name: 'switzerland', code: '41', flag: 'ch' },
{ name: 'syria', code: '963', flag: 'sy' },
{ name: 'taiwan', code: '886', flag: 'tw' },
{ name: 'tajikistan', code: '992', flag: 'tj' },
{ name: 'tanzania', code: '255', flag: 'tz' },
{ name: 'thailand', code: '66', flag: 'th' },
{ name: 'togo', code: '228', flag: 'tg' },
{ name: 'tokelau', code: '690', flag: 'tk' },
{ name: 'tonga', code: '676', flag: 'to' },
{ name: 'trinidad and tobago', code: '1-868', flag: 'tt' },
{ name: 'tunisia', code: '216', flag: 'tn' },
{ name: 'turkey', code: '90', flag: 'tr' },
{ name: 'turkmenistan', code: '993', flag: 'tm' },
{ name: 'turks and caicos islands', code: '1-649', flag: 'tc' },
{ name: 'tuvalu', code: '688', flag: 'tv' },
{ name: 'u.s. virgin islands', code: '1-340', flag: 'vi' },
{ name: 'uganda', code: '256', flag: 'ug' },
{ name: 'ukraine', code: '380', flag: 'ua' },
{ name: 'united arab emirates', code: '971', flag: 'ae' },
{ name: 'united kingdom', code: '44', flag: 'gb' },
{ name: 'united states', code: '1', flag: 'us' },
{ name: 'uruguay', code: '598', flag: 'uy' },
{ name: 'uzbekistan', code: '998', flag: 'uz' },
{ name: 'vanuatu', code: '678', flag: 'vu' },
{ name: 'vatican', code: '379', flag: 'va' },
{ name: 'venezuela', code: '58', flag: 've' },
{ name: 'vietnam', code: '84', flag: 'vn' },
{ name: 'wallis and futuna', code: '681', flag: 'wf' },
{ name: 'western sahara', code: '212', flag: 'eh' },
{ name: 'yemen', code: '967', flag: 'ye' },
{ name: 'zambia', code: '260', flag: 'zm' },
{ name: 'zimbabwe', code: '263', flag: 'zw' }
];

getFlagCode(code: string): string {
  const found = this.countryCodes.find(c => c.code === code);
  return found ? found.flag : 'pk';
}

  // countryCodes = [
  //   { name: 'Afghanistan', code: '93' },
  //   { name: 'Albania', code: '355' },
  //   { name: 'Algeria', code: '213' },
  //   { name: 'American Samoa', code: '1-684' },
  //   { name: 'Andorra', code: '376' },
  //   { name: 'Angola', code: '244' },
  //   { name: 'Anguilla', code: '1-264' },
  //   { name: 'Antarctica', code: '672' },
  //   { name: 'Antigua and Barbuda', code: '1-268' },
  //   { name: 'Argentina', code: '54' },
  //   { name: 'Armenia', code: '374' },
  //   { name: 'Aruba', code: '297' },
  //   { name: 'Australia', code: '61' },
  //   { name: 'Austria', code: '43' },
  //   { name: 'Azerbaijan', code: '994' },
  //   { name: 'Bahamas', code: '1-242' },
  //   { name: 'Bahrain', code: '973' },
  //   { name: 'Bangladesh', code: '880' },
  //   { name: 'Barbados', code: '1-246' },
  //   { name: 'Belarus', code: '375' },
  //   { name: 'Belgium', code: '32' },
  //   { name: 'Belize', code: '501' },
  //   { name: 'Benin', code: '229' },
  //   { name: 'Bermuda', code: '1-441' },
  //   { name: 'Bhutan', code: '975' },
  //   { name: 'Bolivia', code: '591' },
  //   { name: 'Bosnia and Herzegovina', code: '387' },
  //   { name: 'Botswana', code: '267' },
  //   { name: 'Brazil', code: '55' },
  //   { name: 'British Indian Ocean Territory', code: '246' },
  //   { name: 'British Virgin Islands', code: '1-284' },
  //   { name: 'Brunei', code: '673' },
  //   { name: 'Bulgaria', code: '359' },
  //   { name: 'Burkina Faso', code: '226' },
  //   { name: 'Burundi', code: '257' },
  //   { name: 'Cambodia', code: '855' },
  //   { name: 'Cameroon', code: '237' },
  //   { name: 'Canada', code: '1' },
  //   { name: 'Cape Verde', code: '238' },
  //   { name: 'Cayman Islands', code: '1-345' },
  //   { name: 'Central African Republic', code: '236' },
  //   { name: 'Chad', code: '235' },
  //   { name: 'Chile', code: '56' },
  //   { name: 'China', code: '86' },
  //   { name: 'Christmas Island', code: '61' },
  //   { name: 'Cocos Islands', code: '61' },
  //   { name: 'Colombia', code: '57' },
  //   { name: 'Comoros', code: '269' },
  //   { name: 'Cook Islands', code: '682' },
  //   { name: 'Costa Rica', code: '506' },
  //   { name: 'Croatia', code: '385' },
  //   { name: 'Cuba', code: '53' },
  //   { name: 'Curacao', code: '599' },
  //   { name: 'Cyprus', code: '357' },
  //   { name: 'Czech Republic', code: '420' },
  //   { name: 'Democratic Republic of the Congo', code: '243' },
  //   { name: 'Denmark', code: '45' },
  //   { name: 'Djibouti', code: '253' },
  //   { name: 'Dominica', code: '1-767' },
  //   { name: 'Dominican Republic', code: '1-809' },
  //   { name: 'East Timor', code: '670' },
  //   { name: 'Ecuador', code: '593' },
  //   { name: 'Egypt', code: '20' },
  //   { name: 'El Salvador', code: '503' },
  //   { name: 'Equatorial Guinea', code: '240' },
  //   { name: 'Eritrea', code: '291' },
  //   { name: 'Estonia', code: '372' },
  //   { name: 'Ethiopia', code: '251' },
  //   { name: 'Falkland Islands', code: '500' },
  //   { name: 'Faroe Islands', code: '298' },
  //   { name: 'Fiji', code: '679' },
  //   { name: 'Finland', code: '358' },
  //   { name: 'France', code: '33' },
  //   { name: 'French Polynesia', code: '689' },
  //   { name: 'Gabon', code: '241' },
  //   { name: 'Gambia', code: '220' },
  //   { name: 'Georgia', code: '995' },
  //   { name: 'Germany', code: '49' },
  //   { name: 'Ghana', code: '233' },
  //   { name: 'Gibraltar', code: '350' },
  //   { name: 'Greece', code: '30' },
  //   { name: 'Greenland', code: '299' },
  //   { name: 'Grenada', code: '1-473' },
  //   { name: 'Guam', code: '1-671' },
  //   { name: 'Guatemala', code: '502' },
  //   { name: 'Guernsey', code: '44-1481' },
  //   { name: 'Guinea', code: '224' },
  //   { name: 'Guinea-Bissau', code: '245' },
  //   { name: 'Guyana', code: '592' },
  //   { name: 'Haiti', code: '509' },
  //   { name: 'Honduras', code: '504' },
  //   { name: 'Hong Kong', code: '852' },
  //   { name: 'Hungary', code: '36' },
  //   { name: 'Iceland', code: '354' },
  //   { name: 'India', code: '91' },
  //   { name: 'Indonesia', code: '62' },
  //   { name: 'Iran', code: '98' },
  //   { name: 'Iraq', code: '964' },
  //   { name: 'Ireland', code: '353' },
  //   { name: 'Isle of Man', code: '44-1624' },
  //   { name: 'Israel', code: '972' },
  //   { name: 'Italy', code: '39' },
  //   { name: 'Ivory Coast', code: '225' },
  //   { name: 'Jamaica', code: '1-876' },
  //   { name: 'Japan', code: '81' },
  //   { name: 'Jersey', code: '44-1534' },
  //   { name: 'Jordan', code: '962' },
    // { name: 'Kazakhstan', code: '7' },
    // { name: 'Kenya', code: '254' },
    // { name: 'Kiribati', code: '686' },
    // { name: 'Kosovo', code: '383' },
    // { name: 'Kuwait', code: '965' },
    // { name: 'Kyrgyzstan', code: '996' },
    // { name: 'Laos', code: '856' },
    // { name: 'Latvia', code: '371' },
    // { name: 'Lebanon', code: '961' },
    // { name: 'Lesotho', code: '266' },
    // { name: 'Liberia', code: '231' },
    // { name: 'Libya', code: '218' },
    // { name: 'Liechtenstein', code: '423' },
    // { name: 'Lithuania', code: '370' },
    // { name: 'Luxembourg', code: '352' },
    // { name: 'Macau', code: '853' },
    // { name: 'Macedonia', code: '389' },
    // { name: 'Madagascar', code: '261' },
    // { name: 'Malawi', code: '265' },
    // { name: 'Malaysia', code: '60' },
    // { name: 'Maldives', code: '960' },
    // { name: 'Mali', code: '223' },
    // { name: 'Malta', code: '356' },
    // { name: 'Marshall Islands', code: '692' },
    // { name: 'Mauritania', code: '222' },
    // { name: 'Mauritius', code: '230' },
    // { name: 'Mayotte', code: '262' },
    // { name: 'Mexico', code: '52' },
    // { name: 'Micronesia', code: '691' },
    // { name: 'Moldova', code: '373' },
    // { name: 'Monaco', code: '377' },
    // { name: 'Mongolia', code: '976' },
    // { name: 'Montenegro', code: '382' },
    // { name: 'Montserrat', code: '1-664' },
    // { name: 'Morocco', code: '212' },
    // { name: 'Mozambique', code: '258' },
    // { name: 'Myanmar', code: '95' },
    // { name: 'Namibia', code: '264' },
    // { name: 'Nauru', code: '674' },
    // { name: 'Nepal', code: '977' },
    // { name: 'Netherlands', code: '31' },
    // { name: 'Netherlands Antilles', code: '599' },
    // { name: 'New Caledonia', code: '687' },
    // { name: 'New Zealand', code: '64' },
    // { name: 'Nicaragua', code: '505' },
    // { name: 'Niger', code: '227' },
    // { name: 'Nigeria', code: '234' },
    // { name: 'Niue', code: '683' },
    // { name: 'North Korea', code: '850' },
    // { name: 'Northern Mariana Islands', code: '1-670' },
    // { name: 'Norway', code: '47' },
    // { name: 'Oman', code: '968' },
    // { name: 'Pakistan', code: '92' },
    // { name: 'Palau', code: '680' },
    // { name: 'Palestine', code: '970' },
    // { name: 'Panama', code: '507' },
    // { name: 'Papua New Guinea', code: '675' },
    // { name: 'Paraguay', code: '595' },
    // { name: 'Peru', code: '51' },
    // { name: 'Philippines', code: '63' },
    // { name: 'Pitcairn', code: '870' },
    // { name: 'Poland', code: '48' },
    // { name: 'Portugal', code: '351' },
    // { name: 'Puerto Rico', code: '1-787' },
    // { name: 'Qatar', code: '974' },
    // { name: 'Republic of the Congo', code: '242' },
    // { name: 'Reunion', code: '262' },
    // { name: 'Romania', code: '40' },
    // { name: 'Russia', code: '7' },
    // { name: 'Rwanda', code: '250' },
    // { name: 'Saint Barthelemy', code: '590' },
    // { name: 'Saint Helena', code: '290' },
    // { name: 'Saint Kitts and Nevis', code: '1-869' },
    // { name: 'Saint Lucia', code: '1-758' },
    // { name: 'Saint Martin', code: '590' },
    // { name: 'Saint Pierre and Miquelon', code: '508' },
    // { name: 'Saint Vincent and the Grenadines', code: '1-784' },
    // { name: 'Samoa', code: '685' },
    // { name: 'San Marino', code: '378' },
    // { name: 'Sao Tome and Principe', code: '239' },
    // { name: 'Saudi Arabia', code: '966' },
    // { name: 'Senegal', code: '221' },
    // { name: 'Serbia', code: '381' },
    // { name: 'Seychelles', code: '248' },
    // { name: 'Sierra Leone', code: '232' },
    // { name: 'Singapore', code: '65' },
    // { name: 'Sint Maarten', code: '1-721' },
    // { name: 'Slovakia', code: '421' },
    // { name: 'Slovenia', code: '386' },
    // { name: 'Solomon Islands', code: '677' },
    // { name: 'Somalia', code: '252' },
    // { name: 'South Africa', code: '27' },
    // { name: 'South Korea', code: '82' },
    // { name: 'South Sudan', code: '211' },
    // { name: 'Spain', code: '34' },
    // { name: 'Sri Lanka', code: '94' },
    // { name: 'Sudan', code: '249' },
    // { name: 'Suriname', code: '597' },
    // { name: 'Svalbard and Jan Mayen', code: '47' },
    // { name: 'Swaziland', code: '268' },
    // { name: 'Sweden', code: '46' },
    // { name: 'Switzerland', code: '41' },
    // { name: 'Syria', code: '963' },
    // { name: 'Taiwan', code: '886' },
    // { name: 'Tajikistan', code: '992' },
    // { name: 'Tanzania', code: '255' },
    // { name: 'Thailand', code: '66' },
    // { name: 'Togo', code: '228' },
    // { name: 'Tokelau', code: '690' },
    // { name: 'Tonga', code: '676' },
    // { name: 'Trinidad and Tobago', code: '1-868' },
    // { name: 'Tunisia', code: '216' },
    // { name: 'Turkey', code: '90' },
    // { name: 'Turkmenistan', code: '993' },
    // { name: 'Turks and Caicos Islands', code: '1-649' },
    // { name: 'Tuvalu', code: '688' },
    // { name: 'U.S. Virgin Islands', code: '1-340' },
    // { name: 'Uganda', code: '256' },
    // { name: 'Ukraine', code: '380' },
    // { name: 'United Arab Emirates', code: '971' },
    // { name: 'United Kingdom', code: '44' },
    // { name: 'United States', code: '1' },
    // { name: 'Uruguay', code: '598' },
    // { name: 'Uzbekistan', code: '998' },
    // { name: 'Vanuatu', code: '678' },
    // { name: 'Vatican', code: '379' },
    // { name: 'Venezuela', code: '58' },
    // { name: 'Vietnam', code: '84' },
    // { name: 'Wallis and Futuna', code: '681' },
    // { name: 'Western Sahara', code: '212' },
    // { name: 'Yemen', code: '967' },
    // { name: 'Zambia', code: '260' },
    // { name: 'Zimbabwe', code: '263' },
  // ];

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

  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.selectedClinicId = clinicId;
    this.setOnlineClinic(clinicId);
  }

  async setOnlineClinic(clinicId: any) {
    const loading = await this.loadingController.create({ message: "Setting clinic online..." });
    await loading.present();
    
    let data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
    
    try {
      await this.clinicService.changeOnlineClinic(data).subscribe(
        (res) => {
          if (res.IsSuccess) {
            loading.dismiss();
            // Update local storage
            this.storage.set(environment.CLINIC_Id, data.Id);
            this.storage.get(environment.CLINICS).then((clinics) => {
              const selectedClinic = clinics.find((clinic) => clinic.Id === data.Id);
              this.storage.set(environment.ON_CLINIC, selectedClinic);
              this.clinicService.updateClinic(selectedClinic);
            });
            this.toastService.create('Clinic set as online successfully', 'success');
            console.log('Online clinic set to:', clinicId);
          } else {
            loading.dismiss();
            this.toastService.create(res.Message, 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to set clinic online', 'danger');
          console.error('Error setting clinic online:', err);
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('An error occurred', 'danger');
      console.error('Error in setOnlineClinic:', error);
    }
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