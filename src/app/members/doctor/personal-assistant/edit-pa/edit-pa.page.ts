import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-pa',
  templateUrl: './edit-pa.page.html',
  styleUrls: ['./edit-pa.page.scss']
})
export class EditPaPage implements OnInit {
  fg: any;
  paId: any;
  paName = '';

  allClinics: any[] = [];
  paAccessRows: any[] = [];   // PaAccess rows for this PA (each has .Id + .ClinicId)
  togglingClinicId: number = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private storage: Storage,
    private loadingCtrl: LoadingController,
    private paService: PaService,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.paId   = this.route.snapshot.paramMap.get('paId');
    this.paName = this.route.snapshot.queryParamMap.get('name') || '';

    const mobile = this.route.snapshot.queryParamMap.get('mobile') || '';
    const email  = this.route.snapshot.queryParamMap.get('email')  || '';

    this.fg = this.fb.group({
      Name:         [this.paName, Validators.required],
      Email:        [email,  [Validators.required, Validators.email]],
      MobileNumber: [mobile, [Validators.required, Validators.pattern('[0-9]{10}$')]]
    });

    const doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.loadClinicAccess(doctorId);
  }

  private loadClinicAccess(doctorId: any) {
    this.clinicService.getClinics(Number(doctorId)).subscribe({
      next: (res) => {
        if (res && res.IsSuccess) { this.allClinics = res.ResponseData || []; }
      }
    });
    // getPaaccess returns all PaAccess rows for doctor — filter to this PA
    this.paService.getPaaccess(String(doctorId)).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : ((res && res.ResponseData) || []);
        this.paAccessRows = rows.filter((r: any) => r.PersonalAssistantId === Number(this.paId));
      }
    });
  }

  isClinicAssigned(clinicId: number): boolean {
    return this.paAccessRows.some(r => r.ClinicId === clinicId);
  }

  async toggleClinic(clinic: any) {
    if (this.togglingClinicId === clinic.Id) { return; }
    this.togglingClinicId = clinic.Id;
    const assigned = this.isClinicAssigned(clinic.Id);

    if (assigned) {
      const row = this.paAccessRows.find(r => r.ClinicId === clinic.Id);
      this.paService.deleteAccess(row.Id).subscribe({
        next: () => {
          this.paAccessRows = this.paAccessRows.filter(r => r.ClinicId !== clinic.Id);
          this.togglingClinicId = null;
        },
        error: () => {
          this.toastService.create('Failed to remove access', 'danger');
          this.togglingClinicId = null;
        }
      });
    } else {
      this.paService.addPAAccess({ PersonalAssistantId: Number(this.paId), clinicId: clinic.Id }).subscribe({
        next: (res: any) => {
          // push new row so state is correct without reload
          const newRow = (res && res.ResponseData) || { Id: (res && res.Id) || Date.now(), PersonalAssistantId: Number(this.paId), ClinicId: clinic.Id };
          this.paAccessRows = [...this.paAccessRows, newRow];
          this.togglingClinicId = null;
        },
        error: () => {
          this.toastService.create('Failed to add access', 'danger');
          this.togglingClinicId = null;
        }
      });
    }
  }

  async save() {
    if (this.fg.invalid) {
      this.toastService.create('Please fill all fields correctly.', 'danger');
      return;
    }
    const loader = await this.loadingCtrl.create({ message: 'Saving...' });
    await loader.present();

    this.paService.updatePaProfile(this.paId, this.fg.value).subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Profile updated successfully', 'success');
          this.router.navigate(['/members/doctor/personal-assistant']);
        } else {
          this.toastService.create((res && res.Message) || 'Failed to update', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to update profile', 'danger'); }
    });
  }
}
