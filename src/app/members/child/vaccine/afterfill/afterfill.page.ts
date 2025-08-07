import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-afterfill',
  templateUrl: './afterfill.page.html',
  styleUrls: ['./afterfill.page.scss'],
})
export class AfterFillPage implements OnInit {
  customActionSheetOptions: any = {
    header: 'Select Brand',
    cssClass: 'action-sheet-class'
  };

  fg: FormGroup;
  doctorId: any;
  vaccinId: any;
  vaccineData: any = [];
  vaccinesData: any;
  vaccineName: any;
  brandName: any;
  Date: any;
  todaydate: any;
  birthYear: any;
  MinAge: any;
  MinGap: any;
  todayDate: string = new Date().toISOString().split('T')[0];
  fgAddData: FormGroup;
  scheduleDate: string = ''; 
  isScheduleDateInvalid: boolean = false;
  childId: number;
  childData: any;
  Type: any;
  Manufacturer:any;
  Lot:any;
  Expiry:any;
  Validity:any;
  vaccine: any;
  doseId: any;
  usertype: any;
  scheduleDatecheck: string;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private toastService: ToastService,
    private router: Router,
    private ref: ChangeDetectorRef,
    private childService: ChildService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
    this.storage.get('BirthYear').then((val) => {
      this.birthYear = moment(val, "DD-MM-YYYY").format("YYYY-MM-DD");
    });
    this.storage.get('vaccinesData').then((val) => {
      this.vaccinesData = val;
    });

    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; 
      } else {
        console.error('No user data found in storage.');
      }
    });

    this.fg = this.formBuilder.group({
      'DoctorId': [''],
      'Id': [null],
      Weight: new FormControl(''),
      Height: new FormControl(''),
      Circle: new FormControl(''),
    });

    this.fgAddData = this.formBuilder.group({
      'DoctorId': [''],
      'ChildId': [null],
    });
    this.getVaccination();
  }

  async getVaccination() {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();
    await this.vaccineService.getVaccineByVaccineId(this.route.snapshot.paramMap.get('id')).subscribe(
      res => {
        if (res.IsSuccess) {

          this.vaccineData = res.ResponseData;
          console.log('Vaccine Data:', this.vaccineData);
          this.childId=this.vaccineData.ChildId;
          this.fg.controls['Weight'].setValue(this.vaccineData.Weight);
          this.fg.controls['Height'].setValue(this.vaccineData.Height);
          this.fg.controls['Circle'].setValue(this.vaccineData.Circle);
          this.getChildData(this.childId)
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  };
 
  async getChildData(childId) {
    if (!this.childService) {
      console.error('childService is not defined');
      return;
    }
    console.log('Fetching child data for ID:', childId);
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    this.childService.getChildById(childId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.vaccineData = res.ResponseData;
          this.childId = this.vaccineData.Id; 
          this.ref.detectChanges();
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger');
      }
    );
  }
  
  isScheduleDateValid(): boolean {
    const today = new Date().toISOString().split('T')[0]; 
    const givenDate = this.fg.get('GivenDate').value; 
    return givenDate > today;
  }

  async fillVaccine() {
    const loading = await this.loadingController.create({
      message: 'Updating'
    });
    this.fg.value.Id = this.route.snapshot.paramMap.get('id');
    console.log(this.fg.value);
    this.fg.value.DoctorId = this.doctorId;
    this.fg.value.ChildId = this.childId;

    await this.vaccineService.AfterfillUpChildVaccine(this.fg.value).subscribe(
      res => {
        if (res.IsSuccess) {
            loading.dismiss();
            this.router.navigate(['/members/child/vaccine/' + this.childId]);

        } else {
          loading.dismiss();
          this.toastService.create("Error: Failed to update injection");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create("Error: Server Failure");
      }
    );
  }
}
