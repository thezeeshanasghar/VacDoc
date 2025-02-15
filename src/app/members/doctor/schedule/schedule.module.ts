import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SchedulePage } from './schedule.page';

const routes: Routes = [
  {
    path: '',
    component: SchedulePage
  },
  { path: "edit", loadChildren: () => import('./edit/scheduleeditdoctor.module').then(m => m.SceduleEditPageModule) },
  { path: "addschedule", loadChildren: () => import('./addschedule/addschedule.module').then(m => m.AddschedulePageModule) }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [SchedulePage]
})
export class SchedulePageModule {}
