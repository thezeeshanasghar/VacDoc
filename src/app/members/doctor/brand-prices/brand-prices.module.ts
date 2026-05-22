import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { BrandPricesPage } from './brand-prices.page';

const routes: Routes = [{ path: '', component: BrandPricesPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [BrandPricesPage]
})
export class BrandPricesPageModule {}
