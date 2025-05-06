import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
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
  getBrands(): Observable<any> {
    const url = `${this.API_BRAND}brand`;
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

  getBrandAmount(id: string): Observable<Response<BrandAmountDTO[]>> {
    const url = `${this.API_BRAND}brandamount/clinic/${id}`;
    return this.http.get<Response<BrandAmountDTO[]>>(url, this.httpOptions);
  }

  putBrandAmount(data): Observable<any> {
    const url = `${this.API_BRAND}brandamount`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  downloadPdf(dId: number, options: any): Observable<HttpResponse<Blob>> {
      const apiUrl = `${this.API_BRAND}BrandAmount/pdf/${dId}`;
      return this.http.get(apiUrl, {
        responseType: 'blob',
        observe: 'response',
        headers: new HttpHeaders({
          'Accept': 'application/pdf'
        })
      });
    }

}

interface Response<T> {
  IsSuccess: boolean;
  Message: string | null;
  ResponseData: T | null;
}

export interface BrandAmountDTO {
  PurchasedAmt: any;
  Amount: any;
  BrandName: any;
  BrandId: number;
  VaccineName: string;
  Count: number;
  // Add other properties as needed
}