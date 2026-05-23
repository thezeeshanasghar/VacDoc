import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AdjustStockPage } from './adjust-stock.page';

const routes: Routes = [
  { path: '', component: AdjustStockPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AdjustStockPage]
})
export class AdjustStockPageModule {}
