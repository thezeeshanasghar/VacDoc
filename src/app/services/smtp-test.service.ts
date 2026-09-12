import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SmtpTestService extends BaseService {

  private readonly API_SMTP_TEST = `${environment.BASE_URL}SmtpTest/send`;

  constructor(
    protected http: HttpClient
  ) { super(http); }

  sendTestEmail(data): Observable<any> {
    return this.http.post(this.API_SMTP_TEST, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
