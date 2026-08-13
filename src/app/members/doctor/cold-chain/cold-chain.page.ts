import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { DoctorService } from 'src/app/services/doctor.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cold-chain',
  templateUrl: './cold-chain.page.html',
  styleUrls: ['./cold-chain.page.scss'],
})
export class ColdChainPage implements OnInit {
  showPaEntry           = false;
  showTemperatureLog     = false;
  showDoctorApproval     = false;
  showRefrigeratorSetup  = false;
  moduleDisabled         = false; // doctor.AllowColdChain === false — whole module off

  constructor(
    private storage: Storage,
    private paService: PaService,
    private doctorService: DoctorService,
  ) {}

  async ngOnInit() {
    const user = await this.storage.get(environment.USER);
    // AllowColdChain lives on the DOCTOR record (VacAdmin-controlled). Fetched
    // fresh here rather than from the environment.DOCTOR storage cache, which
    // is only written at login and can be stale for an already-logged-in PA.
    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    let doctorAllowsColdChain = false;
    try {
      const res: any = await this.doctorService.getDoctorProfile(doctorId).toPromise();
      doctorAllowsColdChain = !!(res && res.IsSuccess && res.ResponseData && res.ResponseData.AllowColdChain);
    } catch {
      doctorAllowsColdChain = false;
    }

    if (!doctorAllowsColdChain) {
      this.moduleDisabled = true;
      this.showPaEntry = this.showTemperatureLog = this.showDoctorApproval = this.showRefrigeratorSetup = false;
      return;
    }
    this.moduleDisabled = false;

    if (user && user.UserType === 'PA') {
      // Doctor-only screens, never shown to a PA regardless of PA flags.
      this.showDoctorApproval = false;
      this.showRefrigeratorSetup = false;
      try {
        const perm: any = await this.paService.getPaPermissions(Number(user.PAId)).toPromise();
        const canLog = !!(perm && perm.ColdChainEntry);
        this.showPaEntry = canLog;
        this.showTemperatureLog = canLog; // viewing history requires the same entry permission
      } catch {
        this.showPaEntry = false;
        this.showTemperatureLog = false;
      }
    } else {
      // Doctor session: doctor can always log readings themselves + sees
      // every screen, no PA-permission check needed for their own actions.
      this.showPaEntry = true;
      this.showTemperatureLog = true;
      this.showDoctorApproval = true;
      this.showRefrigeratorSetup = true;
    }
  }
}
