import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacDatePickerModule } from 'src/app/shared/vac-datepicker/vac-datepicker.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MatInputModule } from '@angular/material/input';

import { BirthdayAlertPage } from './birthday-alert.page';
import { Downloader } from '@ionic-native/downloader/ngx';

const routes: Routes = [
  {
    path: '',
    component: BirthdayAlertPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    VacDatePickerModule,
    
    MatInputModule,
    
    ReactiveFormsModule
  ],
  providers: [
      Downloader
   ],
  declarations: [BirthdayAlertPage]
})
export class BirthdayAlertPageModule {}
