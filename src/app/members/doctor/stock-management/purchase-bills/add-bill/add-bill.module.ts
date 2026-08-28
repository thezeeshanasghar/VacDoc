import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../../shared/shared.module';
import { AddBillPage } from './add-bill.page';

const routes: Routes = [
  { path: '', component: AddBillPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [AddBillPage]
})
export class AddBillPageModule {}
