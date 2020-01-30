import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService extends BaseService {

  private readonly API_INVOICE = `${environment.BASE_URL}child/Download-Invoice-PDF/`

  constructor(
    protected http: HttpClient
  ) { super(http); }

  // getInvoice(data): Observable<any> {
  //   const url = `${this.API_INVOICE}`;
  //   return this.http.get(url, this.httpOptions)
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }
}
