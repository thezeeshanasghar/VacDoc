import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class AlertService extends BaseService {

  private readonly API_ALERT = `${environment.BASE_URL}`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getLast5DaysChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/alert/-5/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getTodayChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/alert/0/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getNext5DaysChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/alert/5/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendIndividualAlertMsg_Last5Days_Child(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/individual-sms-alert/-5/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendIndividualAlertMsg_Today_Child(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/individual-sms-alert/0/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendIndividualAlertMsg_Next5Days_Child(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/individual-sms-alert/5/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

}
