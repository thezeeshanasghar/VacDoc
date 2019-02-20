import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class BrandService extends BaseService {

  private readonly API_BRAND = `${environment.BASE_URL}`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  getBrandInventory(Id: String): Observable<any> {
    const url = `${this.API_BRAND}brandinventory/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  putBrandInventory(data): Observable<any> {
    const url = `${this.API_BRAND}brandinventory`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getBrandAmount(Id: String): Observable<any> {
    const url = `${this.API_BRAND}brandamount/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  putBrandAmount(data): Observable<any> {
    const url = `${this.API_BRAND}brandamount`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

}
