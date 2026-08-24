import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ManagerPage } from './manager.page';

const routes: Routes = [
  {
    path: '',
    component: ManagerPage
  },
  {
    path: 'signup',
    loadChildren: () => import('./manager-signup/manager-signup.module').then(m => m.ManagerSignupPageModule)
  },
  {
    path: 'edit/:managerId',
    loadChildren: () => import('./edit-manager/edit-manager.module').then(m => m.EditManagerPageModule)
  },
  {
    path: 'permissions/:managerId',
    loadChildren: () => import('./manager-permissions/manager-permissions.module').then(m => m.ManagerPermissionsPageModule)
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  declarations: [ManagerPage]
})
export class ManagerPageModule {}
