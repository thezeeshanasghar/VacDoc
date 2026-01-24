import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class PaService extends BaseService {
  private readonly API_PA = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  } 

  signUpPersonalAssistant(data: any): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/signup`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in signUpPersonalAssistant:', error);
        throw error;
      })
    );
  }

//   getPa(Id: string): Observable<any> {
//     const url = `${this.API_SCHEDULE}PersonalAssistant/${Id}`;
//     return this.http.get(url, this.httpOptions).pipe(
//       map(this.extractData),
//       catchError(this.handleError)
//     );
//   }
  getPa(id: string): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  getPaaccess(id: string): Observable<any> {
    const url = `${this.API_PA}PAAccess/doctor/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  getPaAll(): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  addPAAccess(data: any): Observable<any> {
    const url = `${this.API_PA}PAAccess`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in addPAAccess:', error);
        throw error;
      })
    );
  }

  editPa(id: String,data): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${id}`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getPaClinics(Id: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/clinics/${Id}`;
    return this.http.get<any>(url);
  }

  // getPaByDoctorId(id: string): Observable<any> {
  //   const url = `${this.API_SCHEDULE}PersonalAssistant/by-doctor/${id}`;
  //   return this.http.get(url, this.httpOptions).pipe(
  //     map((response: any) => response),
  //     catchError((error) => {
  //       console.error('Error in getPa:', error);
  //       throw error;
  //     })
  //   );
  // }
  getPAsByDoctorId(doctorId: string): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error fetching PAs by Doctor ID:', error);
        throw error;
      })
    );
  }

  deleteAccess(accessId: number): Observable<any> {
    const url = `${this.API_PA}PAAccess/${accessId}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
 
   deletePA(Id: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${Id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  updatePaClinicOnlineStatus(paAccessId: number, isOnline: boolean): Observable<any> {
    const url = `${this.API_PA}PAAccess/${paAccessId}/isonline`;
    return this.http.put(url, isOnline, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in updatePaClinicOnlineStatus:', error);
        throw error;
      })
    );
  }

//   putDoctorSchedule(data): Observable<any> {
//     const url = `${this.API_SCHEDULE}doctorschedule`;
//     return this.http
//       .put(url, data, this.httpOptions)
//       .pipe(catchError(this.handleError));
//   }
}
