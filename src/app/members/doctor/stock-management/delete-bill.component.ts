import { Component, Input, OnInit } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { StockService } from 'src/app/services/stock.service';
import { ToastService } from 'src/app/shared/toast.service';

interface DoseRow {
  ScheduleId: number;
  ChildName: string;
  VaccineName: string;
  GivenDate: string;
  CurrentLot: string;
  CurrentExpiry: string;
  BrandId: number;
  selectedBatchKey: string;
}

@Component({
  selector: 'app-delete-bill',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Delete Bill</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Warning banner -->
      <div style="background:#fff3e0; border-radius:10px; padding:12px 16px; margin-bottom:16px;">
        <div style="font-weight:700; color:#E65100; margin-bottom:4px;">
          <ion-icon name="warning-outline" style="vertical-align:middle;"></ion-icon>
          {{ consumption.ConsumedQty }} dose(s) already administered
        </div>
        <div style="font-size:13px; color:#555;">
          Reassign a replacement batch for each dose before proceeding.
          Both buttons are locked until all doses are reassigned.
        </div>
      </div>

      <!-- Dose rows -->
      <div *ngFor="let row of doseRows; let i = index"
        style="border:1px solid #e0e0e0; border-radius:10px; padding:12px 14px; margin-bottom:12px;">

        <div style="font-weight:700; font-size:14px; color:#1565C0;">{{ row.ChildName }}</div>
        <div style="font-size:12px; color:#555; margin-bottom:6px;">
          {{ row.VaccineName }} &nbsp;·&nbsp;
          {{ row.GivenDate | date:'dd MMM yyyy' }} &nbsp;·&nbsp;
          Batch: {{ row.CurrentLot }}
        </div>

        <ion-item lines="none" style="--padding-start:0;">
          <ion-label position="stacked" style="font-size:12px; color:#888;">
            Replace with <span style="color:red">*</span>
          </ion-label>
          <ion-select
            [(ngModel)]="row.selectedBatchKey"
            placeholder="Select replacement batch"
            style="font-size:13px; width:100%;">
            <ion-select-option
              *ngFor="let b of getBatchesForBrand(row.BrandId)"
              [value]="b.BatchLot + '|' + b.Expiry">
              {{ b.BatchLot }} — {{ b.Expiry | date:'dd/MM/yyyy' }} ({{ b.Quantity }} units)
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div *ngIf="!row.selectedBatchKey"
          style="font-size:11px; color:#C62828; margin-top:4px;">
          <ion-icon name="alert-circle-outline"></ion-icon> Required
        </div>

      </div>

      <!-- Summary -->
      <div style="background:#f4f6fb; border-radius:10px; padding:12px 16px; margin-top:8px; margin-bottom:20px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; padding:3px 0;">
          <span>Total purchased</span><span style="font-weight:600;">{{ consumption.PurchasedQty }} units</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:3px 0;">
          <span>Consumed (given to patients)</span><span style="font-weight:600; color:#E65100;">{{ consumption.ConsumedQty }} units</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:3px 0;">
          <span>Remaining in stock</span><span style="font-weight:600; color:#2E7D32;">{{ consumption.RemainingQty }} units</span>
        </div>
      </div>

      <!-- Action buttons -->
      <ion-button expand="block" color="danger" [disabled]="!allReassigned" (click)="deleteAll()" style="margin-bottom:10px;">
        <ion-icon name="trash-outline" slot="start"></ion-icon>
        Delete All {{ consumption.PurchasedQty }} Units
      </ion-button>

      <ion-button expand="block" color="warning" [disabled]="!allReassigned" (click)="deleteRemaining()">
        <ion-icon name="cut-outline" slot="start"></ion-icon>
        Keep bill — Delete Remaining {{ consumption.RemainingQty }} Units Only
      </ion-button>

      <div *ngIf="!allReassigned" style="text-align:center; font-size:12px; color:#888; margin-top:8px;">
        Reassign all batches above to unlock
      </div>

    </ion-content>
  `
})
export class DeleteBillComponent implements OnInit {
  @Input() bill: any = {};
  @Input() consumption: any = {};

  doseRows: DoseRow[] = [];

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private stockService: StockService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.doseRows = (this.consumption.ConsumedDoses || []).map((d: any) => ({
      ScheduleId:     d.ScheduleId,
      ChildName:      d.ChildName,
      VaccineName:    d.VaccineName,
      GivenDate:      d.GivenDate,
      CurrentLot:     d.CurrentLot,
      CurrentExpiry:  d.CurrentExpiry,
      BrandId:        d.BrandId,
      selectedBatchKey: ''
    }));
  }

  getBatchesForBrand(brandId: number): any[] {
    return (this.consumption.ReplacementBatches || []).filter((b: any) => b.BrandId === brandId);
  }

  get allReassigned(): boolean {
    return this.doseRows.length > 0 && this.doseRows.every(r => !!r.selectedBatchKey);
  }

  private buildReassignPayload() {
    return this.doseRows.map(r => {
      const [lot, expiry] = r.selectedBatchKey.split('|');
      return {
        ScheduleId:   r.ScheduleId,
        NewBatchLot:  lot,
        NewExpiry:    expiry || null
      };
    });
  }

  dismiss() { this.modalCtrl.dismiss(null); }

  async deleteAll() {
    const loading = await this.loadingCtrl.create({ message: 'Reassigning batches...' });
    await loading.present();

    this.stockService.reassignBillBatches(this.bill.Id, this.buildReassignPayload()).subscribe({
      next: () => {
        loading.dismiss();
        const loading2 = this.loadingCtrl.create({ message: 'Deleting bill...' }).then(l => {
          l.present();
          this.stockService.deleteBillWithReversal(this.bill.Id).subscribe({
            next: (res: any) => {
              l.dismiss();
              if (res && res.IsSuccess) {
                this.modalCtrl.dismiss({ deleted: true });
              } else {
                this.toastService.create(res && res.Message ? res.Message : 'Delete failed.', 'danger');
              }
            },
            error: () => { l.dismiss(); this.toastService.create('Delete failed.', 'danger'); }
          });
        });
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to reassign batches.', 'danger'); }
    });
  }

  async deleteRemaining() {
    const loading = await this.loadingCtrl.create({ message: 'Reassigning batches...' });
    await loading.present();

    this.stockService.reassignBillBatches(this.bill.Id, this.buildReassignPayload()).subscribe({
      next: () => {
        loading.dismiss();
        this.loadingCtrl.create({ message: 'Adjusting bill...' }).then(l => {
          l.present();
          this.stockService.deleteBillRemaining(this.bill.Id).subscribe({
            next: () => {
              l.dismiss();
              this.modalCtrl.dismiss({ reduced: true });
            },
            error: () => { l.dismiss(); this.toastService.create('Failed to delete remaining.', 'danger'); }
          });
        });
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to reassign batches.', 'danger'); }
    });
  }
}
