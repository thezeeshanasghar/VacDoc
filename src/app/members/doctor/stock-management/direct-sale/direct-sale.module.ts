import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { DirectSalePage } from './direct-sale.page';

const routes: Routes = [{ path: '', component: DirectSalePage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes),
    MatFormFieldModule, MatSelectModule, MatInputModule],
  declarations: [DirectSalePage]
})
export class DirectSalePageModule {}
