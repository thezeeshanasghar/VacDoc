import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ReportingPage } from './reporting.page';

const routes: Routes = [{ path: '', component: ReportingPage }];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule,
    RouterModule.forChild(routes)],
  declarations: [ReportingPage]
})
export class ReportingPageModule {}
