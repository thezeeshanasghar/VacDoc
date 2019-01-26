import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClinicService extends BaseService {

  private readonly API_CLINIC = `${environment.BASE_URL}doctor/`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getClinic(id: String) : Observable<any> {
    const url = `${this.API_CLINIC}/${id}/clinics`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }
}