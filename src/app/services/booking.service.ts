import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends BaseService {

  private readonly API = `${environment.BASE_URL}booking`;

  constructor(protected http: HttpClient) { super(http); }

  getByClinic(clinicId: number, status?: string, type?: string): Observable<any> {
    let url = this.API + '/clinic/' + clinicId;
    const params: string[] = [];
    if (status) { params.push('status=' + status); }
    if (type) { params.push('type=' + type); }
    if (params.length > 0) { url = url + '?' + params.join('&'); }
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getSingle(id: number): Observable<any> {
    return this.http.get(this.API + '/' + id, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  confirm(id: number, doctorComment: string): Observable<any> {
    return this.http.put(this.API + '/' + id + '/confirm', { DoctorComment: doctorComment }, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  cancel(id: number, doctorComment: string): Observable<any> {
    return this.http.put(this.API + '/' + id + '/cancel', { DoctorComment: doctorComment }, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addComment(id: number, doctorComment: string): Observable<any> {
    return this.http.put(this.API + '/' + id + '/comment', { DoctorComment: doctorComment }, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getPendingCount(clinicId: number): Observable<any> {
    return this.http.get(this.API + '/pending-count/' + clinicId, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
}
