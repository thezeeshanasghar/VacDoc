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

  private readonly API_CHILD = `${environment.BASE_URL}`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getChild(Id: String): Observable<any> {
    const url = `${this.API_CHILD}doctor/${Id}/20/0/childs?searchKeyword=`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getChildById(Id: String): Observable<any> {
    const url = `${this.API_CHILD}child/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addChild(data): Observable<any> {
    const url = `${this.API_CHILD}child`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  editChild(data): Observable<any> {
    const url = `${this.API_CHILD}child/`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteChild(id: string): Observable<any> {
    const url = `${this.API_CHILD}child/${id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
}
