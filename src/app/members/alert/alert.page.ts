import { Component, OnInit } from '@angular/core';
import { ClinicService } from "src/app/services/clinic.service";

@Component({
  selector: 'app-alert',
  templateUrl: './alert.page.html',
  styleUrls: ['./alert.page.scss'],
})
export class AlertPage implements OnInit {

  constructor(public clinicService: ClinicService,) { }

  ngOnInit() {
  }

}
