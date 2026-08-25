import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SignupPage } from './signup.page';

const routes: Routes = [
  {
    path: '',
    component: SignupPage,
    children: [
      { path: '', redirectTo: "step1", pathMatch: 'full' },
      {
        path: 'step1',
        loadChildren: () => import('./step1/step1.module').then(m => m.Step1PageModule)
      },
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
  declarations: [SignupPage]
})
export class SignupPageModule {}
