import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VaccinePage } from './vaccine.page';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
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
    FileTransfer, FileTransferObject,
    File, FileOpener , FilePath , DocumentViewer
  ],
})
export class VaccinePageModule {}
