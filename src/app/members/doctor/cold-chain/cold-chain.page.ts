import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
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
  ) {}

  async ngOnInit() {
    const user = await this.storage.get(environment.USER);
    // AllowColdChain lives on the DOCTOR record (VacAdmin-controlled) and is
    // cached at login under environment.DOCTOR regardless of who is logged in
    // (doctor or PA) — see members.page.ts getProfile() for the same pattern.
    const doctorProfile = await this.storage.get(environment.DOCTOR);
    const doctorAllowsColdChain = !!(doctorProfile && doctorProfile.AllowColdChain);

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
