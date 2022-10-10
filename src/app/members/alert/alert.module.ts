import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AlertPage } from './alert.page';

const routes: Routes = [
  {
    path: '',
    component: AlertPage,
    children: [
      { path: '', redirectTo: 'vaccine-alert', pathMatch: 'full' },
      { path: 'follow-up', loadChildren: './follow-up/follow-up.module#FollowUpPageModule' },
      { path: 'vaccine-alert', loadChildren: './vaccine-alert/vaccine-alert.module#VaccineAlertPageModule' },
      {path:'birthday-alert', loadChildren:'./birthday-alert/birthday-alert.module#BirthdayAlertPageModule'}

    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [AlertPage]
})
export class AlertPageModule { }
