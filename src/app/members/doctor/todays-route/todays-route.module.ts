import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { TodaysRoutePage } from './todays-route.page';

const routes: Routes = [{ path: '', component: TodaysRoutePage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [TodaysRoutePage]
})
export class TodaysRoutePageModule {}
