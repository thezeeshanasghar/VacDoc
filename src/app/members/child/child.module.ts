import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ChildPage } from './child.page';

const routes: Routes = [
  {
    path: '',
    component: ChildPage
  },
  { 
    path: 'add', 
    loadChildren: () => import('./add/add.module').then(m => m.AddPageModule) 
  },
  { 
    path: 'unapprove', 
    loadChildren: () => import('./unapprove/unapprove.module').then(m => m.UnapprovePageModule) 
  },
  { 
    path: 'edit/:id', 
    loadChildren: () => import('./edit/edit.module').then(m => m.EditPageModule) 
  },
  { 
    path: 'vaccine/:id', 
    loadChildren: () => import('./vaccine/vaccine.module').then(m => m.VaccinePageModule) 
  },
  { 
    path: 'followup/:id', 
    loadChildren: () => import('./followup/followup.module').then(m => m.FollowupPageModule) 
  },
  { 
    path: 'growth', 
    loadChildren: () => import('./growth/growth.module').then(m => m.GrowthPageModule) 
  },
  { 
    path: 'invoice/:id', 
    loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoicePageModule) 
  },
  { 
    path: 'cmsg/:id', 
    loadChildren: () => import('./cmsg/cmsg.module').then(m => m.CMsgPageModule) 
  },
  {
    path: 'special/:id',
    loadChildren: () => import('./specialCase/specialCase.module').then(m => m.SpecialCasePageModule)
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ChildPage]
})
export class ChildPageModule { }
