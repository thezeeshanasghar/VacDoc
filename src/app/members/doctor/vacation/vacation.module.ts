import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VacationPage } from './vacation.page';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';

const routes: Routes = [
  {
    path: '',
    component: VacationPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  declarations: [VacationPage],
  providers:[{provide: MAT_DATE_LOCALE, useValue: { useUtc: true }}]
})
export class VacationPageModule {}
