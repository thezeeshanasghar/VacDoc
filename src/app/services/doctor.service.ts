import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService extends BaseService {

  private readonly API_DOCTOR = `${environment.BASE_URL}doctor`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getDoctorProfile(docId: number): Observable<any> {
    const url = `${this.API_DOCTOR}/${docId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  changeValidity(newDate: String, docID: number): any {
    let data = JSON.stringify({ ID: docID, ValidUpto: newDate })
    const url = `${this.API_DOCTOR}/${docID}/validUpto`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

}
