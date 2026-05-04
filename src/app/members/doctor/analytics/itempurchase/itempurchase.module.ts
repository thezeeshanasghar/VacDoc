import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacDatePickerModule } from 'src/app/shared/vac-datepicker/vac-datepicker.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ItemPurchasePage } from './itempurchase.page';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';


const routes: Routes = [
  {
    path: '',
    component: ItemPurchasePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    
    MatAutocompleteModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ItemPurchasePage]
})
export class ItemPurchasePageModule {}