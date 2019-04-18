import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-cinfo',
  templateUrl: './cinfo.page.html',
  styleUrls: ['./cinfo.page.scss'],
})
export class CinfoPage implements OnInit {

  fg: FormGroup
  offDays: any;
  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      Name: [],
      PhoneNumber: [],
      Address: [],
      ConsultationFee: [],
      OffDays: [],
      StartTime: [],
      EndTime: [],
      Lat: [],
      Long: []
    });
  }
  nextpage() {
    console.log(this.offDays);
    this.fg.value.OffDays = this.offDays;
    console.log(this.fg.value);
  }

}
