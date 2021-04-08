import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class ScheduleService extends BaseService {
  private readonly API_SCHEDULE = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  } 

  getSchedule(Id: String): Observable<any> {
    const url = `${this.API_SCHEDULE}doctorschedule/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  putDoctorSchedule(data): Observable<any> {
    const url = `${this.API_SCHEDULE}doctorschedule`;
    return this.http
      .put(url, data, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
