import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService extends BaseService {

  private readonly API_LOGIN = `${environment.BASE_URL}user/`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  checkAuth(data): Observable<any> {
    const url = `${this.API_LOGIN}login`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  forgotPassword(data): Observable<any> {
    const url = `${this.API_LOGIN}forgot-password`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
