// import { Component, OnInit } from "@angular/core";
// import { Storage } from "@ionic/storage";
// import { LoadingController } from "@ionic/angular";
// import { environment } from "src/environments/environment";
// import { ClinicService } from "../services/clinic.service";
// import { ToastService } from "../shared/toast.service";
// import { DoctorService } from "src/app/services/doctor.service";
// import { PaService } from "src/app/services/pa.service";
// // import { url } from "inspector";

// @Component({
//   selector: "app-members",
//   templateUrl: "./members.page.html",
//   styleUrls: ["./members.page.scss"]
// })
// export class MembersPage implements OnInit {
//   doctorData: any;
//   DoctorId: any;
//   profileImagePath: string;
//   Name: any;
//   hasClinics: boolean = false; // Flag to check if clinics are available
//   defaultImageUrl: string = 'assets/male.png';
//   user: any; // Declare the user property
//   constructor(
//     public loadingController: LoadingController,
//     private storage: Storage,
//     private clinicService: ClinicService,
//     private toastService: ToastService,
//     private doctorService: DoctorService,
//     private paService: PaService
//   ) {}

//   async ngOnInit() {
//     this.storage.get(environment.DOCTOR_Id).then(val => {
//       this.DoctorId = val;
//       // console.log(this.DoctorId);
//     });
//     // this.getProfile();
//     this.storage.get(environment.USER).then(val => {
//       this.user = val;
//       console.log(this.user);
//       this.checkStockPermission(this.user.PAId);
//       console.log(this.checkStockPermission(this.user.PAId));

//       this.getProfile(this.user.UserType);
//     });
//     try {
//       this.DoctorId = await this.storage.get(environment.DOCTOR_Id);
//       this.user = await this.storage.get(environment.USER);
  
//       console.log(this.user);
  
//       // Call checkPermissions and destructure the returned object
//       const { AllowStock, AllowAlert, AllowSchedule, AllowVacation, AllowAnalytics } = 
//         await this.checkPermissions(this.user.PAId);
  
//       console.log('Allow Stock:', AllowStock);
//       console.log('Allow Alert:', AllowAlert);
//       console.log('Allow Schedule:', AllowSchedule);
//       console.log('Allow Vacation:', AllowVacation);
//       console.log('Allow Analytics:', AllowAnalytics);
  
//       // Call getProfile
//       this.getProfile(this.user.UserType);
//     } catch (error) {
//       console.error('Error in ngOnInit:', error);
//     }
//     // this.checkStockPermission()
//   }

//   async checkStockPermission(id): Promise<boolean> {
//     try {
//       // Simulate an API call or logic to check stock permissions
//       const hasPermission = await this.paService.getPa(id).toPromise();
//       console.log('Stock Permission:', hasPermission);
//       return hasPermission.AllowStock; // Return true if the user has permission
//     } catch (error) {
//       console.error('Error checking stock permission:', error);
//       return false; // Return false if there's an error
//     }
//   }

//   async checkPermission(id): Promise<boolean> {
//     try {
//       // Simulate an API call or logic to check stock permissions
//       const hasPermission = await this.paService.getPa(id).toPromise();
//       console.log('Stock Permission:', hasPermission);
//       return hasPermission.AllowStock; // Return true if the user has permission
//     } catch (error) {
//       console.error('Error checking stock permission:', error);
//       return false; // Return false if there's an error
//     }
//   }

//   async checkPermissions(id: string): Promise<{ 
//     AllowStock: boolean; 
//     AllowAlert: boolean; 
//     AllowSchedule: boolean; 
//     AllowVacation: boolean; 
//     AllowAnalytics: boolean; 
//   }> {
//     try {
//       // Simulate an API call or logic to check permissions
//       const hasPermission = await this.paService.getPa(id).toPromise();
//       console.log('Permissions:', hasPermission);
  
//       // Return multiple permissions as an object
//       return {
//         AllowStock: hasPermission.AllowStock || false,
//         AllowAlert: hasPermission.AllowAlert || false,
//         AllowSchedule: hasPermission.AllowSchedule || false,
//         AllowVacation: hasPermission.AllowVacation || false,
//         AllowAnalytics: hasPermission.AllowAnalytics || false,
//       };
//     } catch (error) {
//       console.error('Error checking permissions:', error);
  
