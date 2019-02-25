import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ClinicPage } from './clinic.page';

const routes: Routes = [
  {
    path: '',
    component: ClinicPage
  },
  { path: 'add', loadChildren: 'src/app/members/doctor/clinic/add/add.module#AddPageModule' },
  { path: 'edit/:id', loadChildren: 'src/app/members/doctor/clinic/edit/edit.module#EditPageModule' }

];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClinicPage]
})
export class ClinicPageModule {}
