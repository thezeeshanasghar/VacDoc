import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseBillsPage } from './purchase-bills.page';

const routes: Routes = [
  { path: '', component: PurchaseBillsPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PurchaseBillsPage]
})
export class PurchaseBillsPageModule {}
