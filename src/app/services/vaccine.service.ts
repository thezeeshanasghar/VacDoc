import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class VaccineService extends BaseService {

  private readonly API_VACCINE = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getVaccine(): Observable<any> {
    return this.http.get(this.API_VACCINE + 'vaccine', this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getVaccinationById(id: string): Observable<any> {
    const url = `${this.API_VACCINE}child/${id}/schedule`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  updateVaccinationDate(data, max, min, gap): Observable<any> {
    //const url = `${this.API_VACCINE}schedule/Reschedule?ignoreMaxAgeRule=${max}false&ignoreMinAgeFromDOB=false&ignoreMinGapFromPreviousDose=false`;
    const url = `${this.API_VACCINE}schedule/Reschedule?ignoreMaxAgeRule=${max}&ignoreMinAgeFromDOB=${min}&ignoreMinGapFromPreviousDose=${gap}`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVaccineByVaccineId(id: string): Observable<any> {
    const url = `${this.API_VACCINE}schedule/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  fillUpChildVaccine(data): Observable<any> {
    const url = `${this.API_VACCINE}schedule/child-schedule`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  AddChildSchedule(data): Observable<any> {
    const url = `${this.API_VACCINE}schedule/add-schedule`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  UnfillChildVaccine(data): Observable<any> {
    const url = `${this.API_VACCINE}schedule/child-schedule`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  } 

  DeleteVaccineByChildidDoseidDate(Childid: string, Doseid: string, date: String) {
    const url = `${this.API_VACCINE}schedule/${Childid}/${Doseid}/${date}`;
    return this.http.delete(url,this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }


  // getscheduleprint(id)
  // {
  //   const url = `${this.API_VACCINE}child/${id}/Download-Schedule-PDF`;
  //   return this.http.get(url, this.httpOptions).pipe(
  //     map(this.extractData),
  //     catchError(this.handleError)
  //   );
  // }


}
