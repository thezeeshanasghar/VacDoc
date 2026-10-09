import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

/**
 * Batch/Lot picker bottom sheet (spec §6).
 * FEFO pre-selected · expired batches blocked.
 * Presented via ModalController; returns { batchLot, expiry, overrideReason: null } on USE.
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
    this.confirm();   // one tap applies the batch — no reason, no second confirm
  }

  confirm() {
    const row = this.rows.find(r => r.batchLot === this.chosen);
    if (!row) { return; }
    this.dismissWith(row, null);
  }

  private dismissWith(row: any, overrideReason: string | null) {
    this.modalController.dismiss({
      batchLot: row.batchLot,
      expiry: row.expiry,
      overrideReason,
    }, 'use');
  }

  dismiss() { this.modalController.dismiss(null, 'cancel'); }
}
