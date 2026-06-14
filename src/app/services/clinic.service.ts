import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Response } from "src/app/models/Response";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, catchError, shareReplay, tap } from "rxjs/operators";
import { Storage } from "@ionic/storage";
import { DashboardService } from "./dashboard.service";

@Injectable({
  providedIn: "root"
})
export class ClinicService extends BaseService {
  clinics: any;
  doctorId: any;
  OnlineClinicId: any;
  OnlineClinic: any;
  response: Response;

  // Cached shell data (menu + dashboard counts/permissions) shared across
  // the members shell and dashboard page for the current session.
  private shellData$: Observable<any> = null;

  private readonly API_DOC = `${environment.BASE_URL}doctor/`;
  private readonly API_CLINIC = `${environment.BASE_URL}clinic/`;

  constructor(protected http: HttpClient, private storage: Storage, private dashboardService: DashboardService) {
    super(http);
    // Eagerly restore OnlineClinic from storage so all pages see it
    // even when navigating directly without going through the dashboard first.
    this.storage.get(environment.ON_CLINIC).then(clinic => {
      if (clinic && !this.OnlineClinic) {
        this.OnlineClinic = clinic;
        this.OnlineClinicId = clinic.Id;
      }
    });
  }

  // Returns cached shell data, fetching once and sharing the result with
  // any subsequent callers within the same session (until refreshShellData()).
  getShellData(userType: string, id: number): Observable<any> {
    if (!this.shellData$) {
      this.shellData$ = this.dashboardService.getShellData(userType, id).pipe(
        tap(res => {
          if (res && res.IsSuccess && res.ResponseData) {
            const data = res.ResponseData;
            if (data.OnlineClinic) {
              this.updateClinic(data.OnlineClinic);
            }
          }
        }),
        shareReplay(1)
      );
    }
    return this.shellData$;
  }

  // Forces the next getShellData() call to re-fetch (e.g. after permission changes or logout).
  refreshShellData() {
    this.shellData$ = null;
  }

  updateClinic(clinic) {
    this.OnlineClinic = clinic;
    if (clinic) {
      this.OnlineClinicId = clinic.Id;
      this.storage.set(environment.ON_CLINIC, clinic);
    }
  }

  getClinics(id: number): Observable<any> {
    const url = `${this.API_DOC}${id}/clinics`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  // getClinics(id: number): Observable<any> {
  //   const url = `${this.API_DOC}${id}/clinics`;
  //   var cli = this.http.get(url, this.httpOptions);
  //   cli.subscribe(
  //     resp => {
  //       if (resp) {
  //         this.clinics = (resp as Response).ResponseData;
  //         this.storage.set(environment.CLINICS, this.clinics);
  //         for (let i = 0; i < this.clinics.length; i++) {
  //           if (this.clinics[i].IsOnline == true) {
  //             this.OnlineClinicId = this.clinics[i].Id;
  //             this.OnlineClinic = this.clinics[i];
  //             this.storage.set(environment.CLINIC_Id, this.clinics[i].Id);
  //             this.storage.set(environment.ON_CLINIC, this.clinics[i]);
  //           }
  //         }
  //       }
  //     },
  //     () => {}
  //   );
  //   return cli;
  // }
  getClinicById(id: string): Observable<any> {
    const url = `${this.API_CLINIC}${id}`;
    return this.http
      .get(url, this.httpOptions)
      .pipe(map(this.extractData), catchError(this.handleError));
  }

  addClinic(data): Observable<any> {
    const url = `${this.API_CLINIC}`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  UpdateClinicAndTimings(id: number, data): Observable<any> {
    const url = `${environment.BASE_URL}ClinicTiming/api/clinic/update?clinicId=${id}`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  // https://localhost:5001/api/ClinicTiming/api/clinic/update?clinicId=32
  deleteClinic(id: string): Observable<any> {
    const url = `${this.API_CLINIC}${id}`;
    return this.http
      .delete(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  changeOnlineClinic(data: any): Observable<any> {
    const url = `${this.API_CLINIC}editClinic`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  transferPatients(fromClinicId: any, toClinicId: any): Observable<any> {
    const url = `${this.API_CLINIC}${fromClinicId}/transfer/${toClinicId}`;
    return this.http
      .post(url, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
