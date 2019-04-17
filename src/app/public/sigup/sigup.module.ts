import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SigupPage } from './sigup.page';
import { PinfoPage } from './pinfo/pinfo.page';

const routes: Routes = [
  {
    path: '',
    component: SigupPage,
  },
  { path: 'sigup', loadChildren: './sigup/sigup.module#SigupPageModule' },
  { path: 'pinfo', loadChildren: './pinfo/pinfo.module#PinfoPageModule' },
  { path: 'cinfo', loadChildren: './cinfo/cinfo.module#CinfoPageModule' },
  { path: 'vschedule', loadChildren: '.sigup/vschedule/vschedule.module#VschedulePageModule' },


];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SigupPage]
})
export class SigupPageModule { }
