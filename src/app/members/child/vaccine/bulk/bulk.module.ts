import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { VacDatePickerModule } from 'src/app/shared/vac-datepicker/vac-datepicker.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";

import { IonicModule } from "@ionic/angular";

import { BulkPage } from "./bulk.page";
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

const routes: Routes = [
  {
    path: "",
    component: BulkPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    VacDatePickerModule,
    ReactiveFormsModule,
    
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  declarations: [BulkPage]
})
export class BulkPageModule {}
