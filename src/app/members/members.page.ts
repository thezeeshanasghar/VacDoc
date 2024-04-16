import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { LoadingController } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { ClinicService } from "../services/clinic.service";
import { ToastService } from "../shared/toast.service";

@Component({
  selector: "app-members",
  templateUrl: "./members.page.html",
  styleUrls: ["./members.page.scss"]
})
export class MembersPage implements OnInit {
  DoctorId: any;
  clinicId: any;
  profileImagePath: any;
  // resourceURL = environment.RESOURCE_URL;
  public profile = [
    {
      title: "Profile",
      url: "/members/doctor/profile",
      icon: "create",
      imageUrl: environment.RESOURCE_URL + "Resources/Images/1666458901673.jfif", // Use forward slashes in the path
    },
  ];  
  public appPages = [
    {
      title: "Dashboard",
      url: "/members/dashboard",
      icon: "home"
    },
    {
      title: "Alerts",
      url: "/members/alert",
      icon: "alert"
    },
    {
      title: "Messages",
      url: "/members/message",
      icon: "mail"
    }
  ];

  public doctorPages = [
    {
      title: "Clinic",
      url: "/members/doctor/clinic",
      icon: "moon"
    },
    // {
    //   title: "Edit Profile",
    //   url: "/members/doctor/profile",
    //   icon: "create"
    // },
    {
      title: "Schedule",
      url: "/members/doctor/schedule",
      icon: "recording"
    },
    {
      title: "Vacation",
      url: "/members/doctor/vacation",
      icon: "locate"
    },
    {
      title: "Change Password",
      url: "/members/doctor/password",
      icon: "moon"
    },
    {
      title: "Brand Inventory",
      url: "/members/doctor/brand-inventory",
      icon: "locate"
    },
    {
      title: "Brand Amount",
      url: "/members/doctor/brand-amount",
      icon: "locate"
    },
    // {
    //   title: "Setting",
    //   url: "/members/doctor/sms-setting",
    //   icon: "locate"
    // }
  ];

  public childPages = [
    {
      title: "Patients",
      url: "/members/child",
      icon: "man"
    },
    {
      title: "Add",
      url: "/members/child/add",
      icon: "person-add"
    }
  ];

  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}
  private previewImage(file: FileList, imagePath: string) {
    const reader = new FileReader();
    reader.onload = () => {
      if (imagePath === "profile") {
        this.profileImagePath = reader.result as string;
      } 
    };
    reader.readAsDataURL(file.item(0));
  }

  setProfileImage(file: FileList) {
    this.previewImage(file, "profile");
  }

  // setSignatureImage(file: FileList) {
  //   this.previewImage(file, "signature");
  // }
  clearStorage() {
    this.storage.clear();
    this.clinicService.clinics = null;
    this.clinicService.doctorId = null;
    this.clinicService.OnlineClinicId = null;
  }
}
