import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class DashboardService extends BaseService {
  private readonly API_DASHBOARD = `${environment.BASE_URL}` + 'Dashboard';

  constructor(protected http: HttpClient) {
    super(http);
  }

  getCombinedDashboardData(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/combined-data/${doctorId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getAnalyticsData(doctorId: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/analytics/${doctorId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
}