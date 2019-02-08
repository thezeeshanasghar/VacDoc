import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClinicService extends BaseService {

  private readonly API_CLINIC = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getClinic(id: String) : Observable<any> {
    const url = `${this.API_CLINIC}doctor/${id}/clinics`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }

  changeOnlineClinic(data): Observable<any> {
    const url = `${this.API_CLINIC}clinic/editClinic/`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}