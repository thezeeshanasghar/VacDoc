import { Component } from '@angular/core';
import { LoadingController, AlertController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { ToastService } from 'src/app/shared/toast.service';
import { BookingService } from 'src/app/services/booking.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { PaService } from 'src/app/services/pa.service';
import { VaccineService } from 'src/app/services/vaccine.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage {

  allBookings: any[] = [];
  bookings: any[] = [];
  // Defaults to Pending so the list opens on what needs action; doctor/PA can pick
  // "All" (or another status) from the Status filter pills to see everything.
  selectedStatus: string = 'Pending';
  selectedType: string = '';
  selectedClinicId: number | string = '';
  selectedCity: string = '';
  fromDate: string = '';
  toDate: string = '';
  searchText: string = '';
  filtersOpen: boolean = false;
  clinic: any;
  clinics: any[] = [];
  cityOptions: string[] = [];
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
  paTargetDate: string = '';

  constructor(
    public loadingController: LoadingController,
    private alertController: AlertController,
    private storage: Storage,
    private toastService: ToastService,
    private bookingService: BookingService,
    private clinicService: ClinicService,
    private paService: PaService,
    private vaccineService: VaccineService,
    private platform: Platform,
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

  async assignPA(booking: any) {
    if (!this.selectedPAId) {
      this.toastService.create('Select a PA first.', 'danger');
      return;
    }
    var notes = (this.paGuidelines || '').trim() || booking.Vaccines || '';
    const callerUserId = this.usertype && this.usertype.Id ? Number(this.usertype.Id) : undefined;
    const securityStamp = await this.storage.get(environment.SECURITY_STAMP);

    // Same "assign every undone dose" behaviour as vaccine.page.ts's openAssignPopupAll() —
    // without this, PAAssignmentController.Create gets no ScheduleIds, pins zero schedules
    // to the assignment, and the PA's card shows up with "0 vaccines" and nothing to give.
    this.vaccineService.getVaccinationById(String(booking.ChildId)).subscribe(
      (scheduleRes) => {
        const scheduleIds = (scheduleRes && scheduleRes.IsSuccess && scheduleRes.ResponseData)
          ? scheduleRes.ResponseData.filter((s: any) => !s.IsDone).map((s: any) => s.Id)
          : [];
        this.confirmAndAssign(booking, notes, callerUserId, securityStamp, scheduleIds);
      },
      (err) => {
        // Schedule lookup failing shouldn't block the assignment — fall back to none pinned,
        // same as before this fix, rather than silently dropping the whole assign action.
        this.confirmAndAssign(booking, notes, callerUserId, securityStamp, []);
      }
    );
  }

  private confirmAndAssign(booking: any, notes: string, callerUserId: number | undefined, securityStamp: string, scheduleIds: number[]) {
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
            Notes: notes,
            TargetDate: this.paTargetDate || null,
            BookingId: booking.Id,
            ScheduleIds: scheduleIds
          }, callerUserId, securityStamp).subscribe(
            (r) => {
              if (r && r.IsSuccess) {
                this.expandedId = 0;
                this.selectedPAId = 0;
                this.paGuidelines = '';
                this.paTargetDate = '';
                this.toastService.create('PA assigned and booking confirmed.');
              } else {
                this.toastService.create((r && r.Message) ? r.Message : 'Booking confirmed but PA assignment failed.', 'warning');
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

  // Puts the doctor's Guidelines textarea one tap away from either comment already on the
  // booking, instead of retyping — see toggleExpand() for where these two are shown.
  copyIntoGuidelines(text: string) {
    this.paGuidelines = text || '';
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
      this.bookingService.getByDoctor(this.doctorId, null, null).subscribe(
        (res) => {
          loading.dismiss();
          if (res && res.IsSuccess) {
            this.allBookings = res.ResponseData || [];
            this.refreshCityOptions();
            this.applyFilters();
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
      const requests = this.clinics.map((c: any) => this.bookingService.getByClinic(c.Id, null, null));
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
          this.allBookings = merged;
          this.refreshCityOptions();
          this.applyFilters();
        },
        (err) => {
          loading.dismiss();
          this.toastService.create('Failed to load bookings', 'danger');
        }
      );
    });
  }

  private refreshCityOptions() {
    const cities = this.allBookings
      .map((b: any) => (b.City || '').trim())
      .filter((c: string) => !!c);
    this.cityOptions = Array.from(new Set(cities)).sort();
  }

  toggleFilters() {
    this.filtersOpen = !this.filtersOpen;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedStatus) { count++; }
    if (this.selectedType) { count++; }
    if (this.selectedClinicId) { count++; }
    if (this.selectedCity) { count++; }
    if (this.fromDate || this.toDate) { count++; }
    return count;
  }

  get activeFilterChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    if (this.selectedStatus) { chips.push({ key: 'status', label: this.selectedStatus }); }
    if (this.selectedType) { chips.push({ key: 'type', label: this.typeLabel(this.selectedType) }); }
    if (this.selectedClinicId) {
      const c = this.clinics.find((cl: any) => cl.Id === this.selectedClinicId);
      chips.push({ key: 'clinic', label: c ? c.Name : 'Clinic' });
    }
    if (this.selectedCity) { chips.push({ key: 'city', label: this.selectedCity }); }
    if (this.fromDate || this.toDate) {
      const from = this.fromDate ? this.formatShortDate(this.fromDate) : '…';
      const to = this.toDate ? this.formatShortDate(this.toDate) : '…';
      chips.push({ key: 'date', label: `${from} – ${to}` });
    }
    return chips;
  }

  private formatShortDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  removeFilterChip(key: string) {
    if (key === 'status') { this.selectedStatus = ''; }
    if (key === 'type') { this.selectedType = ''; }
    if (key === 'clinic') { this.selectedClinicId = ''; }
    if (key === 'city') { this.selectedCity = ''; }
    if (key === 'date') { this.fromDate = ''; this.toDate = ''; }
    this.applyFilters();
  }

  clearAllFilters() {
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedClinicId = '';
    this.selectedCity = '';
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

  applyFilters() {
    this.expandedId = 0;
    const search = (this.searchText || '').trim().toLowerCase();
    this.bookings = this.allBookings.filter((b: any) => {
      if (this.selectedStatus && b.Status !== this.selectedStatus) { return false; }
      if (this.selectedType && b.Type !== this.selectedType) { return false; }
      if (this.selectedClinicId && b.ClinicId !== this.selectedClinicId) { return false; }
      if (this.selectedCity && (b.City || '') !== this.selectedCity) { return false; }
      if (this.fromDate && (!b.PreferredDate || b.PreferredDate.slice(0, 10) < this.fromDate)) { return false; }
      if (this.toDate && (!b.PreferredDate || b.PreferredDate.slice(0, 10) > this.toDate)) { return false; }
      if (search) {
        const haystack = ((b.ChildName || '') + ' ' + (b.FatherName || '') + ' ' + (b.Phone || '')).toLowerCase();
        if (haystack.indexOf(search) === -1) { return false; }
      }
      return true;
    });
  }

  toggleExpand(booking: any) {
    if (this.expandedId === booking.Id) {
      this.expandedId = 0;
    } else {
      this.expandedId = booking.Id;
      this.doctorComment = booking.DoctorComment || '';
      this.selectedPAId = 0;
      this.paGuidelines = '';
      // Auto-fill Target Date from what the parent actually requested — the doctor can
      // still change it before assigning.
      this.paTargetDate = booking.PreferredDate ? String(booking.PreferredDate).slice(0, 10) : '';
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

  // Booking.Phone is stored as a plain local number with no CountryCode field (unlike
  // User, which has one) — defaults to Pakistan's 92, same assumption
  // PAAssignmentController.ToWhatsAppNumber falls back to server-side. Strips a leading
  // 0 and any non-digits, and leaves an already-international number (already starts
  // with 92) alone instead of double-prefixing it.
  private toWhatsAppNumber(phone: string): string {
    if (!phone) { return ''; }
    let digits = phone.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    if (!digits) { return ''; }
    if (digits.startsWith('92')) { return digits; }
    return '92' + digits;
  }

  openParentWhatsApp(booking: any) {
    const mobile = this.toWhatsAppNumber(booking.Phone);
    if (!mobile) {
      this.toastService.create('No phone number on this booking.', 'danger');
      return;
    }
    const url = (this.platform.is('android') || this.platform.is('ios'))
      ? `whatsapp://send?phone=${mobile}`
      : `https://web.whatsapp.com/send?phone=${mobile}`;
    window.open(url, '_system');
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
