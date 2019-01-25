import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService extends BaseService { 

  private readonly API_DOCTOR = `${environment.BASE_URL}doctor`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getDoctorById(id: String) : Observable<any> {
    const url = `${this.API_DOCTOR}/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getApprovedDoctors() : Observable<any> {
    return this.http.get(this.API_DOCTOR + "/approved", this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }

  getUnApprovedDoctors() : Observable<any> {
    return this.http.get(this.API_DOCTOR+"/unapproved", this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  
  updateDoctorPermission(id: string, data): Observable<any> {
    const url = `${this.API_DOCTOR}/${id}/update-permission`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