//       // Return default values in case of an error
//       return {
//         AllowStock: false,
//         AllowAlert: false,
//         AllowSchedule: false,
//         AllowVacation: false,
//         AllowAnalytics: false,
//       };
//     }
//   }
 
//   async getProfile(data: any) {
//     // console.log(data);
//     const loading = await this.loadingController.create({
//       message: "Loading Profile"
//     });

//     await loading.present();
//     this.doctorService.getDoctorProfile(this.DoctorId).subscribe(
//       res => {
//         if (res.IsSuccess) {
//           this.doctorData = res.ResponseData;
//           console.log(this.doctorData);
//           this.profileImagePath = this.doctorData.ProfileImage;
//           this.Name = this.doctorData.DisplayName;
//           const clinics = this.doctorData.Clinics;
//           this.hasClinics = clinics && clinics.length > 0;
//           console.log(clinics);
//           console.log(this.hasClinics);
//           console.log(clinics.length);

//           const hasStockPermission =  this.checkStockPermission(this.user.PAId);
//           const { AllowAlert } = await this.checkPermissions(this.user.PAId);
//           console.log('Has Stock Permission:', hasStockPermission);

//           // this.profile = [
//           //   {
//           //     title: this.Name,
//           //     url: "/members/doctor/profile",
//           //     icon: "create",
//           //     imageUrl: this.profileImagePath ? environment.RESOURCE_URL + this.profileImagePath : this.defaultImageUrl
//           //   }
//           // ];

//           // Control menu based on the number of clinics
//           if (data === "PA") {
//                       this.appPages = [
//                         {
//                           title: "Dashboard",
//                           url: "/members/dashboard",
//                           icon: "home-outline",
//                         }
//                       ];

//                       if (AllowAlert) {
//                         this.appPages.push({
//                           title: "Alerts",
//                           icon: "alert",
//                           url: "/members/alert",
//                         });
//                       }
            
//                       if (hasStockPermission) {
//                         this.appPages.push({
//                           title: "Stock Management",
//                           icon: "cube-outline",
//                           url: "/members/doctor/brand-amount"
//                         });
//                       }
//                     }else if (this.hasClinics) {
//             this.profile = [
//               {
//                 title: this.Name,
//                 url: "/members/doctor/profile",
//                 icon: "create",
//                 imageUrl: this.profileImagePath ? environment.RESOURCE_URL + this.profileImagePath : this.defaultImageUrl
//               }
//             ];
//             this.appPages = [
//               {
//                 title: "Dashboard",
//                 url: "/members/dashboard",
//                 icon: "home-outline"
//               },
//               {
//                 title: "Alerts",
//                 url: "/members/alert",
//                 icon: "alert"
//               },
//               {
//                 title: "Messages",
//                 url: "/members/message",
//                 icon: "mail-unread-outline"
//               }
//             ];

//             this.doctorPages = [
//               {
//                 title: "Clinic",
//                 url: "/members/doctor/clinic",
//                 icon: "moon-outline"
//               },
//               {
//                 title: "Schedule",
//                 url: "/members/doctor/schedule",
//                 icon: "recording-outline"
//               },
//               {
//                 title: "Vacation",
//                 url: "/members/doctor/vacation",
//                 icon: "locate"
//               },
//               {
//                 title: "Change Password",
//                 url: "/members/doctor/password",
//                 icon: "key-outline"
//               },
//               {
//                 title: "Analytics",
//                 url: "/members/doctor/analytics/data",
//                 icon: "stats-chart-outline"
//               },
//               {
//                 title: "Personal Assistant",
//                 url: "/members/doctor/personal-assistant",
//                 icon: "wallet-outline"
//               },
//               {
//                 title: "Stock Management",
//                 icon: "cube-outline",
//                 url: "/members/doctor/brand-amount",
//                 // children: [
//                 //   {
//                 //     title: "Stock In Hand",
//                 //     url: "/members/doctor/brand-amount",
//                 //     icon: "bar-chart-outline"  // Changed to bar chart for stock levels
//                 //   },
//                 //   {
//                 //     title: "Purchase",
//                 //     icon: "cart-outline",
//                 //     url: "/members/doctor/stock-management/add",
//                 //     children: [
//                 //       {
//                 //         title: "Add Bill",
//                 //         url: "/members/doctor/stock-management/add",
//                 //         icon: "add-circle-outline"  // Keep add icon for new bills
//                 //       },
//                 //       {
//                 //         title: "Purchase History",
//                 //         url: "/members/doctor/stock-management",
//                 //         icon: "document-text-outline"  // Changed to document for history
//                 //       },
//                 //       // {
//                 //       //   title: "Purchase Pending",
//                 //       //   url: "/members/doctor/stock-management/total",
//                 //       //   icon: "time-outline"  // Changed to time/clock for pending items
//                 //       // },
//                 //       {
//                 //         title: "Purchase Report",
//                 //         url: "/members/doctor/stock-management/total",
//                 //         icon: "stats-chart-outline"  // Changed to stats for reports
//                 //       }
//                 //     ]
//                 //   },
//                 //   {
//                 //     title: "Adjust Stock",
//                 //     url: "/members/doctor/stock-management/adjust",
//                 //     icon: "sync-outline"  // Changed to sync for stock adjustment
//                 //   },
//                 //   {
//                 //     title: "Sales Report",
//                 //     url: "/members/doctor/stock-management/salesreport",
//                 //     icon: "trending-up-outline"  // Changed to trending up for sales
//                 //   }
//                 // ],
//                 // isOpen: false
//               }
//             ];

