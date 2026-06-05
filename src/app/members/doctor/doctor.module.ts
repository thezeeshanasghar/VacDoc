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
    path: "password",
    loadChildren: () => import('./password/password.module').then(m => m.PasswordPageModule)
  },
  {
    path: "sms-setting",
    loadChildren: () => import('./sms-setting/sms-setting.module').then(m => m.SMSSettingPageModule)
  },
  {
    path: "analytics",
    loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsPageModule)
  },
  {
    path: "personal-assistant",
    loadChildren: () => import('./personal-assistant/personal-assistant.module').then(m => m.PersonalAssistantPageModule)
  },
  {
    path: "financial",
    loadChildren: () => import('./financial/financial.module').then(m => m.FinancialPageModule)
  },
  {
    path: "brand-prices",
    loadChildren: () => import('./brand-prices/brand-prices.module').then(m => m.BrandPricesPageModule)
  },
  {
    path: "stock-management",
    loadChildren: () => import('./stock-management/stock-management.module').then(m => m.StockManagementPageModule)
  },
  {
    path: "agent-module",
    loadChildren: () => import('./agent-module/agent-module.module').then(m => m.AgentModulePageModule)
  },
  {
    path: "payment-reconciliation",
    loadChildren: () => import('./payment-reconciliation/payment-reconciliation.module').then(m => m.PaymentReconciliationPageModule)
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
