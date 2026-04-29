import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdjustHistoryPage } from './adjust-history.page';

const routes: Routes = [{ path: '', component: AdjustHistoryPage }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    MatSelectModule,
    MatFormFieldModule,
  ],
  declarations: [AdjustHistoryPage]
})
export class AdjustHistoryPageModule {}
