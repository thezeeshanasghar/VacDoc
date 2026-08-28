import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { PaAssignmentTrackingPage } from './pa-assignment-tracking.page';

const routes: Routes = [{ path: '', component: PaAssignmentTrackingPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [PaAssignmentTrackingPage]
})
export class PaAssignmentTrackingPageModule {}
