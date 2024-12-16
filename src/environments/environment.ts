// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // BASE_URL: "https://stage.skintechno.com/api/",
  // RESOURCE_URL: "https://stage.skintechno.com/",
  

  // for using web server
  // BASE_URL: "https://myapi.skintechno.com/api/",
  // RESOURCE_URL: "https://myapi.skintechno.com/",
  
  // // for local server
  BASE_URL: "https://localhost:5001/api/",
  RESOURCE_URL: "https://localhost:5001/",



  USER: 'User',
  DOCTOR_Id: "DoctorId",
  CLINIC_Id: "ClinicId",
  USER_Id: "UserId",
  SMS: "SMS",
  CLINICS: 'Clinics',
  Childs: 'Childs',
  CITY: 'City',
  DOCTOR: 'Doctor',
  ON_CLINIC: 'OnlineClinic',
  MESSAGES: 'Messages'

};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
