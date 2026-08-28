import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { PnlPage } from './pnl.page';

const routes: Routes = [
  { path: '', component: PnlPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [PnlPage]
})
export class PnlPageModule {}
