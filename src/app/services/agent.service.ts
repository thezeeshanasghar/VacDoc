import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';

export interface Agent {
  id: number;
  name: string;
  phoneNumber: string;
  referralFeePerClient: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService extends BaseService {
  private readonly API_URL = `${environment.BASE_URL}Agent`;

  constructor(protected http: HttpClient) {
    super(http);
  }

  getAllAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  getAgentNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/names`).pipe(catchError(this.handleError));
  }

  addAgent(agent: any): Observable<any> {
    return this.http.post(this.API_URL, agent).pipe(catchError(this.handleError));
  }

  updateAgent(id: number, agent: any): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, agent).pipe(catchError(this.handleError));
  }

  deleteAgent(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(catchError(this.handleError));
  }

  getAgentReport(id: number, from: string, to: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}/report?from=${from}&to=${to}`)
      .pipe(catchError(this.handleError));
  }

  othercity = false;
  agents = [];

  loadAgents(): void {
    this.getAgentNames().subscribe(
      (data: any) => { this.agents = data; },
      (error: any) => { console.error('Error loading agents', error); }
    );
  }

  protected handleError(error: any): Observable<never> {
    throw error;
  }
}