//             this.childPages = [
//               {
//                 title: "Patients",
//                 url: "/members/child",
//                 icon: "accessibility-outline"
//               },
//               {
//                 title: "Add",
//                 url: "/members/child/add",
//                 icon: "person-add-outline"
//               }
//             ];
//           } else {
//             this.doctorPages = [
//               {
//                 title: "Dashboard",
//                 url: "/members/dashboard",
//                 icon: "home-outline"
//               },
//               {
//                 title: "Clinic",
//                 url: "/members/doctor/clinic",
//                 icon: "moon-outline"
//               },
//               {
//                 title: "Change Password",
//                 url: "/members/doctor/password",
//                 icon: "key-outline"
//               },
//             ];
//             this.appPages = [];
//             this.childPages = [];
//           }

//           loading.dismiss();
//         } else {
//           loading.dismiss();
//           this.toastService.create(res.Message, "danger");
//         }
//       },
//       err => {
//         loading.dismiss();
//         this.toastService.create(err, "danger");
//       }
//     );
//   }

//   // async getProfile(data: any) {
//   //   const loading = await this.loadingController.create({
//   //     message: "Loading Profile"
//   //   });
  
//   //   await loading.present();
  
//   //   this.doctorService.getDoctorProfile(this.DoctorId).subscribe(
//   //     async (res) => {
//   //       if (res.IsSuccess) {
//   //         this.doctorData = res.ResponseData;
//   //         console.log(this.doctorData);
  
//   //         this.profileImagePath = this.doctorData.ProfileImage;
//   //         this.Name = this.doctorData.DisplayName;
  
//   //         const clinics = this.doctorData.Clinics;
//   //         this.hasClinics = clinics && clinics.length > 0;
  
//   //         console.log(clinics);
//   //         console.log(this.hasClinics);
//   //         console.log(clinics.length);
  
//   //         // Check stock permission
//   //         const hasStockPermission = await this.checkStockPermission(this.user.PAId);
//   //         console.log('Has Stock Permission:', hasStockPermission);
  
//   //         if (data === "PA") {
//   //           this.appPages = [
//   //             {
//   //               title: "Dashboard",
//   //               url: "/members/dashboard",
//   //               icon: "home-outline",
//   //             }
//   //           ];
  
//   //           if (hasStockPermission) {
//   //             this.appPages.push({
//   //               title: "Stock Management",
//   //               icon: "cube-outline",
//   //               url: "/members/doctor/brand-amount"
//   //             });
//   //           }
//   //         } else if (this.hasClinics) {
//   //           this.profile = [
//   //             {
//   //               title: this.Name,
//   //               url: "/members/doctor/profile",
//   //               icon: "create",
//   //               imageUrl: this.profileImagePath
//   //                 ? environment.RESOURCE_URL + this.profileImagePath
//   //                 : this.defaultImageUrl
//   //             }
//   //           ];
  
//   //           this.appPages = [
//   //             {
//   //               title: "Dashboard",
//   //               url: "/members/dashboard",
//   //               icon: "home-outline"
//   //             },
//   //             {
//   //               title: "Alerts",
//   //               url: "/members/alert",
//   //               icon: "alert"
//   //             },
//   //             {
//   //               title: "Messages",
//   //               url: "/members/message",
//   //               icon: "mail-unread-outline"
//   //             }
//   //           ];
  
