import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';

export interface City {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CityService extends BaseService {
  private readonly API_URL = `${environment.BASE_URL}city`;
  private readonly API_URL2 = `${environment.BASE_URL}city/names`;

  constructor(protected http: HttpClient) { 
    super(http);
  }

  getAllCities(): Observable<City[]> {
    return this.http.get<City[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  addCity(city): Observable<any> {
    return this.http.post(this.API_URL, city).pipe(catchError(this.handleError));
  }
  getCities(): Observable<City[]> {
    return this.http.get<City[]>(this.API_URL2).pipe(catchError(this.handleError));
  }

  deleteCity(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(catchError(this.handleError));
  }
  othercity = false;
  cities = [];

  loadCities(): void {
    this.getCities().subscribe(
      (data: any) => {
        this.cities = data;
        
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

