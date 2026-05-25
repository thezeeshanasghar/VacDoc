import { Component, OnInit } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ScheduleService } from 'src/app/services/schedule.service';

@Component({
  selector: 'app-collection-tasks',
  templateUrl: './collection-tasks.page.html',
  styleUrls: ['./collection-tasks.page.scss'],
})
export class CollectionTasksPage implements OnInit {
  tasks: any[] = [];
  paId: number;
  activeTask: any = null;
  paymentMode: string = 'Cash';
  weight: number = null;
  height: number = null;
  circle: number = null;

  constructor(
    private storage: Storage,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private scheduleService: ScheduleService,
  ) {}

  ngOnInit() {
    this.storage.get(environment.USER).then(user => {
      if (user && user.PAId) {
        this.paId = Number(user.PAId);
        this.loadTasks();
      }
    });
  }

  async loadTasks() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();
    this.scheduleService.getPaCollectionTasks(this.paId).subscribe(
      res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.tasks = res.ResponseData || [];
        }
      },
      () => loading.dismiss()
    );
  }

  openMarkForm(task: any) {
    this.activeTask = task;
    this.paymentMode = task.PaymentMode || 'Cash';
    this.weight = null;
    this.height = null;
    this.circle = null;
  }

  closeMarkForm() {
    this.activeTask = null;
  }

  async markCollected() {
    if (!this.activeTask) { return; }
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();
    const payload = {
      PaymentMode: this.paymentMode,
      Weight: this.weight,
      Height: this.height,
      Circle: this.circle,
    };
    this.scheduleService.markPaymentCollected(this.activeTask.Id, payload).subscribe(
      async res => {
        loading.dismiss();
        if (res && res.IsSuccess) {
          this.activeTask = null;
          this.loadTasks();
        } else {
          const alert = await this.alertController.create({
            header: 'Error',
            message: (res && res.Message) || 'Failed to mark payment.',
            buttons: ['OK'],
          });
          await alert.present();
        }
      },
      () => loading.dismiss()
    );
  }

  getVaccineName(task: any): string {
    if (task && task.Dose && task.Dose.Vaccine) {
      return task.Dose.Vaccine.Name + ' - ' + task.Dose.Name;
    }
    return '';
  }

  getChildName(task: any): string {
    return task && task.Child ? task.Child.Name : '';
  }
}
