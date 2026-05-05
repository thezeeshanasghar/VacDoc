import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SupplierLedgerPage } from './supplier-ledger.page';

const routes: Routes = [{ path: '', component: SupplierLedgerPage }];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [SupplierLedgerPage]
})
export class SupplierLedgerPageModule {}
