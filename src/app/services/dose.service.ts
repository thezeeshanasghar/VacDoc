import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoseService extends BaseService {

  private readonly API_DOSE = `${environment.BASE_URL}dose`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getDoseById(doseId: String): Observable<any> {
    const url = `${this.API_DOSE}/${doseId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addDose(data): Observable<any> {
    return this.http.post(this.API_DOSE, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  editDose(id: string, data): Observable<any> {
    const url = `${this.API_DOSE}/${id}`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteDose(id: string): Observable<any> {
    const url = `${this.API_DOSE}/${id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }



}
