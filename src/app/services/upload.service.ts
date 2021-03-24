import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class UploadService extends BaseService {

  private readonly API = `${environment.BASE_URL}doctor`;


  private readonly API1 = `${environment.BASE_URL}upload`;



  constructor(protected http: HttpClient) { super(http); }

  public uploadFormData(id, formData) {
    return this.http.post<any>(`${this.API}/${id}/update-images`, formData);
  }
  public uploadImage(formData): any {
    return this.http.post<any>(`${this.API1}`, formData)
      .pipe(catchError(this.handleError)
      );
  }

}
