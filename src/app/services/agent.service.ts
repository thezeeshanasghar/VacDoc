import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';

export interface Agent {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService extends BaseService {
  private readonly API_URL = `${environment.BASE_URL}Agent`;
  private readonly API_URL2 = `${environment.BASE_URL}Agent/names`;

  constructor(protected http: HttpClient) { 
    super(http);
  }

  getAllagents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  addAgent(agent): Observable<any> {
    return this.http.post(this.API_URL, agent).pipe(catchError(this.handleError));
  }
  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.API_URL2).pipe(catchError(this.handleError));
  }

  deleteCity(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(catchError(this.handleError));
  }
  othercity = false;
  agents = [];

  loadAgents(): void {
    this.getAgents().subscribe(
      (data: any) => {
        this.agents = data;
      },
      (error: any) => {
        console.error('Error loading cities', error);
      }
    );
  }

  protected handleError(error: any): Observable<never> {
    // handle error
    throw error;
  }
}

