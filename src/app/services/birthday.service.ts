import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class BirthdayService extends BaseService {
  private readonly API_ALERT = `${environment.BASE_URL}`;
  private readonly API_DOCTOR = `${environment.BASE_URL}doctor`

  constructor(protected http: HttpClient) {
    super(http);
  }
  getBirthdayAlert(date: String , Id: any): Observable<any> {
    const url = `${this.API_ALERT}birthday/${Id}?inputDate=${date}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  // Single-clinic-scoped fetch for the clinic filter (one call per accessible clinic,
  // merged client-side) — distinct from getBirthdayAlert's doctor-wide endpoint.
  getBirthdayAlertForClinic(clinicId: number, date: string, paId?: number, doctorId?: number): Observable<any> {
    let url = `${this.API_ALERT}Birthday/clinic-alert/${clinicId}?inputDate=${date}`;
    if (paId) url += `&paId=${paId}`;
    if (doctorId) url += `&doctorId=${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendEmailToAll(Id: number): Observable<any> {
    const url = `${this.API_ALERT
      }Birthday/birthdaymail/bulk/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  sendBirthdayMails(Id: number): Observable<any> {
    const url = `${this.API_ALERT}Birthday/birthdaymail/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  loadDoctorDetails(docId: number): Observable<any> {
    const url = `${this.API_DOCTOR}/${docId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  // Persists "birthday alert sent" (Child.LastBirthdayAlertSentAt) so the tick badge
  // survives reload/logout-login. Fire-and-forget after the WhatsApp deep link opens.
  markBirthdayAlertSent(childId: number): Observable<any> {
    const url = `${this.API_ALERT}Birthday/${childId}/mark-alert-sent`;
    return this.http.post(url, {}).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

}
