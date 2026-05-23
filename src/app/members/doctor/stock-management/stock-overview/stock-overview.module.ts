import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { StockOverviewPage } from './stock-overview.page';

const routes: Routes = [{ path: '', component: StockOverviewPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [StockOverviewPage]
})
export class StockOverviewPageModule {}
