import { Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class SignupService extends BaseService {
  private readonly API_Doctor = `${environment.BASE_URL}`;

  personalData: any;
  clinicData: any;
  vaccineData: any;
  constructor(protected http: HttpClient) {
    super(http);
  }

  addDoctor(): Observable<any> {
    let var1 = {
      AdditionalInfo: this.personalData.AdditionalInfo,
      ClinicDTO: {
        Address: this.clinicData.Address,
        ConsultationFee: this.clinicData.ConsultationFee,
        EndTime: this.clinicData.EndTime,
        Lat: this.clinicData.Lat,
        Long: this.clinicData.Long,
        Name: this.clinicData.Name,
        OffDays: this.clinicData.OffDays,
        PhoneNumber: this.clinicData.PhoneNumber,
        StartTime: this.clinicData.StartTime
      },
      CountryCode: this.personalData.CountryCode,
      DisplayName: this.personalData.DisplayName,
      DoctorType: this.personalData.DoctorType,
      Email: this.personalData.Email,
      FirstName: this.personalData.FirstName,
      LastName: this.personalData.LastName,
      MobileNumber: this.personalData.MobileNumber,
      PMDC: this.personalData.PMDC,
      Password: this.personalData.Password,
      PhoneNo: this.personalData.PhoneNo,
      Qualification: this.personalData.Qualification,
      ShowMobile: this.personalData.ShowMobile,
      ShowPhone: this.personalData.ShowPhone
    };
    const url = `${this.API_Doctor}`;
    return this.http
      .post(url, var1, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
