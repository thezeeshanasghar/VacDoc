import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';
import { Storage } from "@ionic/storage";


@Injectable({
  providedIn: 'root'
})
export class DoctorService extends BaseService {
  doctor: any;
  private readonly API_DOCTOR = `${environment.BASE_URL}doctor`
  private readonly RESOURCE_URL = `${environment.RESOURCE_URL}`
  constructor(
    protected http: HttpClient, private storage: Storage
  ) {
    super(http);
  }
  forgotPassword(data): Observable<any> {
    const url = `${this.RESOURCE_URL}forget`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getDoctorProfile(docId: number): Observable<any> {
    const url = `${this.API_DOCTOR}/${docId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  updateDoctorProfile(docId: number, newDate: String): any {
    const url = `${this.API_DOCTOR}/${docId}`;
    return this.http.put(url, newDate, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

}
