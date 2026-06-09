import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { ToastService } from 'src/app/shared/toast.service';
import { BookingService } from 'src/app/services/booking.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage {

  bookings: any[] = [];
  selectedStatus: string = '';
  selectedType: string = '';
  clinic: any;
  usertype: any;
  expandedId: number = 0;
  doctorComment: string = '';

  constructor(
    public loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private toastService: ToastService,
    private bookingService: BookingService,
    private clinicService: ClinicService,
    private paService: PaService,
  ) {}

  ionViewWillEnter() {
    this.storage.get(environment.USER).then((user) => {
      this.usertype = user;
      if (user && user.UserType === 'PA') {
        this.paService.getPaClinics(Number(user.PAId)).subscribe(
          (res) => {
            if (res && res.IsSuccess && res.ResponseData && res.ResponseData.length > 0) {
              const online = res.ResponseData.find((c: any) => c.IsOnline);
              this.clinic = online ? online : res.ResponseData[0];
              this.loadBookings();
            }
          },
          (err) => { this.toastService.create('Failed to load clinics', 'danger'); }
        );
      } else {
        this.storage.get(environment.ON_CLINIC).then((clinic) => {
          this.clinic = clinic;
          this.loadBookings();
        });
      }
    });
  }

  loadBookings() {
    if (!this.clinic || !this.clinic.Id) { return; }
    this.loadingController.create({ message: 'Loading bookings...' }).then((loading) => {
      loading.present();
      this.bookingService.getByClinic(
        this.clinic.Id,
        this.selectedStatus || null,
        this.selectedType || null
      ).subscribe(
        (res) => {
          loading.dismiss();
          if (res && res.IsSuccess) {
            this.bookings = res.ResponseData || [];
          } else {
            this.toastService.create((res && res.Message) ? res.Message : 'Failed to load bookings', 'danger');
          }
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to load bookings', 'danger');
        }
      );
    });
  }

  filterChange() {
    this.expandedId = 0;
    this.loadBookings();
  }

  toggleExpand(booking: any) {
    if (this.expandedId === booking.Id) {
      this.expandedId = 0;
    } else {
      this.expandedId = booking.Id;
      this.doctorComment = booking.DoctorComment || '';
    }
  }

  saveComment(booking: any) {
    this.bookingService.addComment(booking.Id, this.doctorComment).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          booking.DoctorComment = this.doctorComment;
          this.toastService.create('Comment saved.');
        }
      },
      (err) => { this.toastService.create('Failed to save comment', 'danger'); }
    );
  }

  confirmBooking(booking: any) {
    this.bookingService.confirm(booking.Id, this.doctorComment).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          booking.Status = 'Confirmed';
          booking.DoctorComment = this.doctorComment;
          this.expandedId = 0;
          this.toastService.create('Booking confirmed.');
        } else {
          this.toastService.create((res && res.Message) ? res.Message : 'Failed to confirm', 'danger');
        }
      },
      (err) => { this.toastService.create('Failed to confirm booking', 'danger'); }
    );
  }

  async cancelBooking(booking: any) {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.bookingService.cancel(booking.Id, this.doctorComment).subscribe(
              (res) => {
                if (res && res.IsSuccess) {
                  booking.Status = 'Cancelled';
                  booking.DoctorComment = this.doctorComment;
                  this.expandedId = 0;
                  this.toastService.create('Booking cancelled.');
                } else {
                  this.toastService.create((res && res.Message) ? res.Message : 'Failed to cancel', 'danger');
                }
              },
              (err) => { this.toastService.create('Failed to cancel booking', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  openLocation(location: string) {
    if (location) { window.open(location, '_system'); }
  }

  statusColor(status: string): string {
    if (status === 'Confirmed') { return 'success'; }
    if (status === 'Cancelled') { return 'danger'; }
    return 'warning';
  }

  typeColor(type: string): string {
    return type === 'HomeBooked' ? 'tertiary' : 'primary';
  }

  typeLabel(type: string): string {
    return type === 'HomeBooked' ? 'Home' : 'Clinic';
  }
}
