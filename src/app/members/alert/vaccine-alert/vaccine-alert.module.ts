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
// import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core'; // Needed for <mat-option>
// import { VaccineAlertPage } from './vaccine-alert.page';
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
    // MatDatepickerModule,
    MatFormFieldModule,
    // MatInputModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  declarations: [VaccineAlertPage],
  providers: [
    Downloader
 ],
})
export class VaccineAlertPageModule {}
