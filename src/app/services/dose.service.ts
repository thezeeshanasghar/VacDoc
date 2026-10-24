import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoseService extends BaseService {

  private readonly API_DOSE = `${environment.BASE_URL}dose`
  private readonly API_schedule = `${environment.BASE_URL}doctorschedule`
  private readonly API_schedule1 = `${environment.BASE_URL}schedule`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getDoses(): Observable<any> {
    const url = `${this.API_DOSE}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  getDosesSpecial(): Observable<any> {
    const url = `${this.API_DOSE}/special`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getNewDoses(id): Observable<any> {
    const url = `${this.API_DOSE}/newdoctor/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  

  getNewDosesChild(id): Observable<any> {
    const url = `${this.API_DOSE}/newchild/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  getNewDosesChild2(id): Observable<any> {
    const url = `${this.API_DOSE}/newchild2/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  getDosesChild(id): Observable<any> {
    const url = `${this.API_DOSE}/doses/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addScheduleDose(data): Observable<any> {
    const url = `${this.API_schedule}`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Travel quick select: a doctor's up-to-4 common travel doses.
  getTravelQuick(doctorId): Observable<any> {
    const url = `${environment.BASE_URL}travelquick/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  saveTravelQuick(doctorId, doseIds): Observable<any> {
    const url = `${environment.BASE_URL}travelquick/${doctorId}`;
    return this.http
      .put(url, doseIds, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Custom (Customize) quick select: a doctor's up-to-4 common doses. Independent of Travel.
  getCustomQuick(doctorId): Observable<any> {
    const url = `${environment.BASE_URL}customquick/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  saveCustomQuick(doctorId, doseIds): Observable<any> {
    const url = `${environment.BASE_URL}customquick/${doctorId}`;
    return this.http
      .put(url, doseIds, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  addScheduleDoseChild(data): Observable<any> {
    const url = `${this.API_schedule1}`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // updateDoctorProfile(docId: number, newDate: String): any {
  //   const url = `${this.API_DOCTOR}/${docId}`;
  //   return this.http.put(url, newDate, this.httpOptions)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

}
