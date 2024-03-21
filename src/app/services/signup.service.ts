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
  private readonly API_Doctor = `${environment.BASE_URL}doctor`;

  personalData: any;
  clinicData: any;
  vaccineData: any;
  vaccineData2: any;
  constructor(protected http: HttpClient) {
    super(http);
  }

  addDoctor(): Observable<any> {
    let var1 = {
      AdditionalInfo: this.personalData.AdditionalInfo,
      ClinicDTO: {
        Name: this.clinicData.Name,
        PhoneNumber: this.clinicData.PhoneNumber,
        Address: this.clinicData.Address,
        ConsultationFee: this.clinicData.ConsultationFee,
        ClinicTimings: this.clinicData.ClinicTimings,
        Lat: this.clinicData.latitude,
        Long: this.clinicData.longitude,
        MonogramImage:localStorage.getItem('dbpath'),
        
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
      ShowPhone: this.personalData.ShowPhone,
      Speciality: this.personalData.Speciality,
      SignatureImage:null,
      ProfileImage:null,
    };
    localStorage.removeItem('dbpath')
    const url = `${this.API_Doctor}`;
    return this.http
      .post(url, var1, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  addSchedule(id): Observable<any> {
    let var1 = [];
    for (let i = 0; i < this.vaccineData2.length; i++) {
      if (this.vaccineData2[i].IsSpecial)
      var1.push({
        DoseId: this.vaccineData2[i].Id,
        GapInDays: this.vaccineData2[i].MinAge,  //this.vaccineData[this.vaccineData2[i].Name],
        DoctorId: id
      });
    }
    const url = `${this.API_Doctor}schedule`;
    return this.http
      .post(url, var1, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
