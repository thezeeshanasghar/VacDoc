import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pinfo',
  templateUrl: './pinfo.page.html',
  styleUrls: ['./pinfo.page.scss'],
})
export class PinfoPage implements OnInit {

  fg: FormGroup;
  doctortype = 'Child Specialist';
  doctorsp: [];
  docSpeciality: any;
  constructor(
    private frombuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit() {
    this.fg = this.frombuilder.group({
      DoctorType: [],
      Qualification: [],
      AdditionalInfo: [],
      FirstName: [],
      LastName: [],
      DisplayName: [],
      Email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$')
      ])),
      Password: [],
      CountryCode: ['092'],
      MobileNumber: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('[0-9]{10}$')
      ])),
      ShowMobile: [],
      PhoneNo: [],
      ShowPhone: [],
      PMDC: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9-\\+]*-[A-Z]$')
      ])),
      DoctorSp: []
    })
  }

  selectChangeHandler(event: any) {
    this.doctorsp = event.target.value;
    console.log(this.doctorsp);
  }
  PasswordGenerator() {
    var length = 4,
      charset = "0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    this.fg.value.Password = retVal;
  }

  nextpage() {
    this.PasswordGenerator();
    this.fg.value.DoctorSp = this.docSpeciality;
    this.fg.value.DoctorType = this.doctortype;
    console.log(this.fg.value);
    this.router.navigate(['/sigup/cinfo']);
  }

  validation_messages = {
    'qualification': [
      { type: 'required', message: 'Qualification is required.' }
    ],
    'FirstName': [
      { type: 'required', message: 'FirstName is required.' }
    ],
    'lastName': [
      { type: 'required', message: 'LastName is required.' }
    ],
    'displayName': [
      { type: 'required', message: 'DisplayName is required.' }
    ],
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Please enter a valid email.' }
    ],
    'mobileNumber': [
      { type: 'required', message: 'MobileNumber is required.' },
      { type: 'pattern', message: 'Mobile number is required like 3331231231' }
    ],
    'phoneNo': [
      { type: 'required', message: 'PhoneNo is required.' }
    ],
    'PMDC': [
      { type: 'required', message: 'PMDC is required.' },
      { type: 'pattern', message: 'PMDC is required like 12345-A' }
    ],
  };
}
