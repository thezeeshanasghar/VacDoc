import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseListPage } from './expense-list.page';

const routes: Routes = [{ path: '', component: ExpenseListPage }];

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ExpenseListPage]
})
export class ExpenseListPageModule {}
