import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  protected httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  protected httpOptionsfile = {
    headers: new HttpHeaders({ 'Content-Type': 'blob' })
  };
  constructor(
    protected http: HttpClient
  ) { }

  protected handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occured', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    const MAX_LENGTH = 200;
    let displayError = error.error.substring(0, MAX_LENGTH);
    if (error.error.length > MAX_LENGTH) {
      displayError += '... (Error message truncated)';
    }
    return throwError('Something bad happened; please try again later. ' + displayError);
  }

  protected extractData(res: Response) {
    console.log(res);
    let body = res;
    return body || {};
  }
}
