import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AfterFillPage } from './afterfill.page';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';
const routes: Routes = [
  {
    path: '',
    component: AfterFillPage
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
  declarations: [AfterFillPage]
})
export class AfterFillPageModule {}
