import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { LoadingController } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { ClinicService } from "../services/clinic.service";
import { ToastService } from "../shared/toast.service";
import { DoctorService } from "src/app/services/doctor.service";

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
              // {
              //   title: "Brand Inventory",
              //   url: "/members/doctor/brand-inventory",
              //   icon: "clipboard-outline"
              // },
              {
                title: "Brand Inventory",
                url: "/members/doctor/brand-amount",
                icon: "wallet-outline"
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
