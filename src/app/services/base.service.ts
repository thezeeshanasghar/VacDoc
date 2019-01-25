import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  protected httpOptions = {
    headers : new HttpHeaders({'Content-Type':'application/json'})
  };
  constructor(
    protected http: HttpClient
  ) { }

  protected handleError(error: HttpErrorResponse) {
    if(error.error instanceof ErrorEvent) {
      console.error('An error occured', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.' + error);
  }

  protected extractData(res: Response) {
    let body = res;
    return body || {};
  }
}
