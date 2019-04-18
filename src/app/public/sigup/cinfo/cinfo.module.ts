import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CinfoPage } from './cinfo.page';
import { AddPage } from 'src/app/members/doctor/clinic/add/add.page';

const routes: Routes = [
  {
    path: '',
    component: CinfoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,

  ],
  providers: [

  ],
  declarations: [CinfoPage,
    AddPage
  ]
})
export class CinfoPageModule { }
