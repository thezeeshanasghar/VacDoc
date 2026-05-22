import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { SupplierService } from 'src/app/services/supplier.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.page.html',
  styleUrls: ['./supplier-list.page.scss'],
})
export class SupplierListPage {
  suppliers: any[] = [];
  doctorId: number = 0;

  constructor(
    private supplierService: SupplierService,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router,
    private storage: Storage,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.loadSuppliers();
  }

  async loadSuppliers() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.supplierService.getAll(this.doctorId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.suppliers = res.ResponseData || [];
        } else {
          this.suppliers = [];
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create('Failed to load suppliers', 'danger');
      }
    );
  }

  goToEdit(id: number) {
    this.router.navigate(['/members/doctor/stock-management/supplier-edit', id]);
  }

  goToLedger(id: number) {
    this.router.navigate(['/members/doctor/stock-management/supplier-ledger', id]);
  }

  addNew() {
    this.router.navigate(['/members/doctor/stock-management/supplier-edit', 'new']);
  }
}
