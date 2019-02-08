import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ChildService extends BaseService {

  private readonly API_CHILD = `${environment.BASE_URL}child`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  searchChild(name: String, city: String, dob: String): Observable<any> {
    const url = `${this.API_CHILD}/search?name=${name}&city=${city}&dob=${dob}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

}
