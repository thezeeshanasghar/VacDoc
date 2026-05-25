import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  create(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}expense`, dto);
  }

  getAll(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}expense?doctorId=${doctorId}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}expense/${id}`);
  }

  update(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}expense/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}expense/${id}`);
  }
}
