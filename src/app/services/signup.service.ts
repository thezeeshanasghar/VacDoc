import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class SignupService extends BaseService {

  private readonly API_SCHEDULE = `${environment.BASE_URL}`

  personalData: any;
  clinicData: any;
  vaccineData: any;
  constructor(
    protected http: HttpClient
  ) { super(http); }

  clientData() {
    console.log(this.personalData);
    console.log(this.clinicData);
    console.log(this.vaccineData);
  }
}