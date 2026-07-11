import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

/**
 * Batch/Lot picker bottom sheet (spec §6).
 * FEFO pre-selected · expired batches blocked · non-FEFO choice logs a reason.
 * Presented via ModalController; returns { batchLot, expiry, overrideReason } on USE.
 */
@Component({
  selector: 'app-batch-picker',
  templateUrl: './batch-picker.component.html',
  styleUrls: ['./batch-picker.component.scss'],
})
export class BatchPickerComponent implements OnInit {
  @Input() brandName = '';
  @Input() lots: any[] = [];          // full lot objects: { BatchLot, Expiry, Quantity }
  @Input() selectedLot = '';          // currently chosen BatchLot string
  @Input() mode: 'give' | 'correct' = 'give';

  rows: Array<{ batchLot: string; expiry: string; qty: number; expired: boolean; isFefo: boolean; }> = [];
  chosen: string | null = null;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    const now = new Date();
    // Lots arrive FEFO-sorted (earliest expiry first). First non-expired = FEFO pick.
    let fefoAssigned = false;
    this.rows = (this.lots || []).map(l => {
      const batchLot = l && l.BatchLot ? String(l.BatchLot).trim() : '';
      const expRaw = l && l.Expiry ? new Date(l.Expiry) : null;
      const expired = !!expRaw && expRaw.getTime() < now.getTime();
      const isFefo = !expired && !fefoAssigned;
      if (isFefo) { fefoAssigned = true; }
      return {
        batchLot,
        expiry: expRaw ? this.fmtMonthYear(expRaw) : '—',
        qty: (l && typeof l.Quantity === 'number') ? l.Quantity : 0,
        expired,
        isFefo,
      };
    });
    // Pre-select: current choice if valid & not expired, else the FEFO pick.
    const current = this.rows.find(r => r.batchLot === this.selectedLot && !r.expired);
    const fefo = this.rows.find(r => r.isFefo);
    this.chosen = current ? current.batchLot : (fefo ? fefo.batchLot : null);
  }

  private fmtMonthYear(d: Date): string {
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    return `${m}-${d.getFullYear()}`;
  }

  title(): string {
    return (this.mode === 'correct' ? 'Correct batch — ' : 'Batch — ') + (this.brandName || 'brand');
  }

  select(row: any) {
    if (row.expired) { return; }
    this.chosen = row.batchLot;
  }

  private isChosenFefo(): boolean {
    const r = this.rows.find(x => x.batchLot === this.chosen);
    return !!r && r.isFefo;
  }

  async confirm() {
    const row = this.rows.find(r => r.batchLot === this.chosen);
    if (!row) { return; }
    // Non-FEFO override → require a one-tap reason (spec §6, logged to audit).
    if (!row.isFefo) {
      const reason = await this.pickOverrideReason();
      if (!reason) { return; }        // cancelled
      this.dismissWith(row, reason);
      return;
    }
    this.dismissWith(row, null);
  }

  private dismissWith(row: any, overrideReason: string | null) {
    this.modalController.dismiss({
      batchLot: row.batchLot,
      expiry: row.expiry,
      overrideReason,
    }, 'use');
  }

  private async pickOverrideReason(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Why not the FEFO batch?',
        cssClass: 'vac-confirm',
        inputs: [
          { type: 'radio', label: 'Vial open',      value: 'Vial open' },
          { type: 'radio', label: 'Parent request', value: 'Parent request' },
          { type: 'radio', label: 'Damaged',        value: 'Damaged' },
          { type: 'radio', label: 'Other',          value: 'Other' },
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel', cssClass: 'alert-btn-neutral', handler: () => resolve(null) },
          { text: 'Confirm', handler: (val) => resolve(val || null) },
        ],
      });
      await alert.present();
    });
  }

  dismiss() { this.modalController.dismiss(null, 'cancel'); }
}
