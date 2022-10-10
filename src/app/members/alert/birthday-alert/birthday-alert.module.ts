import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BirthdayAlertPageRoutingModule } from './birthday-alert-routing.module';

import { BirthdayAlertPage } from './birthday-alert.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BirthdayAlertPageRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [BirthdayAlertPage]
})
export class BirthdayAlertPageModule {}
