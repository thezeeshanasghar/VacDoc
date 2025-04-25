import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { LoginPAPageRoutingModule } from './loginpa-routing.module';

import { LoginPAPage } from './loginpa.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPAPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    LoginPAPageRoutingModule,
  ],
  declarations: [LoginPAPage]
})
export class LoginPAPageModule {}

