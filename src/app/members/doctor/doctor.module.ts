import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { DoctorPage } from "./doctor.page";

const routes: Routes = [
  {
    path: "",
    component: DoctorPage
  },
  { 
    path: "clinic", 
    loadChildren: () => import('./clinic/clinic.module').then(m => m.ClinicPageModule) 
  },
  {
    path: "profile",
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: "vacation",
    loadChildren: () => import('./vacation/vacation.module').then(m => m.VacationPageModule)
  },
  {
    path: "schedule",
    loadChildren: () => import('./schedule/schedule.module').then(m => m.SchedulePageModule)
  },
  {
    path: "brand-amount",
    loadChildren: () => import('./brand-amount/brand-amount.module').then(m => m.BrandAmountPageModule)
  },
  {
    path: "password",
    loadChildren: () => import('./password/password.module').then(m => m.PasswordPageModule)
  },
  {
    path: "sms-setting",
    loadChildren: () => import('./sms-setting/sms-setting.module').then(m => m.SMSSettingPageModule)
  },
  {
    path: "stock-management",
    loadChildren: () => import('./stock-management/stock-management.module').then(m => m.StockManagementPageModule)
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DoctorPage]
})
export class DoctorPageModule {}
