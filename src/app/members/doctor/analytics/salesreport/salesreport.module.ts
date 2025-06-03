import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SalesReportPage } from './salesreport.page';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';


const routes: Routes = [
  {
    path: '',
    component: SalesReportPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SalesReportPage]
})
export class SalesReportPageModule {}