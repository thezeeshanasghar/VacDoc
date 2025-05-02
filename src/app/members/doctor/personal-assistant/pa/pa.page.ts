import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
// import { ClinicService } from 'src/app/services/clinic.service';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from '../../../../../environments/environment';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { PaService } from 'src/app/services/pa.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { AbstractControl, ValidatorFn } from '@angular/forms';



@Component({
  selector: 'app-pa',
  templateUrl: './pa.page.html',
  styleUrls: ['./pa.page.scss'],
})
export class PaPage implements OnInit {

  fg: FormGroup;
  clinics: any = [];

  DoctorId: any;
  ClinicId: any = [];
  todaydate;
  email: any; 

  constructor(
    public loadingController: LoadingController,
    private router: Router,
    public formBuilder: FormBuilder,
    private storage: Storage,
    private paService: PaService,
    // private vacationService: VacationService,
    private toastService: ToastService,
    private http: HttpClient

  ) {
    this.todaydate = new Date().toISOString().slice(0, 10);

    //this.todaydate = moment(this.todaydate, "DD-MM-YYYY").format('YYYY-MM-DD');
    // this.fg2 = this.formBuilder.group({
    //   clinics: new FormArray([]),
    //   'formDate': [this.todaydate],
    //   'ToDate': [this.todaydate],
    //   'CountryCode': ['92'],
    //   'MobileNumber': [null, [Validators.required, this.onlyNumbersValidator()]],
    // });
  }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.DoctorId = val;
    });
    // this.getClinics();
    this.fg = this.formBuilder.group({
      // Id: [null],
      // FirstName: [null],
      // LastName: [null],
      // DisplayName: [null],
      // Email: new FormControl(
      //   "",
      //   Validators.compose([
      //     Validators.required,
      //     Validators.pattern(
      //       "^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$"
      //     )
      //   ])
      // ),
      // IsApproved: ['true'],
      Name: ['', Validators.compose([
        Validators.required,
        Validators.pattern(/^[^\d]+$/)
      ])],
      CountryCode: ['92'],
      MobileNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("[0-9]{10}$")
        ])
      ),
      Email: new FormControl("", Validators.compose([
        Validators.required,  ]), 
      ),
      // ShowMobile: [null],
      // PhoneNo: new FormControl(
      //   "",
      //   Validators.compose([
      //     Validators.required,
      //     Validators.minLength(7),
      //     Validators.maxLength(11),
      //     Validators.pattern("^([0-9]*)$")
      //   ])
      // ),
      // ShowPhone: [null],
      // PMDC: new FormControl(
      //   "",
      //   Validators.compose([
      //     Validators.required,
      //     Validators.pattern("^[0-9-\\+]*-[A-Z]$")
      //   ])
      // ),
      // AdditionalInfo:["",
      //  [Validators.required,
      //   // this.fourLinesValidator,
      // ]],
      // Qualification:[null],
      // // SignatureImage: new FormControl([null]),
      // ProfileImage: new FormControl([null])

    });

  }
  // pickFromDate($event) {
  //   this.fg2.controls['formDate'].setValue($event.detail.value);
  // }
  // pickTodayDate($event) {
  //   this.fg2.controls['ToDate'].setValue($event.detail.value);
  // }

  async submit() {
    const personalAssistantData = {
      Name: this.fg.value.Name,
      CountryCode: this.fg.value.CountryCode,
      MobileNumber: this.fg.value.MobileNumber,
      Password: this.generatePassword(8), // Generate a password
      DoctorId: this.DoctorId,
      Email: this.fg.value.Email,
    };
  
    console.log('Personal Assistant Data:', personalAssistantData);
  
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
  
    this.paService.signUpPersonalAssistant(personalAssistantData).subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Assistant added successfully', 'success');
          this.router.navigate(['/members/doctor/personal-assistant']);
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('An error occurred', 'danger');
        console.error(err);
      }
    });
  }

  generatePassword(length: number = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
  }

  onlyNumbersValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const forbidden = /\D/.test(control.value); // Regular expression to test for non-digit characters
      return forbidden ? { 'onlyNumbers': { value: control.value } } : null;
    };
  }

  // async getClinics() {
  //   const loading = await this.loadingController.create({ message: 'Loading' });
  //   await loading.present();

  //   await this.clinicService.getClinics(this.DoctorId).subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //         this.clinics = res.ResponseData;
  //         const controls = this.clinics.map(c => new FormControl(false));
  //         this.fg2 = this.formBuilder.group({
  //           clinics: new FormArray(controls),
  //            'formDate': [this.todaydate],
  //            'ToDate': [this.todaydate]
  //         });
  //         loading.dismiss();
  //       }
  //       else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, 'danger');
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, 'danger');
  //     }
  //   );
  // }

  
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

  // async addVacation() {

  //   const clinicId = 56; // Example clinic IDs
  //   const fromDate = '2024-04-23'; // Example from date
  //   const toDate = '2024-04-24';

  //   this.vacationService.patchChildIdsWithSchedules(clinicId, fromDate, toDate)
  //     .subscribe(
  //       (response) => {
  //         console.log('Data patched successfully:', response);
  //         // Add your success handling code here
  //       },
  //       (error) => {
  //         console.error('Failed to patch data:', error);
  //         // Add your error handling code here
  //       }
  //     );
  
  //   // const loading = await this.loadingController.create({ message: 'Loading' });
  //   // await loading.present();

  //   // await this.vacationService.addVaccation(data)
  //   //   .subscribe(res => {
  //   //     if (res.IsSuccess) {
  //   //       loading.dismiss();
  //   //       this.toastService.create('successfully added');
  //   //       this.router.navigate(['/members/']);
  //   //     }
  //   //     else {
  //   //       loading.dismiss();
  //   //       this.toastService.create(res.Message, 'danger');
  //   //     }
  //   //   }, (err) => {
  //   //     loading.dismiss();
  //   //     this.toastService.create(err, 'danger')
  //   //   });
  // }
