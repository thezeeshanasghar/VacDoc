import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends BaseService {

  private readonly API = `${environment.BASE_URL}notification`;

  // Emits whenever read-state changes (mark one / mark all) so the shell's
  // sidebar badge — fetched once at load — can re-sync without a page reload.
  readonly unreadCountChanged$ = new Subject<void>();

  constructor(protected http: HttpClient) { super(http); }

  getByDoctor(doctorId: number): Observable<any> {
    return this.http.get(this.API + '/doctor/' + doctorId, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getUnreadCount(doctorId: number): Observable<any> {
    return this.http.get(this.API + '/doctor/' + doctorId + '/unread-count', this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  markRead(notifId: number): Observable<any> {
    return this.http.put(this.API + '/' + notifId + '/read', {}, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  markAllReadDoctor(doctorId: number): Observable<any> {
    return this.http.put(this.API + '/doctor/' + doctorId + '/read-all', {}, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
}
