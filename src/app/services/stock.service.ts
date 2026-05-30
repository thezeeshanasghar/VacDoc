import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface StockDTO {
  Id?: number;
  BrandId: number;
  BrandName?: string;
  BillId?: number;
  BillNo?: string;
  Supplier?: string;
  SupplierId?: number;
  BillDate?: Date | string;
  DoctorId?: number;
  ClinicId?: number;
  Quantity: number;
  OriginalQuantity?: number;
  StockAmount?: number;
  BatchLot?: string;
  Expiry?: Date | string;
}

// Stub service — stock API endpoints removed pending stock module rebuild
@Injectable({ providedIn: 'root' })
export class StockService {
  private apiUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getBatchLotsByBrand(brandId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/batch-lots?brandId=${brandId}&clinicId=${clinicId}`);
  }

  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}supplier`);
  }

  getSalesReportFile(clinicId: number, fromDate: Date, toDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/sales-report?clinicId=${clinicId}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getSalesCollectionReportFile(clinicId: number, fromDate: Date, toDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/sales-collection-report?clinicId=${clinicId}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getItemsReportFile(clinicId: number, brandId: number, fromDate: any, toDate: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/items-report?clinicId=${clinicId}&brandId=${brandId}&from=${fromDate}&to=${toDate}`, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getItemsPurchaseReportFile(clinicId: number, brandId: number, fromDate: any, toDate: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/items-purchase-report?clinicId=${clinicId}&brandId=${brandId}&from=${fromDate}&to=${toDate}`, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getItemsSupplierReportFile(clinicId: number, supplier: string, fromDate: any, toDate: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stock/items-supplier-report?clinicId=${clinicId}&supplier=${encodeURIComponent(supplier)}&from=${fromDate}&to=${toDate}`, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getBills(doctorId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}bill?doctorId=${doctorId}&clinicId=${clinicId}`);
  }

  getBillById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}bill/${id}`);
  }

  createBill(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}bill`, dto);
  }

  reverseBill(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}bill/${id}/reverse`);
  }

  updateBill(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}bill/${id}`, dto);
  }

  addPayment(billId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}bill/${billId}/payment`, dto);
  }

  getPayments(billId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}bill/${billId}/payments`);
  }

  getStockOverview(doctorId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stockoverview?doctorId=${doctorId}&clinicId=${clinicId}`);
  }

  createAdjustment(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}adjuststock`, dto);
  }

  getAdjustments(doctorId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}adjuststock?doctorId=${doctorId}&clinicId=${clinicId}`);
  }

  deleteAdjustment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}adjuststock/${id}`);
  }

  createTransfer(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}stocktransfer`, dto);
  }

  getTransfers(doctorId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}stocktransfer?doctorId=${doctorId}&clinicId=${clinicId}`);
  }

  deleteTransfer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}stocktransfer/${id}`);
  }

  downloadTransferPdf(billId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}stocktransfer/pdf?billId=${billId}`, { responseType: 'blob' });
  }

  createDirectSale(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}directsale`, dto);
  }

  getDirectSales(doctorId: number, clinicId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}directsale?doctorId=${doctorId}&clinicId=${clinicId}`);
  }

  deleteDirectSale(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}directsale/${id}`);
  }

  downloadDirectSalePdf(saleBillNo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}directsale/pdf?saleBillNo=${encodeURIComponent(saleBillNo)}`, { responseType: 'blob' });
  }
}
