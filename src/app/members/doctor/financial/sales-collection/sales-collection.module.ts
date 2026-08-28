import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { SalesCollectionPage } from './sales-collection.page';

const routes: Routes = [
  { path: '', component: SalesCollectionPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [SalesCollectionPage]
})
export class SalesCollectionPageModule {}
