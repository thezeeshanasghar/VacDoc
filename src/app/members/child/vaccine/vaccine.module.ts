import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VaccinePage } from './vaccine.page';

import { Downloader} from '@ionic-native/downloader/ngx';
//import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
const routes: Routes = [
  {
    path: '',
    component: VaccinePage
  },
  { path: 'fill/:id', loadChildren: './fill/fill.module#FillPageModule' },
  { path: 'bulk/:childId', loadChildren: './bulk/bulk.module#BulkPageModule' },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [VaccinePage],
  providers: [
     Downloader
  ],
})
export class VaccinePageModule {}
