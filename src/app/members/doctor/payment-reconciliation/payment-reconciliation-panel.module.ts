import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../../shared/shared.module';
import { PaymentReconciliationPanelComponent } from './payment-reconciliation-panel.component';

// Payment reconciliation as a panel, hosted by the "Cash" tab of PA Assignment Tracking.
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedModule],
  declarations: [PaymentReconciliationPanelComponent],
  exports: [PaymentReconciliationPanelComponent]
})
export class PaymentReconciliationPanelModule {}
