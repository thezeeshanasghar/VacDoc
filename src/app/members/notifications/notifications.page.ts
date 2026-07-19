import { Component } from '@angular/core';
import { IonInfiniteScroll, LoadingController } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { ToastService } from 'src/app/shared/toast.service';
import { NotificationService } from 'src/app/services/notification.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll: IonInfiniteScroll;

  notifications: any[] = [];
  // The backend endpoint returns the full doctor history in one call (no server-side
  // paging support today) — visibleNotifications renders only a growing slice of it,
  // so the DOM/change-detection cost scales with what's actually on screen, not with
  // total notification history. Backend-side paging is a follow-up, not done here.
  visibleNotifications: any[] = [];
  doctorId: number = 0;
  initialLoading = true;

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
          this.initialLoading = false;
          if (res && res.IsSuccess) {
            this.notifications = res.ResponseData || [];
            this.visibleNotifications = this.notifications.slice(0, PAGE_SIZE);
            if (this.infiniteScroll) { this.infiniteScroll.disabled = this.visibleNotifications.length >= this.notifications.length; }
          } else {
            this.toastService.create('Failed to load notifications', 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.initialLoading = false;
          this.toastService.create('Failed to load notifications', 'danger');
        }
      );
    });
  }

  loadMore(event: any) {
    const next = this.notifications.slice(this.visibleNotifications.length, this.visibleNotifications.length + PAGE_SIZE);
    this.visibleNotifications = this.visibleNotifications.concat(next);
    event.target.complete();
    if (this.visibleNotifications.length >= this.notifications.length) {
      event.target.disabled = true;
    }
  }

  trackByNotificationId(_index: number, n: any): any {
    return n.Id;
  }

  tapNotification(n: any) {
    if (!n.IsRead) {
      this.notificationService.markRead(n.Id).subscribe(
        (res) => {
          n.IsRead = true;
          this.notificationService.unreadCountChanged$.next();
        },
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
          this.notificationService.unreadCountChanged$.next();
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
