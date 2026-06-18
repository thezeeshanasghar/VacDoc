import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VaccineEducationPage } from './vaccine-education.page';

const routes: Routes = [
  {
    path: '',
    component: VaccineEducationPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [VaccineEducationPage]
})
export class VaccineEducationPageModule {}
