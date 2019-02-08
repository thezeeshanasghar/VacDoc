import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ChildPage } from './child.page';

const routes: Routes = [
  {
    path: '',
    component: ChildPage
  },
  { path: 'add', loadChildren: './add/add.module#AddPageModule' },
  { path: 'vaccine', loadChildren: './vaccine/vaccine.module#VaccinePageModule' },
  { path: 'followup', loadChildren: './followup/followup.module#FollowupPageModule' },
  { path: 'growth', loadChildren: './growth/growth.module#GrowthPageModule' },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ChildPage]
})
export class ChildPageModule {}
