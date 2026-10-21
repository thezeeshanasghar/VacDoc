import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CashHandoverPage } from './cash-handover.page';
import { SharedModule } from '../../../../shared/shared.module';

const routes: Routes = [{ path: '', component: CashHandoverPage }];

@NgModule({
  imports: [
    SharedModule,CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [CashHandoverPage]
})
export class CashHandoverPageModule {}
