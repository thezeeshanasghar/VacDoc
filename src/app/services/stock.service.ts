import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdjustStockDTO {
  brandId: number;
  adjustment: number;
  reason: string;
  date: Date;
  brandName?: string;
  vaccineName?: string;
}

export interface StockDTO {
  BrandId: number;
  BillNo: string;
  Supplier: string;
  Date: Date;
  IsPaid: boolean;
  Quantity: number;
  StockAmount: number;
}
export interface BillDetails {
  Count: any;
  Amount: any;
  BrandName: any;
  VaccineName: any;
  BrandId: any;
  billNo: string;
  supplier: string;
  date: Date;
  isPaid: boolean;
  totalAmount: number;
  stocks: StockDTO[];
}

export interface Response<T> {
  IsSuccess: boolean;
  Message: string;
  ResponseData: T;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.BASE_URL}`;

  constructor(private http: HttpClient) {}

  adjustStock(dto: AdjustStockDTO): Observable<Response<AdjustStockDTO>> {
    return this.http.post<Response<AdjustStockDTO>>(`${this.apiUrl}AdjustStock`, dto);
  }
  createBill(stocks: StockDTO[]): Observable<Response<StockDTO[]>> {
    return this.http.post<Response<StockDTO[]>>(`${this.apiUrl}Stock`, stocks);
  }
  getBills(fromDate?: Date, toDate?: Date): Observable<Response<BillDetails[]>> {
    let url = `${this.apiUrl}bill`;
    return this.http.get<Response<BillDetails[]>>(url);
  }
}