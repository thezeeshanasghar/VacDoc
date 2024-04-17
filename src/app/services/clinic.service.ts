import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Response } from "src/app/models/Response";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { Storage } from "@ionic/storage";

@Injectable({
  providedIn: "root"
})
export class ClinicService extends BaseService {
  uploadMonogram(formData: FormData) {
    throw new Error("Method not implemented.");
  }
  clinics: any;
  doctorId: any;
  OnlineClinicId: any;
  OnlineClinic: any;
  response: Response;

  private readonly API_DOC = `${environment.BASE_URL}doctor/`;
  private readonly API_CLINIC = `${environment.BASE_URL}clinic/`;

  constructor(protected http: HttpClient, private storage: Storage) {
    super(http);
    // this.loadclinics();
  }

   updateClinic(clinic) {
   this.OnlineClinic = clinic;
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

  putClinic(id: number, data): Observable<any> {
    const url = `${this.API_CLINIC}${id}`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

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
}
