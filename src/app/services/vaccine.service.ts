import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { isMoment } from 'moment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VaccineService extends BaseService {

  private readonly API_VACCINE = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getVaccine() : Observable<any> {
    return this.http.get(this.API_VACCINE +'vaccine', this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
}
