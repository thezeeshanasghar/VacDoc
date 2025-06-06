import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AnalyticsPage } from "./analytics.page";

const routes: Routes = [
  {
    path: "",
    component: AnalyticsPage
  },
  { path: 'total', loadChildren: () => import('./total/total.module').then(m => m.TotalPageModule) },
  { path: 'salesreport', loadChildren: () => import('./salesreport/salesreport.module').then(m => m.SalesReportPageModule) },
  { path: 'data', loadChildren: () => import('./data/data.module').then(m => m.DataPageModule) },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [AnalyticsPage]
})
export class AnalyticsPageModule {}
