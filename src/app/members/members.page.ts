import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { LoadingController } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { ClinicService } from "../services/clinic.service";
import { ToastService } from "../shared/toast.service";
import { DoctorService } from "src/app/services/doctor.service";
// import { url } from "inspector";

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
  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.storage.get(environment.DOCTOR_Id).then(val => {
      this.DoctorId = val;
      this.getProfile();
    });
  }

  async getProfile() {
    const loading = await this.loadingController.create({
      message: "Loading Profile"
    });

    await loading.present();
    this.doctorService.getDoctorProfile(this.DoctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          console.log(this.doctorData);
          this.profileImagePath = this.doctorData.ProfileImage;
          this.Name = this.doctorData.DisplayName;
          const clinics = this.doctorData.Clinics;
          this.hasClinics = clinics && clinics.length > 0;
          console.log(clinics);
          console.log(this.hasClinics);
          console.log(clinics.length);

          this.profile = [
            {
              title: this.Name,
              url: "/members/doctor/profile",
              icon: "create",
              imageUrl: this.profileImagePath ? environment.RESOURCE_URL + this.profileImagePath : this.defaultImageUrl
            }
          ];

          // Control menu based on the number of clinics
          if (this.hasClinics) {
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
              // {
              //   title: "Brand Management",
              //   url: "/members/doctor/brand-amount",
              //   icon: "wallet-outline"
              // },
              {
                title: "Stock Management",
                icon: "cube-outline",
                url: "/members/doctor/brand-amount",
                // children: [
                //   {
                //     title: "Stock In Hand",
                //     url: "/members/doctor/brand-amount",
                //     icon: "bar-chart-outline"  // Changed to bar chart for stock levels
                //   },
                //   {
                //     title: "Purchase",
                //     icon: "cart-outline",
                //     url: "/members/doctor/stock-management/add",
                //     children: [
                //       {
                //         title: "Add Bill",
                //         url: "/members/doctor/stock-management/add",
                //         icon: "add-circle-outline"  // Keep add icon for new bills
                //       },
                //       {
                //         title: "Purchase History",
                //         url: "/members/doctor/stock-management",
                //         icon: "document-text-outline"  // Changed to document for history
                //       },
                //       // {
                //       //   title: "Purchase Pending",
                //       //   url: "/members/doctor/stock-management/total",
                //       //   icon: "time-outline"  // Changed to time/clock for pending items
                //       // },
                //       {
                //         title: "Purchase Report",
                //         url: "/members/doctor/stock-management/total",
                //         icon: "stats-chart-outline"  // Changed to stats for reports
                //       }
                //     ]
                //   },
                //   {
                //     title: "Adjust Stock",
                //     url: "/members/doctor/stock-management/adjust",
                //     icon: "sync-outline"  // Changed to sync for stock adjustment
                //   },
                //   {
                //     title: "Sales Report",
                //     url: "/members/doctor/stock-management/salesreport",
                //     icon: "trending-up-outline"  // Changed to trending up for sales
                //   }
                // ],
                // isOpen: false
              }
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

          loading.dismiss();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  public profile: any = [];
  public appPages: any = [];
  public doctorPages: any = [];
  public childPages: any = [];

  clearStorage() {
    this.storage.clear();
    this.clinicService.clinics = null;
    this.clinicService.doctorId = null;
    this.clinicService.OnlineClinicId = null;
  }
}
