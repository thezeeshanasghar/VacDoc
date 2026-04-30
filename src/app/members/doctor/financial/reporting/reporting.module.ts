import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ReportingPage } from './reporting.page';

const routes: Routes = [{ path: '', component: ReportingPage }];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule,
    RouterModule.forChild(routes), MatFormFieldModule, MatSelectModule, MatInputModule],
  declarations: [ReportingPage]
})
export class ReportingPageModule {}
