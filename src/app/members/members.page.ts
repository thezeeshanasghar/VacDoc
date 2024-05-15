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
  clinicId: any;
  profileImagePath: string;
  Name: any;

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
    await this.doctorService.getDoctorProfile(this.DoctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          this.doctorData = res.ResponseData;
          console.log(this.doctorData);
          this.profileImagePath = this.doctorData.ProfileImage;
          this.Name=this.doctorData.DisplayName
          this.profile = [
            {
              title: this.Name,
              url: "/members/doctor/profile",
              icon: "create",
              imageUrl: environment.RESOURCE_URL + this.profileImagePath
            }
          ];
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
  public appPages = [
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

  public doctorPages = [
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
      title: "Brand Inventory",
      url: "/members/doctor/brand-inventory",
      icon: "clipboard-outline"
    },
    {
      title: "Brand Amount",
      url: "/members/doctor/brand-amount",
      icon: "wallet-outline"
    }
  ];

  public childPages = [
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

  clearStorage() {
    this.storage.clear();
    this.clinicService.clinics = null;
    this.clinicService.doctorId = null;
    this.clinicService.OnlineClinicId = null;
  }
}