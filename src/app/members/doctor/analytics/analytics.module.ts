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
