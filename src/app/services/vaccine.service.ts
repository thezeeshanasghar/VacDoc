import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class VaccineService extends BaseService {

  private readonly API_VACCINE = `${environment.BASE_URL}vaccine`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  addVaccine(data): Observable<any> {
    return this.http.post(this.API_VACCINE, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  editVaccine(id: string, data): Observable<any> {
    const url = `${this.API_VACCINE}/${id}`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteVaccine(id: string): Observable<any> {
    const url = `${this.API_VACCINE}/${id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVaccines() : Observable<any> {
    return this.http.get(this.API_VACCINE, this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }

  getVaccineById(id: String) : Observable<any> {
    const url = `${this.API_VACCINE}/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  
  getDosesByVaccineId(vaccineId: String) : Observable<any> {
    const url = `${this.API_VACCINE}/${vaccineId}/dosses`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }

  getBrandsByVaccineId(vaccineId: String) : Observable<any> {
    const url = `${this.API_VACCINE}/${vaccineId}/brands`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData), 
      catchError(this.handleError)
    );
  }

}
