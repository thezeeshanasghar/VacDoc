import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VaccineService extends BaseService {

  private readonly API_VACCINE = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getVaccine(): Observable<any> {
    return this.http.get(this.API_VACCINE + 'vaccine', this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getVaccinationById(id: string): Observable<any> {
    const url = `${this.API_VACCINE}child/${id}/schedule`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  updateVaccinationDate(data): Observable<any> {
    const url = `${this.API_VACCINE}schedule/Reschedule?ignoreMaxAgeRule=false&ignoreMinAgeFromDOB=false&ignoreMinGapFromPreviousDose=false`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVaccineByVaccineId(id: string): Observable<any> {
    const url = `${this.API_VACCINE}schedule/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  fillUpChildVaccine(data): Observable<any> {
    const url = `${this.API_VACCINE}schedule/child-schedule`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
