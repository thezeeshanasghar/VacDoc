import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacDatePickerModule } from 'src/app/shared/vac-datepicker/vac-datepicker.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MatInputModule } from '@angular/material/input';


import { AddfollowupPage } from './addfollowup.page';

const routes: Routes = [
  {
    path: '',
    component: AddfollowupPage
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
    
    MatInputModule
  ],
  declarations: [AddfollowupPage]
})
export class AddfollowupPageModule {}
