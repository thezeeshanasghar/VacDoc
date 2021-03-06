import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class FollowupService extends BaseService {
  private readonly API_ALERT = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  getFollowupByChild(data): Observable<any> {
    const url = `${this.API_ALERT}child/followup`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  addFollowupByChild(data): Observable<any> {
    const url = `${this.API_ALERT}followup`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getFollowupChild(followupId: number, Id: number): Observable<any> {
    const url = `${this.API_ALERT}followup/alert/${followupId}/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendAlertMsgToAll(numOfDays: number, doctorId: number): Observable<any> {
    const url = `${
      this.API_ALERT
    }schedule/bulk-sms-alert/${numOfDays}/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  sendFollowupAlertMsgIndividual(Id: String): Observable<any> {
    const url = `${this.API_ALERT}followup/sms-alert/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
}
