import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaEntryPage } from './pa-entry.page';

const routes: Routes = [
  { path: '', component: PaEntryPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaEntryPage]
})
export class PaEntryPageModule {}