//   //           if (hasStockPermission) {
//   //             this.appPages.push({
//   //               title: "Stock Management",
//   //               icon: "cube-outline",
//   //               url: "/members/doctor/brand-amount"
//   //             });
//   //           }
//   //         } else {
//   //           this.doctorPages = [
//   //             {
//   //               title: "Dashboard",
//   //               url: "/members/dashboard",
//   //               icon: "home-outline"
//   //             },
//   //             {
//   //               title: "Clinic",
//   //               url: "/members/doctor/clinic",
//   //               icon: "moon-outline"
//   //             },
//   //             {
//   //               title: "Change Password",
//   //               url: "/members/doctor/password",
//   //               icon: "key-outline"
//   //             }
//   //           ];
//   //           this.appPages = [];
//   //           this.childPages = [];
//   //         }
  
//   //         loading.dismiss();
//   //       } else {
//   //         loading.dismiss();
//   //         this.toastService.create(res.Message, "danger");
//   //       }
//   //     },
//   //     (err) => {
//   //       loading.dismiss();
//   //       this.toastService.create(err, "danger");
//   //     }
//   //   );
//   // }
//   public profile: any = [];
//   public appPages: any = [];
//   public doctorPages: any = [];
//   public childPages: any = [];

//   clearStorage() {
//     this.storage.clear();
//     this.clinicService.clinics = null;
//     this.clinicService.doctorId = null;
//     this.clinicService.OnlineClinicId = null;
//   }
// }

