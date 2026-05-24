import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { DirectSalePage } from './direct-sale.page';

const routes: Routes = [
  { path: '', component: DirectSalePage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [DirectSalePage]
})
export class DirectSalePageModule {}
