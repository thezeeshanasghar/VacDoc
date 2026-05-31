import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ChartsModule } from "ng2-charts";
import { DataPage } from "./data/data.page";

const routes: Routes = [
  { path: '', component: DataPage },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ChartsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DataPage]
})
export class AnalyticsPageModule {}
