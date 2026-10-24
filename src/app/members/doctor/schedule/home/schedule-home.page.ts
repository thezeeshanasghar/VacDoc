import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { DoctorService } from "src/app/services/doctor.service";

// Schedule menu entry. A doctor picks Regular, the Custom quick pick list, or (with the Travel
// permission) the Travel quick pick list; PA and Manager go straight to the regular schedule page.
@Component({
  selector: "app-schedule-home",
  templateUrl: "./schedule-home.page.html",
  styleUrls: ["./schedule-home.page.scss"]
})
export class ScheduleHomePage implements OnInit {
  showCards = false;
  allowTravel = false;

  constructor(
    private router: Router,
    private storage: Storage,
    private doctorService: DoctorService
  ) {}

  async ngOnInit() {
    const user = await this.storage.get(environment.USER);
    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!user || user.UserType !== "DOCTOR" || !doctorId) {
      this.goRegular();
      return;
    }
    this.doctorService.getDoctorProfile(doctorId).subscribe(
      res => {
        if (res && res.IsSuccess && res.ResponseData) {
          this.allowTravel = res.ResponseData.AllowTravel === true;
          this.showCards = true;
        } else {
          this.goRegular();
        }
      },
      () => this.goRegular()
    );
  }

  goRegular() {
    this.router.navigate(["/members/doctor/schedule/regular"], { replaceUrl: true });
  }
}
