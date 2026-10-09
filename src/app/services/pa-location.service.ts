import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PaLocationService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getShiftStatus(paId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}palocation/shift/status/${paId}`);
  }

  startShift(paId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}palocation/shift/start`, { paId });
  }

  endShift(paId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}palocation/shift/end`, { paId });
  }

  getLive(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}palocation/doctor/${doctorId}/live`);
  }

  // date = yyyy-MM-dd (Pakistan day); omit for today
  getTrail(doctorId: number, paId: number, date?: string): Observable<any> {
    const d = date ? `&date=${date}` : '';
    return this.http.get<any>(`${this.apiUrl}palocation/doctor/${doctorId}/trail?paId=${paId}${d}`);
  }
}
