import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { FollowupPage } from './followup.page';

const routes: Routes = [
  {
    path: '',
    component: FollowupPage
  },
  { path: 'addfollowup', loadChildren: './addfollowup/addfollowup.module#AddfollowupPageModule' },
  { path: 'editfollowup/:id', loadChildren: './editfollowup/editfollowup.module#EditfollowupPageModule' },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [FollowupPage]
})
export class FollowupPageModule {}
