import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DirectSaleDTO {
  Id?: number;
  BrandId: number;
  BrandName?: string;
  ClinicId: number;
  ClinicName?: string;
  DoctorId: number;
  BatchLot?: string;
  ExpiryDate?: string;
  Quantity: number;
  SalePricePerUnit: number;
  PurchasePricePerUnit?: number;
  TotalSaleValue?: number;
  TotalCostValue?: number;
  Profit?: number;
  ClientName?: string;
  PaymentMode: string;
  Notes?: string;
  SaleDate: string;
}

export interface DirectSaleResponse<T> {
  IsSuccess: boolean;
  Message: string;
  ResponseData: T;
}

@Injectable({ providedIn: 'root' })
export class DirectSaleService {
  private readonly base = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  createSale(dto: DirectSaleDTO): Observable<DirectSaleResponse<DirectSaleDTO>> {
    return this.http.post<DirectSaleResponse<DirectSaleDTO>>(`${this.base}DirectSale`, dto);
  }

  getHistory(params: {
    clinicId?: number; brandId?: number; doctorId?: number;
    fromDate?: string; toDate?: string;
  }): Observable<DirectSaleResponse<DirectSaleDTO[]>> {
    const q = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
    return this.http.get<DirectSaleResponse<DirectSaleDTO[]>>(
      `${this.base}DirectSale/history${q ? '?' + q : ''}`
    );
  }
}
