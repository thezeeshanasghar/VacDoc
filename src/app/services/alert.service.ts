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

  getTodayChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/alert/0/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getFollowupChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}followup/alert/0/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getIndividualMsgtoChild(Id: String): Observable<any> {
    const url = `${this.API_ALERT}schedule/individual-sms-alert/5/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

}
