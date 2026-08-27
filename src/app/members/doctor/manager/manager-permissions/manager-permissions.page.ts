import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { ManagerService } from 'src/app/services/manager.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-manager-permissions',
  templateUrl: './manager-permissions.page.html',
  styleUrls: ['./manager-permissions.page.scss'],
})
export class ManagerPermissionsPage implements OnInit {
  managerId: number = 0;
  managerName: string = '';
  perm: any = {};

  // Manager has exactly these 9 flags — no other permission surface, so this is a
  // flat list, not the 11-section PA accordion.
  fields = [
    { key: 'ViewPaAssignmentStatus',     label: 'View PA assignment status', desc: 'See which vaccination tasks are marked done vs. pending, per PA' },
    { key: 'ReassignPaTask',              label: 'Reassign task to another PA', desc: 'Move a pending assignment from one PA to another, within assigned clinics' },
    { key: 'AssignPaToPatient',           label: 'Assign PA to a patient', desc: 'Create a new task for a PA to give a patient\'s vaccine — same action the Doctor uses' },
    { key: 'CanGiveVaccine',              label: 'Give vaccine', desc: 'Mark a dose given, same as Doctor/PA — reconciliation stamps it "Manager"' },
    { key: 'CanEditInvoice',              label: 'Download & edit invoice', desc: 'Same download/edit rights as PA, including the 1-edit cap — never final cash confirmation' },
    { key: 'ViewFeedbackResponseTracker', label: 'View feedback response tracker', desc: 'See how many clients were sent a feedback link and how many filled the form' },
    { key: 'SendFeedbackEmail',           label: 'Send feedback email', desc: 'Trigger the feedback-request email (magic link), individually or in bulk' },
    { key: 'SendFeedbackWhatsApp',        label: 'Send feedback WhatsApp message', desc: 'Open the prewritten WhatsApp message (magic link only), individually or in bulk' },
    { key: 'ManagePaClinicAssignments',   label: "Manage other PAs' clinic assignments", desc: "Add/remove which clinics a regular PA can access — bounded to this Manager's own clinics" },
  ];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private managerService: ManagerService,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.managerId = Number(this.route.snapshot.paramMap.get('managerId'));
    this.managerName = this.route.snapshot.queryParamMap.get('name') || 'Manager';
    this.loadPermissions();
  }

  async loadPermissions() {
    const loading = await this.loadingController.create({ message: 'Loading permissions...' });
    await loading.present();
    this.managerService.getManagerPermissions(this.managerId).subscribe({
      next: (res: any) => {
        loading.dismiss();
        this.perm = res || {};
      },
      error: () => {
        loading.dismiss();
        this.perm = {};
        this.toastService.create('Failed to load permissions', 'danger');
      }
    });
  }

  selectAll() {
    this.fields.forEach((f) => { this.perm[f.key] = true; });
  }

  clearAll() {
    this.fields.forEach((f) => { this.perm[f.key] = false; });
  }

  async save() {
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();
    this.managerService.updateManagerPermissions(this.managerId, this.perm).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create('Permissions saved successfully', 'success');
        this.navCtrl.back();
      },
      error: () => {
        loading.dismiss();
        this.toastService.create('Failed to save permissions', 'danger');
      }
    });
  }

  get countGranted(): number {
    let count = 0;
    this.fields.forEach((f) => { if (this.perm[f.key]) { count++; } });
    return count;
  }
}
