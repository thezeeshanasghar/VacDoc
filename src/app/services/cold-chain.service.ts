import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ColdChainService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  // ==================== REFRIGERATORS ====================

  getRefrigerators(clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coldchain/refrigerators?clinicId=${clinicId}`);
  }

  addRefrigerator(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}coldchain/refrigerators`, dto);
  }

  updateRefrigerator(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}coldchain/refrigerators/${id}`, dto);
  }

  deleteRefrigerator(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}coldchain/refrigerators/${id}`);
  }

  // ==================== TEMPERATURE READINGS ====================

  submitReading(dto: {
    refrigeratorId: number;
    doctorId: number;
    clinicId: number;
    temperature: number;
    recordedDate: string;   // YYYY-MM-DD
    recordedTime: string;   // HH:mm
    recordedByPaId?: number | null;
    recordedByName: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}coldchain/readings`, dto);
  }

  getReadings(clinicId: number, fromDate: string, toDate: string, refrigeratorId?: number): Observable<any> {
    let url = `${this.apiUrl}coldchain/readings?clinicId=${clinicId}&fromDate=${fromDate}&toDate=${toDate}`;
    if (refrigeratorId) {
      url += `&refrigeratorId=${refrigeratorId}`;
    }
    return this.http.get<any>(url);
  }

  getRequirementStatus(clinicId: number, date: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coldchain/requirement-status?clinicId=${clinicId}&date=${date}`);
  }

  // ==================== WEEKLY APPROVAL ====================

  getAllClinicsRollup(doctorId: number, weekStart: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coldchain/approvals/rollup?doctorId=${doctorId}&weekStart=${weekStart}`);
  }

  getClinicWeek(clinicId: number, weekStart: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coldchain/approvals/clinic?clinicId=${clinicId}&weekStart=${weekStart}`);
  }

  submitApproval(approvalLogId: number, status: string, comments: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}coldchain/approvals/${approvalLogId}/submit`, {
      Status: status,
      Comments: comments
    });
  }

  getApprovalHistory(clinicId: number, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}coldchain/approvals/history?clinicId=${clinicId}&limit=${limit}`);
  }

  // ==================== HELPERS ====================

  /** Monday of the week containing `date` (defaults to today), as YYYY-MM-DD. */
  getWeekStart(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return this.toDateString(d);
  }

  getWeekEnd(weekStartDate: string): string {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return this.toDateString(d);
  }

  toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
