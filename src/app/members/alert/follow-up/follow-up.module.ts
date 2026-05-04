import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacDatePickerModule } from 'src/app/shared/vac-datepicker/vac-datepicker.module';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { MatInputModule } from '@angular/material/input';

import { IonicModule } from '@ionic/angular';
import { Downloader } from '@ionic-native/downloader/ngx';
import { FollowUpPage } from './follow-up.page';

const routes: Routes = [
  {
    path: '',
    component: FollowUpPage
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
    
  ],
  declarations: [FollowUpPage],
  providers: [
    Downloader
 ],
})
export class FollowUpPageModule {}
