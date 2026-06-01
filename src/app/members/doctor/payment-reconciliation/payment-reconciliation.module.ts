import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaymentReconciliationPage } from './payment-reconciliation.page';

const routes: Routes = [{ path: '', component: PaymentReconciliationPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaymentReconciliationPage]
})
export class PaymentReconciliationPageModule {}
