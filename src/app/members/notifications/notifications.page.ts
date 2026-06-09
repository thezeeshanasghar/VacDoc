import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { ToastService } from 'src/app/shared/toast.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {

  notifications: any[] = [];
  doctorId: number = 0;

  constructor(
    public loadingController: LoadingController,
    private router: Router,
    private storage: Storage,
    private toastService: ToastService,
    private notificationService: NotificationService,
  ) {}

  ionViewWillEnter() {
    this.storage.get(environment.DOCTOR_Id).then((doctorId) => {
      this.doctorId = doctorId || 0;
      this.loadNotifications();
    });
  }

  loadNotifications() {
    if (!this.doctorId) { return; }
    this.loadingController.create({ message: 'Loading...' }).then((loading) => {
      loading.present();
      this.notificationService.getByDoctor(this.doctorId).subscribe(
        (res) => {
          loading.dismiss();
          if (res && res.IsSuccess) {
            this.notifications = res.ResponseData || [];
          } else {
            this.toastService.create('Failed to load notifications', 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to load notifications', 'danger');
        }
      );
    });
  }

  tapNotification(n: any) {
    if (!n.IsRead) {
      this.notificationService.markRead(n.Id).subscribe(
        (res) => { n.IsRead = true; },
        (err) => {}
      );
    }
    if (n.BookingId) {
      this.router.navigate(['/members/bookings'], { queryParams: { open: n.BookingId } });
    }
  }

  markAllRead() {
    this.notificationService.markAllReadDoctor(this.doctorId).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          var i: number;
          for (i = 0; i < this.notifications.length; i++) {
            this.notifications[i].IsRead = true;
          }
          this.toastService.create('All marked as read.');
        }
      },
      (err) => { this.toastService.create('Failed to mark all read', 'danger'); }
    );
  }

  unreadCount(): number {
    var count = 0;
    var i: number;
    for (i = 0; i < this.notifications.length; i++) {
      if (!this.notifications[i].IsRead) { count++; }
    }
    return count;
  }
}
