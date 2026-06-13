import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PnLService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getPnL(doctorId: number, clinicId: number, fromDate: string, toDate: string, expenseMode: string): Observable<any> {
    let url = `${this.apiUrl}pnl?doctorId=${doctorId}&fromDate=${fromDate}&toDate=${toDate}&expenseMode=${expenseMode}`;
    if (clinicId) {
      url += `&clinicId=${clinicId}`;
    }
    return this.http.get<any>(url);
  }
}
