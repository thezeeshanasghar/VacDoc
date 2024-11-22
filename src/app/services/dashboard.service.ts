import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class DashboardService extends BaseService {
  private readonly API_DASHBOARD = `${environment.BASE_URL}` + 'Dashboard';

  constructor(protected http: HttpClient) {
    super(http);
  }

  getThisMonthChild(): Observable<any> {
    const url = `${this.API_DASHBOARD}`;
    console.log('API URL:', url);
    return this.http.get(url, this.httpOptions).pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }
}