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

  // updateDoctorProfile(docId: number, newDate: String): any {
  //   const url = `${this.API_DOCTOR}/${docId}`;
  //   return this.http.put(url, newDate, this.httpOptions)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

}
