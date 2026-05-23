import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { StockTransferPage } from './stock-transfer.page';

const routes: Routes = [
  { path: '', component: StockTransferPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [StockTransferPage]
})
export class StockTransferPageModule {}
