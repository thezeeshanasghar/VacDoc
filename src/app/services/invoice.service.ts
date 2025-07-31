import { Injectable } from "@angular/core";
import { BaseService } from "./base.service"; // Assuming you have a base service like in the FollowupService
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class InvoiceService extends BaseService {
  private readonly API_INVOICE = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  CreateInvoice(invoiceDTO: { amount: any; childId: any; }): Observable<any> {
    const url = `${this.API_INVOICE}Invoice`;
    return this.http
      .post(url,invoiceDTO, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getInvoiceById(invoiceId: string): Observable<any> {
    const url = `${this.API_INVOICE}invoice/${invoiceId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getInvoiceId(doseId: string, childId: string): Observable<any> {
    const url = `${this.API_INVOICE}Child/invoice-id?doseId=${doseId}&childId=${childId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  updateInvoiceAmount(invoiceId: string, amount: number): Observable<any> {
    const url = `${this.API_INVOICE}/${invoiceId}/Amount`;
    const body = { amount };
    return this.http.put(url, body, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // updateInvoice(invoiceId: string, data): Observable<any> {
  //   const url = `${this.API_INVOICE}invoice/${invoiceId}`;
  //   return this.http.put(url, data, this.httpOptions).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  // deleteInvoice(invoiceId: string): Observable<any> {
  //   const url = `${this.API_INVOICE}invoice/${invoiceId}`;
  //   return this.http.delete(url, this.httpOptions).pipe(
  //     catchError(this.handleError)
  //   );
  // }
}
