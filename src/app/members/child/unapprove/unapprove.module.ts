import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { UnapprovePage } from './unapprove.page';

const routes: Routes = [
  {
    path: '',
    component: UnapprovePage
  },
  ];

import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [UnapprovePage]
})
export class UnapprovePageModule { }
