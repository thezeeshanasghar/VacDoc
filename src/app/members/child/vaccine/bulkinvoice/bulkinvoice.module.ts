import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";

import { IonicModule } from "@ionic/angular";

import { BulkInvoicePage } from "./bulkinvoice.page";
import { Downloader} from '@ionic-native/downloader/ngx';

const routes: Routes = [
  {
    path: "",
    component: BulkInvoicePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [BulkInvoicePage],
  providers: [
    Downloader
 ]
})
export class BulkInvoicePageModule {}