//   async addVacation() {
//     // Retrieve selected clinic IDs from the form
//     const selectedClinics = this.fg2.value.clinics.reduce((acc, curr, index) => {
//       if (curr) acc.push(this.clinics[index].Id);
//       return acc;
//     }, []);

//     // Retrieve from date and to date from the form
//     const fromDate = moment(this.fg2.value.formDate).format('YYYY-MM-DD');
//     const toDate = moment(this.fg2.value.ToDate).format('YYYY-MM-DD');
//     console.log(fromDate);
//     console.log(toDate);

//     // Patch data for each selected clinic
//     selectedClinics.forEach(async clinicId => {
//       this.vacationService.patchChildIdsWithSchedules(clinicId, fromDate, toDate)
//         .subscribe(
//           (response) => {
//             console.log('Data patched successfully for clinic ID', clinicId, ':', response);
//             this.toastService.create("Vacation Updated Successfully")
//             // Add your success handling code here
//           },
//           (error) => {
//             console.error('Failed to patch data for clinic ID', clinicId, ':', error);
//             this.toastService.create("Cannot Update Vacation", 'danger')
//             // Add your error handling code here
//           }
//         );
//     });
// }
validation_messages = {
  Name: [{ type: "required", message: "Name is required." },
  // { type: 'pattern', message: 'Please enter only characters in the first name.' }],
  // City2: [
  //   { type: 'pattern', message: 'Please enter only characters in the city.' }],
  // fatherName: [{ type: "required", message: "Guardian name is required." },
  // { type: 'pattern', message: 'Only letters, spaces, commas, and hyphens are allowed in Guardian.' }],
  // DOB: [{ type: "required", message: "Date of Birth is required." }
  ],
  MobileNumber: [
    {
      type: "required",
      message: "Mobile number is required"
    },
  ],
  Email: [
    { type: "pattern", message: "Please enter a valid email address" },
    { type: "email", message: "Please enter a valid email address" }
],
//   gender: [{ type: "required", message: "Gender is required." }],
//   Agent2: [
//     { type: "required", message: "Agent is required." }
//   ],
//   email: [
//     { type: "pattern", message: "Please enter a valid email address" },
//     { type: "email", message: "Please enter a valid email address" }
// ],
// nationality: [
//   { type: "required", message: "Nationality is required." },
//   { type: "pattern", message: "Please enter a valid nationality (letters and spaces only)." }
// ],
};

}

// https://coryrylan.com/blog/creating-a-dynamic-checkbox-list-in-angular