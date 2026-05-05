import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private apiUrl = environment.BASE_URL + 'Supplier';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(this.apiUrl + '/' + id);
  }

  create(dto: any): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  update(id: number, dto: any): Observable<any> {
    return this.http.put(this.apiUrl + '/' + id, dto);
  }

  getLedger(supplierId: number, clinicId: number): Observable<any> {
    return this.http.get(`${this.paymentUrl}/ledger?supplierId=${supplierId}&clinicId=${clinicId}`);
  }

  getPayments(supplierId: number, clinicId: number): Observable<any> {
    return this.http.get(`${this.paymentUrl}?supplierId=${supplierId}&clinicId=${clinicId}`);
  }

  createPayment(dto: any): Observable<any> {
    return this.http.post(this.paymentUrl, dto);
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete(`${this.paymentUrl}/${id}`);
  }

  private get paymentUrl() {
    return environment.BASE_URL + 'SupplierPayment';
  }
}
