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
  { 
    path: 'add', 
    loadChildren: () => import('./add/add.module').then(m => m.AddPageModule) 
  },
  { 
    path: 'edit/:id', 
    loadChildren: () => import('./edit/edit.module').then(m => m.EditPageModule) 
  }
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
