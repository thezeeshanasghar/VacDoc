import { Component, OnInit } from "@angular/core";
import { ScheduleService } from "src/app/services/schedule.service";
import { DoseService } from "src/app/services/dose.service";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.page.html",
  styleUrls: ["./schedule.page.scss"]
})
export class SchedulePage implements OnInit {
  fg: FormGroup;
  doses: any[] = [];
  clinics: any;
  selectedClinicId: any;
  usertype: any;
  doctorId: any;

  constructor(
    public loadingcontroller: LoadingController,
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    private doseService: DoseService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
    public clinicService: ClinicService,
    private paService: PaService,
  ) {}

  ngOnInit() {}

  async ionViewDidEnter() {
    this.fg = this.formBuilder.group({});
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.usertype = await this.storage.get(environment.USER);
    await this.loadClinics();
    await this.loadDoses();
  }

  async loadDoses() {
    const loading = await this.loadingcontroller.create({ message: "Loading Schedule" });
    await loading.present();
    try {
      // all doses in the system
      const allRes: any = await this.doseService.getDoses().toPromise();
      // what this doctor has already configured
      const scheduleRes: any = await this.scheduleService.getSchedule(this.doctorId).toPromise();

      // build a map of doseId -> DoctorSchedule record for quick lookup
      const scheduleMap: any = {};
      if (scheduleRes.IsSuccess && scheduleRes.ResponseData) {
        scheduleRes.ResponseData.forEach(ds => {
          scheduleMap[ds.DoseId] = ds;
        });
      }

      this.doses = [];
      this.fg = this.formBuilder.group({});

      if (allRes.IsSuccess && allRes.ResponseData) {
        allRes.ResponseData.forEach(dose => {
          const existing = scheduleMap[dose.Id];
          const isChecked = existing ? (existing.IsActive !== false) : false;
          const gapValue = existing ? (existing.GapInDays != null ? existing.GapInDays : (dose.MinAge || 0)) : (dose.MinAge || 0);

          this.doses.push({
            doseId: dose.Id,
            label: dose.Name,
            minAge: dose.MinAge,
            maxAge: dose.MaxAge,
            IsActive: isChecked,
            doctorScheduleId: existing ? existing.Id : null,
            gapInDays: gapValue
          });

          this.fg.addControl(
            dose.Id + '',
            new FormControl(gapValue + '', Validators.required)
          );
        });
      }

      loading.dismiss();
    } catch (err) {
      loading.dismiss();
      this.toastService.create(err, "danger");
    }
  }

  async onSubmit() {
    const loading = await this.loadingcontroller.create({ message: "Saving..." });
    await loading.present();

    const toUpdate = [];  // existing DoctorSchedule records — PUT
    const toAdd = [];     // checked doses with no DoctorSchedule yet — POST

    this.doses.forEach(dose => {
      const gapValue = parseInt(this.fg.value[dose.doseId + '']);
      if (dose.doctorScheduleId) {
        // already has a DoctorSchedule record — always PUT to keep IsActive in sync
        toUpdate.push({
          Id: dose.doctorScheduleId,
          DoseId: dose.doseId,
          DoctorId: this.doctorId,
          GapInDays: gapValue,
          IsActive: dose.IsActive
        });
      } else if (dose.IsActive) {
        // newly checked, no record yet — POST
        toAdd.push({
          DoseId: dose.doseId,
          DoctorId: this.doctorId,
          GapInDays: gapValue,
          IsActive: true
        });
      }
    });

    try {
      if (toUpdate.length > 0)
        await this.scheduleService.putDoctorSchedule(toUpdate).toPromise();
      if (toAdd.length > 0)
        await this.doseService.addScheduleDose(toAdd).toPromise();
      loading.dismiss();
      this.toastService.create("Schedule saved successfully");
      await this.loadDoses();
    } catch (err) {
      loading.dismiss();
      this.toastService.create(err, "danger");
    }
  }

  async loadClinics() {
    try {
      const loading = await this.loadingcontroller.create({ message: 'Loading clinics...' });
      await loading.present();
      if (this.usertype && this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              let onlineClinic = this.clinics.find(c => c.IsOnline);
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(stored => {
                  if (stored) {
                    onlineClinic = this.clinics.find(c => c.Id === stored.Id);
                    if (onlineClinic) { this.selectedClinicId = onlineClinic.Id; this.clinicService.updateClinic(onlineClinic); }
                  }
                });
              }
              if (onlineClinic) { this.selectedClinicId = onlineClinic.Id; this.clinicService.updateClinic(onlineClinic); }
              else if (this.clinics.length > 0) { this.selectedClinicId = this.clinics[0].Id; this.setOnlineClinic(this.selectedClinicId); }
            } else { this.toastService.create(response.Message, 'danger'); }
          },
          error: () => { loading.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
        });
      } else if (this.usertype && this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              let onlineClinic = this.clinics.find(c => c.IsOnline);
              if (!onlineClinic) {
                this.storage.get(environment.ON_CLINIC).then(stored => {
                  if (stored) {
                    onlineClinic = this.clinics.find(c => c.Id === stored.Id);
                    if (onlineClinic) { this.selectedClinicId = onlineClinic.Id; this.clinicService.updateClinic(onlineClinic); }
                  }
                });
              }
              if (onlineClinic) { this.selectedClinicId = onlineClinic.Id; this.clinicService.updateClinic(onlineClinic); }
              else if (this.clinics.length > 0) { this.selectedClinicId = this.clinics[0].Id; this.setOnlineClinic(this.selectedClinicId); }
            } else { this.toastService.create(response.Message, 'danger'); }
          },
          error: () => { loading.dismiss(); this.toastService.create('Failed to load clinics', 'danger'); }
        });
      }
    } catch (error) {
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  onClinicChange(event: any) {
    this.selectedClinicId = event.detail.value;
    this.setOnlineClinic(this.selectedClinicId);
  }

  async setOnlineClinic(clinicId: any) {
    const loading = await this.loadingcontroller.create({ message: "Setting clinic online..." });
    await loading.present();
    const data = { DoctorId: this.doctorId, Id: clinicId, IsOnline: "true" };
    try {
      this.clinicService.changeOnlineClinic(data).subscribe(
        (res) => {
          if (res.IsSuccess) {
            loading.dismiss();
            this.storage.set(environment.CLINIC_Id, data.Id);
            this.storage.get(environment.CLINICS).then((clinics) => {
              const selectedClinic = clinics.find(c => c.Id === data.Id);
              this.storage.set(environment.ON_CLINIC, selectedClinic);
              this.clinicService.updateClinic(selectedClinic);
            });
            this.toastService.create('Clinic set as online successfully', 'success');
          } else { loading.dismiss(); this.toastService.create(res.Message, 'danger'); }
        },
        (err) => { loading.dismiss(); this.toastService.create('Failed to set clinic online', 'danger'); }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('An error occurred', 'danger');
    }
  }
}
