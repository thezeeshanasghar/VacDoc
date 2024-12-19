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
      { 
        path: 'follow-up', 
        loadChildren: () => import('./follow-up/follow-up.module').then(m => m.FollowUpPageModule) 
      },
      { 
        path: 'vaccine-alert', 
        loadChildren: () => import('./vaccine-alert/vaccine-alert.module').then(m => m.VaccineAlertPageModule) 
      },
      { 
        path: 'birthday-alert', 
        loadChildren: () => import('./birthday-alert/birthday-alert.module').then(m => m.BirthdayAlertPageModule)
      }
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
