import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class ManagerService extends BaseService {
  private readonly API_MANAGER = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  signUpManager(data: any): Observable<any> {
    const url = `${this.API_MANAGER}Manager/signup`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in signUpManager:', error);
        throw error;
      })
    );
  }

  getManager(id: string): Observable<any> {
    const url = `${this.API_MANAGER}Manager/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getManager:', error);
        throw error;
      })
    );
  }

  getManagersByDoctorId(doctorId: string): Observable<any> {
    const url = `${this.API_MANAGER}Manager/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error fetching Managers by Doctor ID:', error);
        throw error;
      })
    );
  }

  getManagerAccess(doctorId: string): Observable<any> {
    const url = `${this.API_MANAGER}ManagerAccess/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getManagerAccess:', error);
        throw error;
      })
    );
  }

  addManagerAccess(data: any): Observable<any> {
    const url = `${this.API_MANAGER}ManagerAccess`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in addManagerAccess:', error);
        throw error;
      })
    );
  }

  deleteAccess(accessId: number): Observable<any> {
    const url = `${this.API_MANAGER}ManagerAccess/${accessId}`;
    return this.http.delete(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  getManagerClinics(id: number): Observable<any> {
    const url = `${this.API_MANAGER}Manager/clinics/${id}`;
    return this.http.get<any>(url);
  }

  deleteManager(id: number): Observable<any> {
    const url = `${this.API_MANAGER}Manager/${id}`;
    return this.http.delete(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  updateManagerProfile(managerId: number, data: { Name: string; Email: string; ProfileImage?: string }): Observable<any> {
    const url = `${this.API_MANAGER}Manager/${managerId}/profile`;
    return this.http.put(url, data, this.httpOptions).pipe(catchError(this.handleError));
  }

  toggleManagerActive(managerId: number): Observable<any> {
    const url = `${this.API_MANAGER}Manager/${managerId}/toggle-active`;
    return this.http.put(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  toggleManagerVerify(managerId: number): Observable<any> {
    const url = `${this.API_MANAGER}Manager/${managerId}/toggle-verify`;
    return this.http.put(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  getManagerPermissions(managerId: number): Observable<any> {
    const url = `${this.API_MANAGER}ManagerPermission/${managerId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  updateManagerPermissions(managerId: number, data: any): Observable<any> {
    const url = `${this.API_MANAGER}ManagerPermission/${managerId}`;
    return this.http.put(url, data, this.httpOptions).pipe(catchError(this.handleError));
  }
}
