import { Component, OnInit } from '@angular/core';
import { VaccineService } from 'src/app/services/vaccine.service';

@Component({
  selector: 'app-vaccine-education',
  templateUrl: './vaccine-education.page.html',
  styleUrls: ['./vaccine-education.page.scss'],
})
export class VaccineEducationPage implements OnInit {

  vaccineInfos: any[] = [];
  loading = false;
  selectedVaccineInfo: any = null;

  constructor(private vaccineService: VaccineService) { }

  ngOnInit() {
    this.loadVaccineInfos();
  }

  loadVaccineInfos() {
    this.loading = true;
    this.vaccineService.getVaccineInfos().subscribe(
      res => {
        this.vaccineInfos = (res && res.ResponseData) ? res.ResponseData : [];
        this.loading = false;
      },
      err => {
        console.log(err);
        this.vaccineInfos = [];
        this.loading = false;
      }
    );
  }

  openDetail(info: any) {
    this.selectedVaccineInfo = info;
  }

  closeDetail() {
    this.selectedVaccineInfo = null;
  }

}
