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

  private readonly API_LOGIN = `${environment.BASE_URL}user/login`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  checkAuth(data): Observable<any> {
    return this.http.post(this.API_LOGIN, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
