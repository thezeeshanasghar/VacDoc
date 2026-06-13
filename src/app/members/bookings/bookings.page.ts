import { Component } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { forkJoin } from 'rxjs';
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
  clinics: any[] = [];
  usertype: any;
  expandedId: number = 0;
  doctorComment: string = '';
  activeTab: string = 'bookings';
  homeCities: any[] = [];
  newCityName: string = '';
  doctorId: number = 0;
  paList: any[] = [];
  selectedPAId: number = 0;
  paGuidelines: string = '';

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
              this.clinics = res.ResponseData;
              const online = res.ResponseData.find((c: any) => c.IsOnline);
              this.clinic = online ? online : res.ResponseData[0];
              this.loadBookings();
            }
          },
          (err) => { this.toastService.create('Failed to load clinics', 'danger'); }
        );
      } else {
        this.storage.get(environment.DOCTOR_Id).then((docId) => {
          this.doctorId = docId || 0;
          this.storage.get(environment.ON_CLINIC).then((clinic) => {
            this.clinic = clinic;
            this.loadBookings();
            this.loadHomeCities();
            this.loadPAs();
            this.loadClinics();
          });
        });
      }
    });
  }

  loadHomeCities() {
    this.bookingService.getHomeCities(1).subscribe(
      (res) => {
        if (res && res.IsSuccess) { this.homeCities = res.ResponseData || []; }
      },
      (err) => {}
    );
  }

  loadPAs() {
    if (!this.doctorId) { return; }
    this.paService.getPAsForDoctor(this.doctorId).subscribe(
      (res) => {
        this.paList = (res || []).filter(function(p: any) { return p.IsActive !== false; });
      },
      (err) => {}
    );
  }

  loadClinics() {
    if (!this.doctorId) { return; }
    this.clinicService.getClinics(this.doctorId).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          this.clinics = res.ResponseData || [];
        }
      },
      (err) => {}
    );
  }

  assignPA(booking: any) {
    if (!this.selectedPAId) {
      this.toastService.create('Select a PA first.', 'danger');
      return;
    }
    var notes = (this.paGuidelines || '').trim() || ('BookingId:' + booking.Id + ' | ' + booking.Vaccines);
    this.bookingService.confirm(booking.Id, this.doctorComment).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          booking.Status = 'Confirmed';
          booking.DoctorComment = this.doctorComment;
          this.paService.createAssignment({
            DoctorId: this.doctorId,
            ClinicId: booking.ClinicId,
            PersonalAssistantId: this.selectedPAId,
            ChildId: booking.ChildId,
            Notes: notes
          }).subscribe(
            (r) => {
              if (r && r.IsSuccess) {
                this.expandedId = 0;
                this.selectedPAId = 0;
                this.paGuidelines = '';
                this.toastService.create('PA assigned and booking confirmed.');
              } else {
                this.toastService.create('Booking confirmed but PA assignment failed.', 'warning');
              }
            },
            (err) => { this.toastService.create('Booking confirmed but PA assignment failed.', 'warning'); }
          );
        } else {
          this.toastService.create((res && res.Message) ? res.Message : 'Failed to confirm booking.', 'danger');
        }
      },
      (err) => { this.toastService.create('Failed to confirm booking.', 'danger'); }
    );
  }

  addCity() {
    if (!this.newCityName || !this.newCityName.trim()) {
      this.toastService.create('Enter a city name.', 'danger');
      return;
    }
    this.bookingService.addHomeCity(1, this.newCityName.trim()).subscribe(
      (res) => {
        if (res && res.IsSuccess) {
          this.newCityName = '';
          this.loadHomeCities();
          this.toastService.create('City added.');
        } else {
          this.toastService.create((res && res.Message) ? res.Message : 'Failed to add city', 'danger');
        }
      },
      (err) => { this.toastService.create('Failed to add city', 'danger'); }
    );
  }

  async removeCity(city: any) {
    const alert = await this.alertController.create({
      header: 'Remove City',
      message: 'Remove "' + city.CityName + '" from home service?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          handler: () => {
            this.bookingService.deleteHomeCity(city.Id).subscribe(
              (res) => {
                if (res && res.IsSuccess) {
                  this.loadHomeCities();
                  this.toastService.create('City removed.');
                }
              },
              (err) => { this.toastService.create('Failed to remove city', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  loadBookings() {
    if (this.usertype && this.usertype.UserType === 'PA') {
      this.loadBookingsForPA();
    } else {
      this.loadBookingsForDoctor();
    }
  }

  private loadBookingsForDoctor() {
    if (!this.doctorId) { return; }
    this.loadingController.create({ message: 'Loading bookings...' }).then((loading) => {
      loading.present();
      this.bookingService.getByDoctor(
        this.doctorId,
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

  private loadBookingsForPA() {
    if (!this.clinics || this.clinics.length === 0) { return; }
    this.loadingController.create({ message: 'Loading bookings...' }).then((loading) => {
      loading.present();
      const requests = this.clinics.map((c: any) =>
        this.bookingService.getByClinic(c.Id, this.selectedStatus || null, this.selectedType || null)
      );
      forkJoin(requests).subscribe(
        (results: any[]) => {
          loading.dismiss();
          let merged: any[] = [];
          for (const res of results) {
            if (res && res.IsSuccess) {
              merged = merged.concat(res.ResponseData || []);
            }
          }
          merged.sort((a, b) => b.Id - a.Id);
          this.bookings = merged;
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
