import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PersonalAssistantPage } from './personal-assistant.page';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';

const routes: Routes = [
  {
    path: '',
    component: PersonalAssistantPage
  },
  { 
    path: 'signup', 
    loadChildren: () => import('./pa/pa.module').then(m => m.PaPageModule) 
  },
  {
    path: 'access',
    loadChildren: () => import('./paacces/paaccess.module').then(m => m.PaAccessPageModule)
  },
  {
    path: 'edit/:paId',
    loadChildren: () => import('./edit-pa/edit-pa.module').then(m => m.EditPaPageModule)
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  declarations: [PersonalAssistantPage]
})
export class PersonalAssistantPageModule {}
