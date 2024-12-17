import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { VaccineAlertPage } from './vaccine-alert.page';
import { Downloader} from '@ionic-native/downloader/ngx';

const routes: Routes = [
  {
    path: '',
    component: VaccineAlertPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  declarations: [VaccineAlertPage],
  providers: [
    Downloader
 ],
})
export class VaccineAlertPageModule {}
