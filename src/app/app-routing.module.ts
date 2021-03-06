import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: './public/login/login.module#LoginPageModule' },
  { path: 'signup', loadChildren: './public/signup/signup.module#SignupPageModule' },
  { path: 'forget', loadChildren: './public/forget/forget.module#ForgetPageModule' },
  {
    path: 'members',
    canActivate: [AuthGuard],
    loadChildren: './members/members.module#MembersPageModule'
  },
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
