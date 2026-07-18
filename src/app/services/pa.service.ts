import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class PaService extends BaseService {
  private readonly API_PA = `${environment.BASE_URL}`;

  constructor(protected http: HttpClient) {
    super(http);
  } 

  signUpPersonalAssistant(data: any): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/signup`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in signUpPersonalAssistant:', error);
        throw error;
      })
    );
  }

//   getPa(Id: string): Observable<any> {
//     const url = `${this.API_SCHEDULE}PersonalAssistant/${Id}`;
//     return this.http.get(url, this.httpOptions).pipe(
//       map(this.extractData),
//       catchError(this.handleError)
//     );
//   }
  getPa(id: string): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  getPaaccess(id: string): Observable<any> {
    const url = `${this.API_PA}PAAccess/doctor/${id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  getPaAll(): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in getPa:', error);
        throw error;
      })
    );
  }

  addPAAccess(data: any): Observable<any> {
    const url = `${this.API_PA}PAAccess`;
    return this.http.post(url, data, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in addPAAccess:', error);
        throw error;
      })
    );
  }

  editPa(id: any, data: any): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${id}`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getPaClinics(Id: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/clinics/${Id}`;
    return this.http.get<any>(url);
  }

  // getPaByDoctorId(id: string): Observable<any> {
  //   const url = `${this.API_SCHEDULE}PersonalAssistant/by-doctor/${id}`;
  //   return this.http.get(url, this.httpOptions).pipe(
  //     map((response: any) => response),
  //     catchError((error) => {
  //       console.error('Error in getPa:', error);
  //       throw error;
  //     })
  //   );
  // }
  getPAsByDoctorId(doctorId: string): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error fetching PAs by Doctor ID:', error);
        throw error;
      })
    );
  }

  deleteAccess(accessId: number): Observable<any> {
    const url = `${this.API_PA}PAAccess/${accessId}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
 
   deletePA(Id: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${Id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // MobileNumber is optional: the PA self-profile screen omits it (the number is
  // locked), and the backend no longer writes it regardless.
  updatePaProfile(paId: number, data: { Name: string; Email: string; MobileNumber?: string; ProfileImage?: string }): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${paId}/profile`;
    return this.http.put(url, data, this.httpOptions).pipe(catchError(this.handleError));
  }

  togglePaActive(paId: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${paId}/toggle-active`;
    return this.http.put(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  togglePaVerify(paId: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/${paId}/toggle-verify`;
    return this.http.put(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  updatePaClinicOnlineStatus(paAccessId: number, isOnline: boolean): Observable<any> {
    const url = `${this.API_PA}PAAccess/${paAccessId}/isonline`;
    return this.http.put(url, isOnline, this.httpOptions).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error in updatePaClinicOnlineStatus:', error);
        throw error;
      })
    );
  }

  getPaPermissions(paId: number): Observable<any> {
    const url = `${this.API_PA}PaPermission/${paId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  updatePaPermissions(paId: number, data: any): Observable<any> {
    const url = `${this.API_PA}PaPermission/${paId}`;
    return this.http.put(url, data, this.httpOptions).pipe(catchError(this.handleError));
  }

  getAuditLog(doctorId: number, paId?: number, page: number = 1, pageSize: number = 50): Observable<any> {
    let url = `${this.API_PA}PaActivityLog/doctor/${doctorId}?page=${page}&pageSize=${pageSize}`;
    if (paId != null) { url += `&paId=${paId}`; }
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  addAuditLog(log: any): Observable<any> {
    const url = `${this.API_PA}PaActivityLog`;
    return this.http.post(url, log, this.httpOptions).pipe(catchError(this.handleError));
  }

  getAssignments(paId: number): Observable<any> {
    const url = `${this.API_PA}PAAssignment/pa/${paId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  deleteAssignment(assignmentId: number, doctorId: number, mode: 'UnassignOnly' | 'FullReset' = 'UnassignOnly'): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}?doctorId=${doctorId}&mode=${mode}`;
    return this.http.delete(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  completeAssignment(assignmentId: number): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}/complete`;
    return this.http.post(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  createAssignment(data: any): Observable<any> {
    const url = `${this.API_PA}PAAssignment`;
    return this.http.post(url, data, this.httpOptions).pipe(catchError(this.handleError));
  }

  getPAsForClinic(clinicId: number): Observable<any> {
    const url = `${this.API_PA}PAAssignment/clinic/${clinicId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  getPAsForDoctor(doctorId: number): Observable<any> {
    const url = `${this.API_PA}PersonalAssistant/doctor/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  cancelAssignment(assignmentId: number, callerType: 'DOCTOR' | 'PA', callerId: number, reason: string = ''): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}/cancel`;
    return this.http.patch(url, { CallerType: callerType, CallerId: callerId, Reason: reason }, this.httpOptions).pipe(catchError(this.handleError));
  }

  reassignAssignment(assignmentId: number, newPaId: number, targetDate?: string | null): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}/reassign`;
    const body: any = { NewPaId: newPaId };
    if (targetDate) { body.TargetDate = targetDate; }
    return this.http.patch(url, body, this.httpOptions).pipe(catchError(this.handleError));
  }

  getActiveAssignmentsForDoctor(doctorId: number): Observable<any> {
    const url = `${this.API_PA}PAAssignment/active/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  setAssignmentTargetDate(assignmentId: number, doctorId: number, targetDate: string | null): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}/target-date`;
    return this.http.patch(url, { DoctorId: doctorId, TargetDate: targetDate }, this.httpOptions).pipe(catchError(this.handleError));
  }

  getAssignmentsForDoctor(doctorId: number, clinicId?: number, paId?: number, status?: string, fromDate?: string, toDate?: string): Observable<any> {
    let url = `${this.API_PA}PAAssignment/doctor/${doctorId}`;
    const params: string[] = [];
    if (clinicId) { params.push(`clinicId=${clinicId}`); }
    if (paId) { params.push(`paId=${paId}`); }
    if (status) { params.push(`status=${status}`); }
    if (fromDate) { params.push(`fromDate=${fromDate}`); }
    if (toDate) { params.push(`toDate=${toDate}`); }
    if (params.length) { url += '?' + params.join('&'); }
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  getDailySummary(doctorId: number, date?: string): Observable<any> {
    let url = `${this.API_PA}PaCashHandover/daily-summary/${doctorId}`;
    if (date) { url += `?date=${date}`; }
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  confirmHandover(handoverId: number): Observable<any> {
    const url = `${this.API_PA}PaCashHandover/${handoverId}/confirm`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  rejectHandover(handoverId: number, note: string): Observable<any> {
    const url = `${this.API_PA}PaCashHandover/${handoverId}/reject`;
    return this.http.patch(url, { RejectionNote: note }, this.httpOptions).pipe(catchError(this.handleError));
  }

  getOutstanding(doctorId: number): Observable<any> {
    const url = `${this.API_PA}PaCashHandover/outstanding/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  verifyPayment(scheduleId: number, doctorId: number): Observable<any> {
    const url = `${this.API_PA}Schedule/${scheduleId}/verify-payment?doctorId=${doctorId}`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  getPaymentReconciliation(doctorId: number, clinicId?: number, paId?: number, fromDate?: string, toDate?: string): Observable<any> {
    let url = `${this.API_PA}PaCashHandover/reconciliation/${doctorId}`;
    const params: string[] = [];
    if (clinicId) { params.push(`clinicId=${clinicId}`); }
    if (paId) { params.push(`paId=${paId}`); }
    if (fromDate) { params.push(`fromDate=${fromDate}`); }
    if (toDate) { params.push(`toDate=${toDate}`); }
    if (params.length) { url += '?' + params.join('&'); }
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  getMyReconciliation(paId: number, clinicId?: number): Observable<any> {
    let url = `${this.API_PA}PaCashHandover/my-reconciliation/${paId}`;
    if (clinicId) url += `?clinicId=${clinicId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  adjustPayable(paId: number, doctorId: number, clinicId: number, amount: number, reason: string): Observable<any> {
    const url = `${this.API_PA}PaCashHandover/adjust`;
    return this.http.post(url, { PaId: paId, DoctorId: doctorId, ClinicId: clinicId, Amount: amount, Reason: reason }, this.httpOptions).pipe(catchError(this.handleError));
  }

  getPendingReversals(doctorId: number): Observable<any> {
    const url = `${this.API_PA}PaActivityLog/pending-reversals/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  approveReversal(logId: number): Observable<any> {
    const url = `${this.API_PA}PaActivityLog/${logId}/approve-reversal`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  rejectReversal(logId: number): Observable<any> {
    const url = `${this.API_PA}PaActivityLog/${logId}/reject-reversal`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  confirmInvoice(invoiceSubmissionId: number, doctorId: number): Observable<any> {
    const url = `${this.API_PA}Schedule/confirm-invoice/${invoiceSubmissionId}?doctorId=${doctorId}`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  // --- Invoice Amendment endpoints ---
  // Returns all pending (unresolved) amendments for doctor's reconciliation page
  getPendingAmendments(doctorId: number): Observable<any> {
    const url = `${this.API_PA}InvoiceAmendment/pending/${doctorId}`;
    return this.http.get(url, this.httpOptions).pipe(catchError(this.handleError));
  }

  // Doctor approves amendment: ungive → payable drops to 0; edit → payable becomes NewAmount
  approveAmendment(amendmentId: number, doctorId: number): Observable<any> {
    const url = `${this.API_PA}InvoiceAmendment/${amendmentId}/approve?doctorId=${doctorId}`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

  // Doctor rejects amendment: PA payable stays at OldAmount regardless of ungive/edit
  rejectAmendment(amendmentId: number, doctorId: number, notes?: string): Observable<any> {
    const url = `${this.API_PA}InvoiceAmendment/${amendmentId}/reject?doctorId=${doctorId}`;
    return this.http.patch(url, { Notes: notes || '' }, this.httpOptions).pipe(catchError(this.handleError));
  }

  // PA marks assignment done (payment collected) → transitions to PendingHandover
  markAssignmentDone(assignmentId: number, paId: number): Observable<any> {
    const url = `${this.API_PA}PAAssignment/${assignmentId}/mark-done?paId=${paId}`;
    return this.http.patch(url, {}, this.httpOptions).pipe(catchError(this.handleError));
  }

//   putDoctorSchedule(data): Observable<any> {
//     const url = `${this.API_SCHEDULE}doctorschedule`;
//     return this.http
//       .put(url, data, this.httpOptions)
//       .pipe(catchError(this.handleError));
//   }
}
