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

  // Combined call for the members shell (menu) + dashboard page.
  // userType: "DOCTOR" (id = DoctorId) or "PA" (id = PersonalAssistantId)
  getShellData(userType: string, id: number): Observable<any> {
    const url = `${this.API_DASHBOARD}/shell-data/${userType}/${id}`;
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

  getAdvancedAnalytics(
    doctorId: number,
    clinicId: number,
    from: string,
    to: string,
    compareFrom: string,
    compareTo: string
  ): Observable<any> {
    const url = `${this.API_DASHBOARD}/advanced?doctorId=${doctorId}&clinicId=${clinicId}&from=${from}&to=${to}&compareFrom=${compareFrom}&compareTo=${compareTo}`;
    return this.http.get<any>(url).pipe(catchError(this.handleError));
  }
}