import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorSmtpService extends BaseService {

  private readonly API_DOCTOR_SMTP = `${environment.BASE_URL}DoctorSmtp`;

  constructor(
    protected http: HttpClient
  ) { super(http); }

  get(doctorId: number): Observable<any> {
    return this.http.get(`${this.API_DOCTOR_SMTP}/${doctorId}`, this.httpOptions)
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }

  save(doctorId: number, data: any): Observable<any> {
    return this.http.put(`${this.API_DOCTOR_SMTP}/${doctorId}`, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
