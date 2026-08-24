import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ClinicService } from 'src/app/services/clinic.service';
import { ManagerService } from 'src/app/services/manager.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-manager',
  templateUrl: './edit-manager.page.html',
  styleUrls: ['./edit-manager.page.scss']
})
export class EditManagerPage implements OnInit {
  fg: any;
  managerId: any;
  managerName = '';

  allClinics: any[] = [];
  managerAccessRows: any[] = [];   // ManagerAccess rows for this Manager (each has .Id + .ClinicId)
  togglingClinicId: number = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private storage: Storage,
    private loadingCtrl: LoadingController,
    private managerService: ManagerService,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.managerId   = this.route.snapshot.paramMap.get('managerId');
    this.managerName = this.route.snapshot.queryParamMap.get('name') || '';

    const email = this.route.snapshot.queryParamMap.get('email') || '';

    this.fg = this.fb.group({
      Name:  [this.managerName, Validators.required],
      Email: [email, [Validators.required, Validators.email]],
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
    // getManagerAccess returns all ManagerAccess rows for doctor — filter to this Manager
    this.managerService.getManagerAccess(String(doctorId)).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : ((res && res.ResponseData) || []);
        this.managerAccessRows = rows.filter((r: any) => r.ManagerId === Number(this.managerId));
      }
    });
  }

  isClinicAssigned(clinicId: number): boolean {
    return this.managerAccessRows.some(r => r.ClinicId === clinicId);
  }

  async toggleClinic(clinic: any) {
    if (this.togglingClinicId === clinic.Id) { return; }
    this.togglingClinicId = clinic.Id;
    const assigned = this.isClinicAssigned(clinic.Id);

    if (assigned) {
      const row = this.managerAccessRows.find(r => r.ClinicId === clinic.Id);
      this.managerService.deleteAccess(row.Id).subscribe({
        next: () => {
          this.managerAccessRows = this.managerAccessRows.filter(r => r.ClinicId !== clinic.Id);
          this.togglingClinicId = null;
        },
        error: () => {
          this.toastService.create('Failed to remove access', 'danger');
          this.togglingClinicId = null;
        }
      });
    } else {
      this.managerService.addManagerAccess({ ManagerId: Number(this.managerId), ClinicId: clinic.Id }).subscribe({
        next: (res: any) => {
          const newRow = (res && res.ResponseData) || { Id: (res && res.Id) || Date.now(), ManagerId: Number(this.managerId), ClinicId: clinic.Id };
          this.managerAccessRows = [...this.managerAccessRows, newRow];
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

    this.managerService.updateManagerProfile(this.managerId, this.fg.value).subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Profile updated successfully', 'success');
          this.router.navigate(['/members/doctor/manager']);
        } else {
          this.toastService.create((res && res.Message) || 'Failed to update', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to update profile', 'danger'); }
    });
  }
}
