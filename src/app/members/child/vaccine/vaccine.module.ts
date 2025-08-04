import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VaccinePage } from './vaccine.page';

import { Downloader} from '@ionic-native/downloader/ngx';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatFormFieldModule , MatInputModule } from '@angular/material';
//import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
const routes: Routes = [
  {
    path: '',
    component: VaccinePage
  },
  { path: 'afterfill/:id', loadChildren: () => import('./afterfill/afterfill.module').then(m => m.AfterFillPageModule) },
  { path: 'fill/:id', loadChildren: () => import('./fill/fill.module').then(m => m.FillPageModule) },
  { path: 'bulk/:childId', loadChildren: () => import('./bulk/bulk.module').then(m => m.BulkPageModule) },
  { path: 'bulkinvoice/:childId', loadChildren: () => import('./bulkinvoice/bulkinvoice.module').then(m => m.BulkInvoicePageModule) },
  { path: "edit", loadChildren: () => import('./edit/scheduleedit.module').then(m => m.ChildSceduleEditPageModule) },
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
  declarations: [VaccinePage],
  providers: [
     Downloader
  ],
})
export class VaccinePageModule {}
