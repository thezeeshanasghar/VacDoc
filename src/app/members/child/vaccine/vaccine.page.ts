import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { groupBy } from 'rxjs/operators';

@Component({
  selector: 'app-vaccine',
  templateUrl: './vaccine.page.html',
  styleUrls: ['./vaccine.page.scss'],
})
export class VaccinePage implements OnInit {

  vaccine: any[] = [];
  datemerging: any;
  newData: any[] = [];
  childID:any;
  fg: FormGroup
  constructor(
    public loadingController: LoadingController,
    public route: ActivatedRoute,
    public formBuilder: FormBuilder,
    public router: Router,
    private vaccineService: VaccineService,
    private toastService: ToastService

  ) { }

  ngOnInit() {

    this.fg = this.formBuilder.group({
      'Date': [null],
    });
    this.childID = this.route.snapshot.paramMap.get('id');
    this.getVaccination();
    //   const pets = [
    //     {type:"Dog", name:"Spot"},
    //     {type:"Cat", name:"Tiger"},
    //     {type:"Dog", name:"Rover"}, 
    //     {type:"Cat", name:"Leo"}
    // ];

    // const grouped = this.groupBy(pets, pet => pet.type);
    // console.log(grouped)
  }
  // groupBy(list, keyGetter) {
  //   const map = new Map();
  //   list.forEach((item) => {
  //     const key = keyGetter(item);
  //     const collection = map.get(key);
  //     if (!collection) {
  //       map.set(key, [item]);
  //     } else {
  //       collection.push(item);
  //     }
  //   });
  //   return map;
  // }

  // groupBy(objectArray, property) {
  //   return objectArray.reduce(function (acc, obj) {
  //     var key = obj[property];
  //     if (!acc[key]) {
  //       acc[key] = [];
  //     }
  //     acc[key].push(obj);
  //     return acc;
  //   }, {});
  // }


  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    let _self = this;
    await _self.vaccineService.getVaccinationById(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {
          _self.vaccine = res.ResponseData;
          console.log(this.vaccine);
          // const groupedPeople = this.groupBy(_self.vaccine, 'Date');
          // console.log(groupedPeople);

          // let obj = {
          //   Date: String, //10-09-2019
          //   Values: [] //[v1,v2,v3,v4]
          // }
          loading.dismiss();
          this.vaccine.forEach(doc => {
            doc.Date = moment(doc.Date, "DD-MM-YYYY").format('YYYY-MM-DD');
          });
        }
        else {
          loading.dismiss()
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }

  async updateDate($event, vacId) {
    let newDate = $event.detail.value;
    newDate = moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    let data = { 'Date': newDate, 'ID': vacId }
    await this.vaccineService.updateVaccinationDate(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.getVaccination();
          this.toastService.create(res.Message)
        }
        else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        this.toastService.create(err, 'danger');
      }
    );
  }

}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-a-array-of-objects