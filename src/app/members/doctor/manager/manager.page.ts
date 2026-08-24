import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from '../../../../environments/environment';
import { ManagerService } from 'src/app/services/manager.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.page.html',
  styleUrls: ['./manager.page.scss'],
})
export class ManagerPage implements OnInit {
  doctorId: any = null;
  managers: any[] = [];
  managerAccessRecords: any[] = [];

  constructor(
    private managerService: ManagerService,
    private storage: Storage,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (this.doctorId) {
      await this.fetchManagers();
      this.loadManagerAccessRecords();
    } else {
      this.toastService.create('Doctor ID not found', 'danger');
    }
  }

  loadManagerAccessRecords() {
    this.managerService.getManagerAccess(this.doctorId).subscribe({
      next: (res) => { this.managerAccessRecords = res || []; },
      error: () => { this.managerAccessRecords = []; }
    });
  }

  getClinicsForManager(managerId: number): string[] {
    return this.managerAccessRecords
      .filter(r => r.ManagerId === managerId && r.Clinic)
      .map(r => r.Clinic.Name || '');
  }

  navigateToPermissions(manager: any) {
    this.router.navigate(
      ['/members/doctor/manager/permissions', manager.Id],
      { queryParams: { name: manager.Name || '' } }
    );
  }

  async fetchManagers() {
    const loading = await this.loadingController.create({
      message: 'Loading Managers...',
    });
    await loading.present();

    // ManagerController.GetByDoctorId returns the manager list itself
    // ({ Id, Name, Email, IsActive, IsVerified }) — separate from
    // ManagerAccessController's clinic-grant rows loaded in loadManagerAccessRecords().
    this.managerService.getManagersByDoctorId(this.doctorId).subscribe({
      next: (res) => {
        loading.dismiss();
        this.managers = (res || []).sort((a: any, b: any) =>
          (a.Name || '').localeCompare(b.Name || '')
        );
      },
      error: (err: any) => {
        loading.dismiss();
        this.toastService.create('Error fetching Managers', 'danger');
        console.error(err);
      },
    });
  }

  navigateToEdit(manager: any) {
    this.router.navigate(
      ['/members/doctor/manager/edit', manager.Id],
      { queryParams: {
          name: manager.Name || '',
          email: manager.Email || '',
      }}
    );
  }

  async toggleActive(manager: any) {
    const loading = await this.loadingController.create({ message: manager.IsActive ? 'Deactivating...' : 'Activating...' });
    await loading.present();
    this.managerService.toggleManagerActive(manager.Id).subscribe({
      next: () => {
        loading.dismiss();
        manager.IsActive = !manager.IsActive;
        const status = manager.IsActive ? 'activated' : 'deactivated';
        this.toastService.create('Manager ' + status + ' successfully', 'success');
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to update status', 'danger'); }
    });
  }

  async toggleVerify(manager: any) {
    const loading = await this.loadingController.create({ message: manager.IsVerified ? 'Revoking approval...' : 'Approving...' });
    await loading.present();
    this.managerService.toggleManagerVerify(manager.Id).subscribe({
      next: () => {
        loading.dismiss();
        manager.IsVerified = !manager.IsVerified;
        const status = manager.IsVerified ? 'approved' : 'unapproved';
        this.toastService.create('Manager ' + status + ' successfully', 'success');
      },
      error: () => { loading.dismiss(); this.toastService.create('Failed to update approval status', 'danger'); }
    });
  }

  async deleteManager(id: number) {
    const loading = await this.loadingController.create({
      message: "Deleting Manager...",
    });
    await loading.present();
    this.managerService.deleteManager(id).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create("Manager deleted successfully", "success");
        this.fetchManagers();
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create("Failed to delete Manager", "danger");
        console.error(err);
      },
    });
  }
}
