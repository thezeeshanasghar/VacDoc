import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ChildSceduleEditPage2 } from './sceduleedit2.page';

const routes: Routes = [
  {
    path: '',
    component: ChildSceduleEditPage2
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [ChildSceduleEditPage2]
})
export class ChildSceduleEditPageModule2 {}
