import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class BulkService extends BaseService {
  private readonly API_BULK = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  getBulk(data): Observable<any> {
    const url = `${this.API_BULK}schedule/bulk-brand`;
    return this.http
      .post(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateInjectionDate(data, max , min , gap): Observable<any> {
    const url = `${
       this.API_BULK}schedule/BulkReschedule?ignoreMaxAgeRule=${max}&ignoreMinAgeFromDOB=${min}&ignoreMinGapFromPreviousDose=${gap}`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  updateVaccine(data): Observable<any> {
    const url = `${this.API_BULK}schedule/update-bulk-injection/`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateVaccineInvoice(data): Observable<any> {
    const url = `${this.API_BULK}schedule/update-bulk-invoice/`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
