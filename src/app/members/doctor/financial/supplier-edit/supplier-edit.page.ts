import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { SupplierService } from 'src/app/services/supplier.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-supplier-edit',
  templateUrl: './supplier-edit.page.html',
  styleUrls: ['./supplier-edit.page.scss'],
})
export class SupplierEditPage implements OnInit {
  fg: FormGroup;
  isNew: boolean = false;
  supplierId: any = null;
  doctorId: number = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = idParam === 'new';
    this.supplierId = this.isNew ? null : Number(idParam);

    this.fg = this.fb.group({
      Name: ['', Validators.required],
      ContactPerson: [null],
      Phone: [null],
      Email: [null],
      Address: [null],
      OpeningBalance: [null],
      IsActive: [true],
    });

    if (!this.isNew) {
      this.loadSupplier();
    }
  }

  async loadSupplier() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.supplierService.getById(this.supplierId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.fg.patchValue(res.ResponseData);
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create('Failed to load supplier', 'danger');
      }
    );
  }

  async save() {
    if (this.fg.invalid) {
      this.toastService.create('Name is required', 'danger');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const payload = Object.assign({}, this.fg.value, { DoctorId: this.doctorId });
    const call = this.isNew
      ? this.supplierService.create(payload)
      : this.supplierService.update(this.supplierId, payload);

    call.subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Saved successfully', 'success');
          this.router.navigate(['/members/doctor/stock-management/suppliers']);
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create('Failed to save', 'danger');
      }
    );
  }
}
