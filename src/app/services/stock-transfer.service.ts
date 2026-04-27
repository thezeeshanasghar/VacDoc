import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AvailableBatchDTO {
  BrandId: number;
  BrandName: string;
  BatchLot: string | null;
  Expiry: string | null;
  AvailableQuantity: number;
  CostPrice: number;
}

export interface StockTransferItemDTO {
  BrandId: number;
  BrandName?: string;
  BatchNumber: string | null;
  ExpiryDate: string | null;
  Quantity: number;
  CostPrice: number;
}

export interface StockTransferRequestDTO {
  FromClinicId: number;
  ToClinicId: number;
  DoctorId: number;
  Items: StockTransferItemDTO[];
}

export interface StockTransferHistoryDTO {
  Id: number;
  CreatedAt: string;
  FromClinicId: number;
  FromClinicName: string;
  ToClinicId: number;
  ToClinicName: string;
  BrandId: number;
  BrandName: string;
  BatchNumber: string | null;
  ExpiryDate: string | null;
  Quantity: number;
  CostPrice: number;
  TotalValue: number;
  CreatedBy: number;
  TransferredByName: string;
}

export interface TransferResponse<T> {
  IsSuccess: boolean;
  Message: string;
  ResponseData: T;
}

@Injectable({ providedIn: 'root' })
export class StockTransferService {
  private readonly base = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  getAvailableBatches(brandId: number, clinicId: number): Observable<TransferResponse<AvailableBatchDTO[]>> {
    return this.http.get<TransferResponse<AvailableBatchDTO[]>>(
      `${this.base}stock/available-batches?brandId=${brandId}&clinicId=${clinicId}`
    );
  }

  createTransfer(dto: StockTransferRequestDTO): Observable<TransferResponse<StockTransferHistoryDTO[]>> {
    return this.http.post<TransferResponse<StockTransferHistoryDTO[]>>(`${this.base}StockTransfer`, dto);
  }

  getHistory(params: {
    fromClinicId?: number;
    toClinicId?: number;
    brandId?: number;
    fromDate?: string;
    toDate?: string;
    doctorId?: number;
  }): Observable<TransferResponse<StockTransferHistoryDTO[]>> {
    const q = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return this.http.get<TransferResponse<StockTransferHistoryDTO[]>>(
      `${this.base}StockTransfer/history${q ? '?' + q : ''}`
    );
  }
}
