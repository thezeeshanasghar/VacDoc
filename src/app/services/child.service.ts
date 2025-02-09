import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ChildService extends BaseService {
  add: any;
  checkIfMobileExist(MobileNumber: any) {
    throw new Error("Method not implemented.");
  }
  private readonly API_CHILD = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getChild(Id: String, value): Observable<any> {
    const url = `${this.API_CHILD}doctor/${Id}/20/${value}/childs?searchKeyword=`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getChildByClinic(Id: String , page: number): Observable<any> {
    const url = `${this.API_CHILD}child/clinic/${Id}/${page}`;
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

  getChildByUserSearch(docId , page, value): Observable<any> {
    const url = `${this.API_CHILD}doctor/${docId}/${page}/childs?searchKeyword=${value}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  toggleChildActiveStatus(childId: number): Observable<any> {
    const apiUrl = `${this.API_CHILD}child/${childId}/toggle-active`;
    return this.http.put<any>(apiUrl, {}, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  downloadPdf(childId: number, options: any): Observable<HttpResponse<Blob>> {
    const apiUrl = `${this.API_CHILD}Child/PID/${childId}`;
    return this.http.get(apiUrl, {
      responseType: 'blob',
      observe: 'response',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }
}