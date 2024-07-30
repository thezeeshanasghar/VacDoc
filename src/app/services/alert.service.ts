import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class AlertService extends BaseService {
  private readonly API_ALERT = `${environment.BASE_URL}` + 'schedule/';

  constructor(protected http: HttpClient) {
    super(http);
  }

  getChild(numOfDays: number, Id: String): Observable<any> {
    const url = `${this.API_ALERT}alert/${numOfDays}/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendAlertMsgToAll(numOfDays: number, clinicID: number): Observable<any> {
    const url = `${this.API_ALERT
      }alert/sms-alert/${numOfDays}/${clinicID}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendEmailToAll(numOfDays: number, clinicID: number): Observable<any> {
    const url = `${this.API_ALERT
      }alert2/${numOfDays}/${clinicID}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendIndividualAlertMsg(numOfDays: number, Id: String): Observable<any> {
    const url = `${this.API_ALERT
      }alert/individual-sms-alert/${numOfDays}/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendMsgsThroughDictionary(numOfDays: number, Id: String): Observable<any> {
    const url = `${this.API_ALERT}alert/send-msg/${numOfDays}/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
}