import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { LoadingController } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { ClinicService } from "../services/clinic.service";
import { ToastService } from "../shared/toast.service";
import { DoctorService } from "src/app/services/doctor.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-members",
  templateUrl: "./members.page.html",
  styleUrls: ["./members.page.scss"]
})
export class MembersPage implements OnInit {
  doctorData: any;
  DoctorId: any;
  profileImagePath: string;
  Name: any;
  hasClinics: boolean = false; // Flag to check if clinics are available
  defaultImageUrl: string = 'assets/male.png';
  user: any; // Declare the user property
  public profile: any = [];
  public appPages: any = [];
  public doctorPages: any = [];
  public childPages: any = [];

  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private doctorService: DoctorService,
    private paService: PaService
  ) {}

  async ngOnInit() {
    try {
      // Retrieve DoctorId and User from storage
      this.DoctorId = await this.storage.get(environment.DOCTOR_Id);
      this.user = await this.storage.get(environment.USER);
  
      console.log(this.user);
  
      if (this.user.UserType === "PA") {
        const permissions = await this.checkPermissions(this.user.PAId);
        if (permissions) {
          const { AllowStock, AllowAlert, AllowSchedule, AllowVacation, AllowAnalytics, AllowClinic, AllowChild } = permissions;
          console.log('Permissions:', permissions);
        }
      }
  
      // Call getProfile
      this.getProfile(this.user.UserType);
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }
  }

  async checkPermissions(id: string): Promise<{ 
    AllowStock: boolean; 
    AllowAlert: boolean; 
    AllowSchedule: boolean; 
    AllowVacation: boolean; 
    AllowAnalytics: boolean; 
    AllowClinic: boolean;
    AllowChild: boolean;
  }> {
    try {
      if (this.user.UserType === "PA") {
        const hasPermission = await this.paService.getPa(id).toPromise();
        if (hasPermission) {
          return {
            AllowStock: hasPermission.AllowStock || false,
            AllowAlert: hasPermission.AllowAlert || false,
            AllowSchedule: hasPermission.AllowSchedule || false,
            AllowVacation: hasPermission.AllowVacation || false,
            AllowAnalytics: hasPermission.AllowAnalytics || false,
            AllowClinic: hasPermission.AllowClinic || false,
            AllowChild: hasPermission.AllowChild || false,
          };
        }
      }
      // Return default values if no permissions are found
      return {
        AllowStock: false,
        AllowAlert: false,
        AllowSchedule: false,
        AllowVacation: false,
        AllowAnalytics: false,
        AllowClinic: false,
        AllowChild: false,
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      // Return default values in case of an error
      return {
        AllowStock: false,
        AllowAlert: false,
        AllowSchedule: false,
        AllowVacation: false,
        AllowAnalytics: false,
        AllowClinic: false,
        AllowChild: false,
      };
    }
  }

  async getProfile(data: any) {
    const loading = await this.loadingController.create({
      message: "Loading Profile"
    });

    await loading.present();
    this.doctorService.getDoctorProfile(this.DoctorId).subscribe(
      async (res) => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          this.profileImagePath = this.doctorData.ProfileImage;
          this.Name = this.doctorData.DisplayName;
          const clinics = this.doctorData.Clinics;
          this.hasClinics = clinics && clinics.length > 0;
          const permissions = await this.checkPermissions(this.user.PAId);
          if (permissions) {
            const { AllowStock, AllowAlert, AllowClinic, AllowAnalytics, AllowVacation, AllowSchedule, AllowChild } = permissions;      

          if (data === "PA") {
            this.appPages = [
              {
                title: "Dashboard",
                url: "/members/dashboard",
                icon: "home-outline",
              }
            ];

            if (AllowAlert) {
              this.appPages.push({
                title: "Alerts",
                icon: "alert",
                url: "/members/alert",
              });
            }

            if (AllowStock) {
              this.appPages.push({
                title: "Stock Management",
                icon: "cube-outline",
                url: "/members/doctor/brand-amount",
              });
            }

            if (AllowClinic) {
              this.appPages.push({
                  title: "Clinic",
                  url: "/members/doctor/clinic",
                  icon: "moon-outline"
              });
            }

            if (AllowAnalytics) {
              this.appPages.push({
                title: "Analytics",
                url: "/members/doctor/analytics/data",
                icon: "stats-chart-outline"
              });
            }

            if (AllowVacation) {
              this.appPages.push({
                title: "Vacation",
                url: "/members/doctor/vacation",
                icon: "locate"
              });
            }

            if (AllowSchedule) {
              this.appPages.push({
                title: "Schedule",
                url: "/members/doctor/schedule",
                icon: "recording-outline"
              });
            }

            if (AllowChild) {
              this.childPages = [
                {
                  title: "Patients",
                  url: "/members/child",
                  icon: "accessibility-outline"
                },
                {
                  title: "Add",
                  url: "/members/child/add",
                  icon: "person-add-outline"
                }
              ];
            }
          } else if (this.hasClinics) {
            this.profile = [
              {
                title: this.Name,
                url: "/members/doctor/profile",
                icon: "create",
                imageUrl: this.profileImagePath ? environment.RESOURCE_URL + this.profileImagePath : this.defaultImageUrl
              }
            ];

            this.appPages = [
              {
                title: "Dashboard",
                url: "/members/dashboard",
                icon: "home-outline"
              },
              {
                title: "Alerts",
                url: "/members/alert",
                icon: "alert"
              },
              {
                title: "Messages",
                url: "/members/message",
                icon: "mail-unread-outline"
              }
            ];

            this.doctorPages = [
              {
                title: "Clinic",
                url: "/members/doctor/clinic",
                icon: "moon-outline"
              },
              {
                title: "Schedule",
                url: "/members/doctor/schedule",
                icon: "recording-outline"
              },
              {
                title: "Vacation",
                url: "/members/doctor/vacation",
                icon: "locate"
              },
              {
                title: "Change Password",
                url: "/members/doctor/password",
                icon: "key-outline"
              },
              {
                title: "Analytics",
                url: "/members/doctor/analytics/data",
                icon: "stats-chart-outline"
              },
            ];

            this.childPages = [
              {
                title: "Patients",
                url: "/members/child",
                icon: "accessibility-outline"
              },
              {
                title: "Add",
                url: "/members/child/add",
                icon: "person-add-outline"
              }
            ];
            if (this.DoctorId === 1) {
              this.appPages.push(  {
                title: "Personal Assistant",
                url: "/members/doctor/personal-assistant",
                icon: "wallet-outline"
              },
              {
                title: "Stock Management",
                icon: "cube-outline",
                url: "/members/doctor/brand-amount",
              });
            }
          } else {
            this.doctorPages = [
              {
                title: "Dashboard",
                url: "/members/dashboard",
                icon: "home-outline"
              },
              {
                title: "Clinic",
                url: "/members/doctor/clinic",
                icon: "moon-outline"
              },
              {
                title: "Change Password",
                url: "/members/doctor/password",
                icon: "key-outline"
              },
            ];
            this.appPages = [];
            this.childPages = [];
          }
        }
          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  clearStorage() {
    this.storage.clear();
    this.clinicService.clinics = null;
    this.clinicService.doctorId = null;
    this.clinicService.OnlineClinicId = null;
  }
}