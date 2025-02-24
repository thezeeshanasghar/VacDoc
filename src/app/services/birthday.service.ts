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
  
}
