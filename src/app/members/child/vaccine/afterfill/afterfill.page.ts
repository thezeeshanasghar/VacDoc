import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VaccineService } from 'src/app/services/vaccine.service';
import { StockService, StockDTO } from 'src/app/services/stock.service';
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
  availableBatchLots: StockDTO[] = [];
  availableLots: string[] = [];
  availableExpiries: string[] = [];
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
  allowInventory: boolean = true;
  scheduleDatecheck: string;
  clinicId: number;

  constructor(
    public loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private route: ActivatedRoute,
    private vaccineService: VaccineService,
    private stockService: StockService,
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
    this.storage.get(environment.ON_CLINIC).then((onlineClinic) => {
      const onlineClinicId = onlineClinic && onlineClinic.Id ? Number(onlineClinic.Id) : null;
      if (onlineClinicId && !isNaN(onlineClinicId)) {
        this.clinicId = onlineClinicId;
      }
    });
    this.storage.get(environment.CLINIC_Id).then((storedClinicId) => {
      const clinicId = Number(storedClinicId);
      if (!this.clinicId && clinicId && !isNaN(clinicId)) {
        this.clinicId = clinicId;
      }
    });
    this.storage.get('vaccinesData').then((val) => {
      this.vaccinesData = val;
    });

    this.storage.get(environment.USER).then((user) => {
      if (user) {
        console.log('Retrieved user from storage:', user);
        this.usertype = user.UserType; 
        this.allowInventory = user.AllowInventory !== false;
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
      Manufacturer: new FormControl(''),
      // ['', Validators.required], 
      Lot: new FormControl(''),
      // ['', Validators.required],
      Expiry: [],
      // ['', Validators.required], // Add Expiry control
      Validity: new FormControl(''),
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
          this.fg.controls['Manufacturer'].setValue(this.vaccineData.Manufacturer);
          this.fg.controls['Lot'].setValue(this.vaccineData.Lot);
          this.fg.controls['Expiry'].setValue(this.toExpiryKey(this.vaccineData.Expiry));
          this.fg.controls['Validity'].setValue(this.vaccineData.Validity);
          this.seedCurrentInventoryOptions(this.vaccineData.Lot, this.vaccineData.Expiry);
          this.clinicId = this.resolveClinicId(this.vaccineData) || this.clinicId;

          const brandId = Number(this.vaccineData.BrandId);
          if (this.allowInventory && brandId && !isNaN(brandId) && this.clinicId) {
            this.loadBatchLotsForBrand(brandId, this.clinicId);
          }

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
          console.log('Vaccine Data:', this.vaccineData);
          this.Type = this.vaccineData.Type;
          this.childId = this.vaccineData.Id; 
          this.clinicId = this.resolveClinicId(this.vaccineData) || this.clinicId;
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

  private seedCurrentInventoryOptions(lot: any, expiry: any): void {
    const lotValue = lot ? String(lot).trim() : '';
    const expiryValue = this.toExpiryKey(expiry);

    this.availableLots = lotValue ? [lotValue] : [];
    this.availableExpiries = expiryValue ? [expiryValue] : [];
  }

  private loadBatchLotsForBrand(brandId: number, clinicId: number): void {
    this.stockService.getBatchLotsByBrand(brandId, clinicId).subscribe(
      (res) => {
        const lots = res && res.IsSuccess && res.ResponseData ? res.ResponseData : [];
        this.availableBatchLots = Array.isArray(lots) ? lots : [];

        this.availableLots = Array.from(
          new Set(
            this.availableBatchLots
              .map((x: any) => (x && x.BatchLot ? String(x.BatchLot).trim() : ''))
              .filter((x: string) => !!x)
          )
        );

        const currentLot = (this.fg.get('Lot') && this.fg.get('Lot').value)
          ? String(this.fg.get('Lot').value)
          : '';

        const selectedLot = currentLot && this.availableLots.some((x: string) => x === currentLot)
          ? currentLot
          : (this.availableLots.length > 0 ? this.availableLots[0] : '');

        if (!selectedLot) {
          this.availableExpiries = [];
          this.fg.patchValue({ Lot: '', Expiry: null }, { emitEvent: true });
          return;
        }

        this.fg.patchValue({ Lot: selectedLot }, { emitEvent: true });
        this.refreshExpiryOptionsForLot(selectedLot);
      },
      () => {
        this.availableBatchLots = [];
        this.availableLots = [];
        this.availableExpiries = [];
      }
    );
  }

  onLotChange(event: any): void {
    const lotValue = event && event.detail ? event.detail.value : event;
    if (!lotValue) {
      this.availableExpiries = [];
      this.fg.patchValue({ Expiry: null }, { emitEvent: true });
      return;
    }

    this.refreshExpiryOptionsForLot(String(lotValue));
  }

  private refreshExpiryOptionsForLot(lotValue: string): void {
    const expiryOptions = Array.from(
      new Set(
        (this.availableBatchLots || [])
          .filter((x: any) => (x && x.BatchLot ? String(x.BatchLot).trim() : '') === lotValue)
          .map((x: any) => this.toExpiryKey(x ? x.Expiry : null))
          .filter((x: string) => !!x)
      )
    );

    this.availableExpiries = expiryOptions;

    const currentExpiry = this.toExpiryKey(this.fg.get('Expiry') ? this.fg.get('Expiry').value : null);
    if (currentExpiry && this.availableExpiries.some((x: string) => x === currentExpiry)) {
      this.fg.patchValue({ Expiry: currentExpiry }, { emitEvent: true });
      return;
    }

    const nextExpiry = this.availableExpiries.length > 0 ? this.availableExpiries[0] : null;
    this.fg.patchValue({ Expiry: nextExpiry }, { emitEvent: true });
  }

  private toExpiryKey(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private resolveClinicId(payload: any): number {
    if (!payload) {
      return null;
    }

    const rawClinicId =
      payload.ClinicId
      || payload.clinicId
      || (payload.Child && (payload.Child.ClinicId || payload.Child.clinicId))
      || (payload.child && (payload.child.ClinicId || payload.child.clinicId));

    const clinicId = Number(rawClinicId);
    return clinicId && !isNaN(clinicId) ? clinicId : null;
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
    if (!this.allowInventory) {
      this.fg.value.Lot = '';
      this.fg.value.Expiry = null;
    }

    if (this.fg.value.Expiry) {
      this.fg.value.Expiry = moment(this.fg.value.Expiry, 'YYYY-MM-DD').format('YYYY-MM-DD');
    } else {
      this.fg.value.Expiry = null;
    }

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
