import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaCashHandoverService {
  private readonly BASE = `${environment.BASE_URL}PaCashHandover`;
  private httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(private http: HttpClient) {}

  getCashInHand(paId: number, clinicId: number): Observable<any> {
    return this.http.get(`${this.BASE}/cash-in-hand/${paId}/${clinicId}`, this.httpOptions);
  }

  createHandover(paId: number, clinicId: number, doctorId: number): Observable<any> {
    return this.http.post(this.BASE, { PaId: paId, ClinicId: clinicId, DoctorId: doctorId }, this.httpOptions);
  }

  getPendingHandovers(doctorId: number): Observable<any> {
    return this.http.get(`${this.BASE}/pending/${doctorId}`, this.httpOptions);
  }

  getHistory(paId: number, clinicId: number): Observable<any> {
    return this.http.get(`${this.BASE}/history/${paId}/${clinicId}`, this.httpOptions);
  }

  confirmHandover(id: number): Observable<any> {
    return this.http.patch(`${this.BASE}/${id}/confirm`, {}, this.httpOptions);
  }

  rejectHandover(id: number, rejectionNote: string): Observable<any> {
    return this.http.patch(`${this.BASE}/${id}/reject`, { RejectionNote: rejectionNote }, this.httpOptions);
  }
}
