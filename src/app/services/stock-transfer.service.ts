import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Stub service — stock transfer API endpoints removed pending stock module rebuild
@Injectable({ providedIn: 'root' })
export class StockTransferService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getHistory(params: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stocktransfer/history`, { params });
  }

  create(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}stocktransfer`, dto);
  }

  editTransfer(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}stocktransfer/${id}`, dto);
  }

  deleteTransfer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}stocktransfer/${id}`);
  }
}
