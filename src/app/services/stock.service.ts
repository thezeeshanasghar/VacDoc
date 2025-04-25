import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdjustStockDTO {
  DoctorId: number;
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
  BillDate: Date;
  IsPaid: boolean;
  totalAmount: number;
  Quantity: number;
  StockAmount: number;
  PaidDate: Date;
  stocks: StockDTO[];
}

export interface Response<T> {
  IsSuccess: boolean;
  Message: string;
  ResponseData: T;
}

export interface Supplier {
  id: number;
  name: string;
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
  getBills(id:number, toDate?: Date): Observable<Response<BillDetails[]>> {
    let url = `${this.apiUrl}bill/doctor/${id}`;
    return this.http.get<Response<BillDetails[]>>(url);
  }
  getBrandBills(id:number): Observable<Response<BillDetails[]>> {
    let url = `${this.apiUrl}stock/bill/${id}`;
    return this.http.get<Response<BillDetails[]>>(url);
  }
  getSuppliers(): Observable<Response<Supplier[]>> {
    let url = `${this.apiUrl}Bill/Suppliers`;
    return this.http.get<Response<Supplier[]>>(url);
  }
}