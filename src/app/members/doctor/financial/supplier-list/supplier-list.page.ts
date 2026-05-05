import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { SupplierService } from 'src/app/services/supplier.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.page.html',
  styleUrls: ['./supplier-list.page.scss'],
})
export class SupplierListPage {
  suppliers: any[] = [];

  constructor(
    private supplierService: SupplierService,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    this.loadSuppliers();
  }

  async loadSuppliers() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.supplierService.getAll().subscribe(
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
    this.router.navigate(['/members/doctor/financial/supplier-edit', id]);
  }

  goToLedger(id: number) {
    this.router.navigate(['/members/doctor/financial/supplier-ledger', id]);
  }

  addNew() {
    this.router.navigate(['/members/doctor/financial/supplier-edit', 'new']);
  }
}
