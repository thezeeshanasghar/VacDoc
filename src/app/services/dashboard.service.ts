import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class DashboardService extends BaseService {
  private readonly API_DASHBOARD = `${environment.BASE_URL}` + 'Dashboard';

  constructor(protected http: HttpClient) {
    super(http);
  }

  getThisMonthChild(): Observable<any> {
    const url = `${this.API_DASHBOARD}`;
    console.log('API URL:', url);
    return this.http.get(url, this.httpOptions).pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }

  getTotalChildren(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  // NEW: Method to get total alerts count for the current month
  getDoctorAlerts(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/alerts?doctorId=${doctorId}`;
    console.log('API URL for Alerts:', url);
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getFutureAlerts(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/future-alerts?doctorId=${doctorId}`;
    console.log('API URL (Future Alerts):', url);
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getCurrentMonthGivenDoses(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/current-month-given-doses/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getCurrentMonthRevenue(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/current-month-revenue/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  
  
}
