import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClinicService extends BaseService {

  private readonly API_DOC = `${environment.BASE_URL}doctor/`
  private readonly API_CLINIC = `${environment.BASE_URL}clinic/`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getClinics(id: number): Observable<any> {
    const url = `${this.API_DOC}${id}/clinics`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  getClinicById(id: string): Observable<any> {
    const url = `${this.API_CLINIC}${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addClinic(data): Observable<any> {
    const url = `${this.API_CLINIC}`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteClinic(id: string): Observable<any> {
    const url = `${this.API_CLINIC}${id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  changeOnlineClinic(data: any): Observable<any> {
    const url = `${this.API_CLINIC}editClinic`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

}
