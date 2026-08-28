import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../../shared/shared.module';
import { EditBillPage } from './edit-bill.page';

const routes: Routes = [{ path: '', component: EditBillPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [EditBillPage]
})
export class EditBillPageModule {}
