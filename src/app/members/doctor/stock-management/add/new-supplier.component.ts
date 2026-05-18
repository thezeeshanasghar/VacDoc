import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { SupplierService } from 'src/app/services/supplier.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-new-supplier',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Add New Supplier</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Name <span style="color:red">*</span></ion-label>
        <ion-input [(ngModel)]="supplier.Name" placeholder="Supplier name"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Contact Person</ion-label>
        <ion-input [(ngModel)]="supplier.ContactPerson" placeholder="Contact person"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Phone</ion-label>
        <ion-input [(ngModel)]="supplier.Phone" type="tel" placeholder="Phone number"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Address</ion-label>
        <ion-input [(ngModel)]="supplier.Address" placeholder="Address"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Opening Balance (Rs)</ion-label>
        <ion-input [(ngModel)]="supplier.OpeningBalance" type="number" placeholder="0"></ion-input>
      </ion-item>
      <ion-button expand="block" color="primary" class="ion-margin-top" (click)="save()">
        <ion-icon name="save" slot="start"></ion-icon>
        Save Supplier
      </ion-button>
    </ion-content>
  `
})
export class NewSupplierComponent {
  supplier = { Name: '', ContactPerson: '', Phone: '', Address: '', OpeningBalance: null, IsActive: true };

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private supplierService: SupplierService,
    private toastService: ToastService
  ) {}

  dismiss() { this.modalCtrl.dismiss(null); }

  async save() {
    if (!this.supplier.Name || this.supplier.Name.trim() === '') {
      this.toastService.create('Supplier name is required.', 'danger');
      return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Saving supplier...' });
    await loading.present();
    this.supplierService.create(this.supplier).subscribe({
      next: (res: any) => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.modalCtrl.dismiss(res.ResponseData);
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to save supplier.', 'danger');
        }
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to save supplier.', 'danger'); }
    });
  }
}
