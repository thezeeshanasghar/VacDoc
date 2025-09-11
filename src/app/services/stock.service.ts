import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpHeaders } from '@angular/common/http';
export interface AdjustStockDTO {
  DoctorId: number;
  brandId: number;
  adjustment: number;
  reason: string;
  clinicId: string;
  price: number;
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
  message: string;
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
    let url = `${this.apiUrl}bill/clinic/${id}`;
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
  
  patchIsApproved(scheduleId: number ): Observable<any> {
    const url = `${this.apiUrl}Bill/${scheduleId}/ispaapprove`;
    return this.http.patch(url, scheduleId);
  }
  editStocks(id:number,stockDTOs: StockDTO[]): Observable<Response<StockDTO[]>> {
    const url = `${this.apiUrl}Bill/${id}`; // Replace with the correct endpoint if different
    return this.http.patch<Response<StockDTO[]>>(url, stockDTOs);
  }
  getSalesReportFile(clinicId: string, fromDate: Date, toDate: Date): Observable<Blob> {
    const url = `${this.apiUrl}SchedulePdf/clinic-report-pdf/${clinicId}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  getItemsReportFile(clinicId: number, brandId: number, fromDate: string, toDate: string): Observable<any> {
    const url = `${this.apiUrl}Bill/brand-stock-report-pdf?clinicId=${clinicId}&brandId=${brandId}&fromDate=${fromDate}&toDate=${toDate}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  getItemsPurchaseReportFile(clinicId: number, brandId: number, fromDate: string, toDate: string): Observable<any> {
    const url = `${this.apiUrl}Bill/item-purchase-report-pdf?clinicId=${clinicId}&brandId=${brandId}&fromDate=${fromDate}&toDate=${toDate}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  getItemsSupplierReportFile(clinicId: number, supplier: number, fromDate: string, toDate: string): Observable<any> {
    const url = `${this.apiUrl}Bill/supplier-purchase-report-pdf?clinicId=${clinicId}&supplier=${supplier}&fromDate=${fromDate}&toDate=${toDate}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}