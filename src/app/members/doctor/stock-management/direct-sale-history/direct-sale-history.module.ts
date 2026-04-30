import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { DirectSaleHistoryPage } from './direct-sale-history.page';

const routes: Routes = [{ path: '', component: DirectSaleHistoryPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [DirectSaleHistoryPage]
})
export class DirectSaleHistoryPageModule {}
