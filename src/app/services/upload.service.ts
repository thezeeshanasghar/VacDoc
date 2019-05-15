import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class UploadService extends BaseService {

  private readonly API = `${environment.BASE_URL}doctor`;

  constructor(protected http: HttpClient) { super(http); }

  public uploadFormData(id, formData) {
    return this.http.post<any>(`${this.API}/${id}/update-images`, formData);
  }
}
