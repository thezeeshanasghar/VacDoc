import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { StockTransferService } from 'src/app/services/stock-transfer.service';
import { ToastService } from 'src/app/shared/toast.service';

export interface EditTransferRow {
  id: number;
  brandName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
}

@Component({
  selector: 'app-edit-transfer',
  templateUrl: './edit-transfer.page.html',
  styleUrls: ['./edit-transfer.page.scss']
})
export class EditTransferPage implements OnInit {
  editMode = false;
  rows: EditTransferRow[] = [];
  fromClinicName = '';
  toClinicName = '';
  createdAt = '';

  private groupKey = '';
  private fromClinicId: number = 0;
  private toClinicId: number = 0;
  usertype: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transferService: StockTransferService,
    private toastService: ToastService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private storage: Storage
  ) {}

  async ngOnInit() {
    this.usertype = await this.storage.get(environment.USER);
    this.groupKey = this.route.snapshot.params['groupKey'];
    // groupKey format: yyyy-M-d-H-m-fromClinicId-toClinicId
    const parts = this.groupKey.split('-');
    this.fromClinicId = Number(parts[5]);
    this.toClinicId   = Number(parts[6]);
    await this.loadRecords();
  }

  get isDoctor(): boolean {
    return this.usertype && this.usertype.UserType === 'DOCTOR';
  }

  get totalValue(): number {
    return this.rows.reduce((s, r) => s + ((r.quantity || 0) * (r.costPrice || 0)), 0);
  }

  async loadRecords() {
    const loader = await this.loadingCtrl.create({ message: 'Loading...' });
    await loader.present();

    this.transferService.getHistory({
      fromClinicId: this.fromClinicId,
      toClinicId:   this.toClinicId
    }).subscribe({
      next: (res) => {
        loader.dismiss();
        if (!res || !res.IsSuccess) {
          this.toastService.create('Failed to load transfer', 'danger'); return;
        }

        const all = res.ResponseData || [];
        // re-build the same groupKey from each record to match
        const matched = all.filter(r => {
          const d = new Date(r.CreatedAt);
          const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}-${r.FromClinicId}-${r.ToClinicId}`;
          return key === this.groupKey;
        });

        if (!matched.length) {
          this.toastService.create('Transfer not found', 'danger'); return;
        }

        const first = matched[0];
        this.fromClinicName = first.FromClinicName;
        this.toClinicName   = first.ToClinicName;
        this.createdAt      = first.CreatedAt;

        this.rows = matched.map(r => ({
          id:          r.Id,
          brandName:   r.BrandName,
          batchNumber: r.BatchNumber || '',
          expiryDate:  r.ExpiryDate ? r.ExpiryDate.split('T')[0] : '',
          quantity:    r.Quantity,
          costPrice:   r.CostPrice
        }));
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to load transfer', 'danger'); }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) { this.loadRecords(); }
  }

  formatExpiry(val: string): string {
    if (!val) { return '—'; }
    const d = new Date(val);
    if (isNaN(d.getTime())) { return val; }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  async saveAll() {
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (!r.quantity || r.quantity <= 0) {
        this.toastService.create(`Row ${i + 1} (${r.brandName}): quantity must be > 0`, 'danger'); return;
      }
      if (!r.costPrice || r.costPrice <= 0) {
        this.toastService.create(`Row ${i + 1} (${r.brandName}): cost price must be > 0`, 'danger'); return;
      }
    }

    const loader = await this.loadingCtrl.create({ message: 'Saving...' });
    await loader.present();

    let failed = false;
    for (const r of this.rows) {
      await new Promise<void>(resolve => {
        this.transferService.editTransfer(r.id, {
          Quantity:    r.quantity,
          CostPrice:   r.costPrice,
          BatchNumber: r.batchNumber || null,
          ExpiryDate:  r.expiryDate  || null
        }).subscribe({
          next: (res) => {
            if (!res || !res.IsSuccess) {
              failed = true;
              this.toastService.create(res && res.Message ? res.Message : `Failed to save ${r.brandName}`, 'danger');
            }
            resolve();
          },
          error: () => { failed = true; this.toastService.create(`Failed to save ${r.brandName}`, 'danger'); resolve(); }
        });
      });
      if (failed) { break; }
    }

    loader.dismiss();
    if (!failed) {
      this.toastService.create('Transfer updated successfully', 'success');
      this.editMode = false;
      this.loadRecords();
    }
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Reverse Transfer',
      message: `This will reverse all ${this.rows.length} item(s) and restore inventory on both sides. Cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reverse & Delete', cssClass: 'alert-danger', handler: () => { this.deleteAll(); } }
      ]
    });
    await alert.present();
  }

  async deleteAll() {
    const loader = await this.loadingCtrl.create({ message: 'Reversing transfer...' });
    await loader.present();

    let failed = false;
    for (const r of this.rows) {
      await new Promise<void>(resolve => {
        this.transferService.deleteTransfer(r.id).subscribe({
          next: (res) => {
            if (!res || !res.IsSuccess) {
              failed = true;
              this.toastService.create(res && res.Message ? res.Message : `Failed to reverse ${r.brandName}`, 'danger');
            }
            resolve();
          },
          error: () => { failed = true; this.toastService.create(`Failed to reverse ${r.brandName}`, 'danger'); resolve(); }
        });
      });
      if (failed) { break; }
    }

    loader.dismiss();
    if (!failed) {
      this.toastService.create('Transfer reversed successfully', 'success');
      this.router.navigate(['/members/doctor/stock-management/stock-transfer-history']);
    }
  }
}
