import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MembersPage } from './members.page';

const routes: Routes = [
  {
    path: '',
    component: MembersPage,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule) 
      },
      { 
        path: 'alert', 
        loadChildren: () => import('./alert/alert.module').then(m => m.AlertPageModule) 
      },
      { 
        path: 'doctor', 
        loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorPageModule) 
      },
      { 
        path: 'child', 
        loadChildren: () => import('./child/child.module').then(m => m.ChildPageModule) 
      },
      {
        path: 'message',
        loadChildren: () => import('./message/message.module').then(m => m.MessagePageModule)
      },
      {
        path: 'bookings',
        loadChildren: () => import('./bookings/bookings.module').then(m => m.BookingsPageModule)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsPageModule)
      },
      {
        path: 'pa/assignments',
        loadChildren: () => import('./pa/assignments/assignments.module').then(m => m.AssignmentsPageModule)
      },
      // Retired — Payables merged into pa/assignments (one list: new/given/invoiced/
      // pending-handover/completed, filtered only by Today/Upcoming/All). Redirect
      // rather than delete, in case anything (an old bookmark, a stale notification
      // deep-link) still points here.
      {
        path: 'pa/payables',
        redirectTo: 'pa/assignments'
      },
      {
        path: 'pa/profile',
        loadChildren: () => import('./pa/profile/profile.module').then(m => m.PaProfilePageModule)
      },
      {
        path: 'manager/profile',
        loadChildren: () => import('./manager/profile/profile.module').then(m => m.ManagerProfilePageModule)
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MembersRoutingModule { }
