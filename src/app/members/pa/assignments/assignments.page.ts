import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.page.html',
  styleUrls: ['./assignments.page.scss'],
})
export class AssignmentsPage {
  assignments: any[] = [];
  loading: boolean = false;

  constructor(
    private paService: PaService,
    private storage: Storage,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (user && user.PAId) {
      this.loadAssignments(Number(user.PAId));
    }
  }

  loadAssignments(paId: number) {
    this.loading = true;
    this.paService.getAssignments(paId).subscribe(
      res => {
        this.loading = false;
        if (res && res.IsSuccess) {
          this.assignments = res.ResponseData || [];
        }
      },
      () => { this.loading = false; }
    );
  }

  async confirmComplete(assignmentId: number, name: string) {
    const alert = await this.alertController.create({
      header: 'Mark Complete',
      message: `Mark assignment for ${name} as done?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Complete',
          handler: () => { this.completeAssignment(assignmentId); }
        }
      ]
    });
    await alert.present();
  }

  async completeAssignment(assignmentId: number) {
    const loading = await this.loadingController.create({ message: 'Updating...' });
    await loading.present();
    this.paService.completeAssignment(assignmentId).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Assignment completed', 'success');
          this.assignments = this.assignments.filter(a => a.AssignmentId !== assignmentId);
        } else {
          this.toastService.create(res.Message || 'Failed to complete', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to complete assignment', 'danger');
      }
    );
  }
}
