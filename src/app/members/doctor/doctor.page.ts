import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { DoctorService } from 'src/app/services/doctor.service';

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.page.html',
  styleUrls: ['./doctor.page.scss'],
})
export class DoctorPage implements OnInit {

  allowOwnEmail = false;

  constructor(
    private storage: Storage,
    private doctorService: DoctorService,
  ) { }

  async ngOnInit() {
    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!doctorId) {
      return;
    }
    this.doctorService.getDoctorProfile(doctorId).subscribe(res => {
      if (res.IsSuccess) {
        this.allowOwnEmail = res.ResponseData.AllowOwnEmail === true;
      }
    });
  }

}
