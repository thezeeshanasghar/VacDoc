import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { LoginService } from '../services/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private loginservice: LoginService,
    private route: Router,
    private storage: Storage
  ) { }

  async canActivate(): Promise<boolean> {
    if (this.loginservice.isAuthenticated()) {
      return true;
    }

    // On a cold/hard navigation, LoginService's in-memory state hasn't been
    // populated yet (AppComponent's storage read is async and hasn't resolved).
    // Fall back to checking storage directly before deciding to redirect.
    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (doctorId) {
      this.loginservice.changeState(true);
      return true;
    }

    this.route.navigate(['login']);
    return false;
  }
}
