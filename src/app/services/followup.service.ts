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

  getFollowupChild1(Id: number,date:string): Observable<any> {
    const url = `${this.API_ALERT}followup/doctor/${Id}?inputDate=${date}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendFollowupMails(Id: number): Observable<any> {
    const url = `${this.API_ALERT}FollowUp/followupmail/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  
  getFollowupChild(followupId: number, Id: number,date:string): Observable<any> {
    const url = `${this.API_ALERT}followup/alert/${followupId}/${Id}?inputDate=${date}`;
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
  updateFollowupById(id: number, data: any): Observable<any> {
    const url = `${this.API_ALERT}followup/${id}`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }  
  deleteFollowupById(id: number): Observable<any> {
    const url = `${this.API_ALERT}followup/${id}`;
    return this.http
      .delete(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }  
  downloadFollowUpPdf(childId: number): Observable<Blob> {
    debugger
    const url = `${this.API_ALERT}FollowUp/Follow-Up-PDF?childId=${childId}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
        catchError(this.handleError)
    );
  }
}
