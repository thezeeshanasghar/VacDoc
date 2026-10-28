import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';

// Agent referrals awaiting registration (two-step agent registration). A referral is not a patient:
// staff register it through Add Patient (prefilled) and then call convert to close it.
@Injectable({
  providedIn: 'root'
})
export class ReferralService extends BaseService {
  private readonly API_URL = `${environment.BASE_URL}Referral`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  // status: 'New' (default) or 'Done' (converted + rejected).
  getDoctorReferrals(doctorId: number, status: string): Observable<any> {
    return this.http.get(`${this.API_URL}/doctor/${doctorId}?status=${status}`).pipe(catchError(this.handleError));
  }

  getReferral(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}`).pipe(catchError(this.handleError));
  }

  // Open referral matching this phone + DOB at the doctor's practice, or ResponseData null.
  match(doctorId: number, countryCode: string, mobile: string, dob: string): Observable<any> {
    const q = `doctorId=${doctorId}&countryCode=${encodeURIComponent(countryCode)}`
      + `&mobile=${encodeURIComponent(mobile)}&dob=${encodeURIComponent(dob)}`;
    return this.http.get(`${this.API_URL}/match?${q}`).pipe(catchError(this.handleError));
  }

  convert(id: number, childId: number): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}/convert`, { ChildId: childId }).pipe(catchError(this.handleError));
  }

  reject(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}/reject`, { Reason: reason }).pipe(catchError(this.handleError));
  }

  changeClinic(id: number, clinicId: number): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}/clinic`, { ClinicId: clinicId }).pipe(catchError(this.handleError));
  }
}
