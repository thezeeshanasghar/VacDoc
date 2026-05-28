import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaPaymentAuditPage } from './pa-payment-audit.page';

const routes: Routes = [{ path: '', component: PaPaymentAuditPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaPaymentAuditPage]
})
export class PaPaymentAuditPageModule {}
