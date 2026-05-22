import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Stub service — supplier API endpoints removed pending stock module rebuild
@Injectable({ providedIn: 'root' })
export class SupplierService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}supplier`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}supplier/${id}`);
  }

  create(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}supplier`, dto);
  }

  update(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}supplier/${id}`, dto);
  }

  getLedger(supplierId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}supplierpayment/ledger?supplierId=${supplierId}&clinicId=${clinicId}`);
  }

  createPayment(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}supplierpayment`, dto);
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}supplierpayment/${id}`);
  }
}
