import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { StockTransferPage } from './stock-transfer.page';
import { StockTransferConfirmComponent } from './stock-transfer-confirm.component';

const routes: Routes = [{ path: '', component: StockTransferPage }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  declarations: [StockTransferPage, StockTransferConfirmComponent],
  entryComponents: [StockTransferConfirmComponent]
})
export class StockTransferPageModule {}
