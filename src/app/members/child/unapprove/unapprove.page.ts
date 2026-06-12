import { Component, ViewChild } from '@angular/core';
import { IonInfiniteScroll, LoadingController } from '@ionic/angular';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment.prod';
import { AlertService } from 'src/app/shared/alert.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { HttpResponse } from '@angular/common/http';
import { PaService } from 'src/app/services/pa.service';
import { ScheduleService } from 'src/app/services/schedule.service';

@Component({
  selector: 'app-unapprove',
  templateUrl: './unapprove.page.html',
  styleUrls: ['./unapprove.page.scss'],
})
export class UnapprovePage {
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll: IonInfiniteScroll;
  fg: FormGroup;
  childs: any = [];
  childsByPA: any[] = [];
  filteredChilds: any[] = [];
  userId: any;
  doctorId: number;
  page: number = 0;
  search: boolean = false;
  clinic: any;
  usertype: any;
  isSearchDisabled: boolean = false;
  clinics: any;
  selectedClinicId: any;
  loading: boolean = false;
  searchTerm: string = '';
  filterPa: string = '';

  constructor(
    public router: Router,
    public loadingController: LoadingController,
    private childService: ChildService,
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private callNumber: CallNumber,
    private paService: PaService,
    private scheduleService: ScheduleService,
  ) {
    this.fg = this.formBuilder.group({
      Name: ["", Validators.required],
    });
  }

  ionViewWillEnter() {
    // Always fetch fresh unapproved patients (across all clinics) when entering this page
    this.isSearchDisabled = true;
    this.storage.get(environment.USER).then((user) => {
      this.usertype = user;
    });
    this.storage.get(environment.DOCTOR_Id).then((docId) => {
      this.doctorId = docId;
      this.getUnapprovedPatients(false);
    });
  }

  async getUnapprovedPatients(isdelete: boolean) {
    if (!this.doctorId) { return; }
    const loading = await this.loadingController.create({
      message: 'Loading Unapproved Patients...',
    });
    await loading.present();
    this.loading = true;

    this.page = 0;
    this.childs = [];
    this.filteredChilds = [];
    if (isdelete) {
      this.search = false;
      this.fg.controls['Name'].setValue(null);
      this.isSearchDisabled = false;
    } else {
      this.infiniteScroll.disabled = false;
      this.isSearchDisabled = true;
    }

    this.childService.getUnapprovedPatients(this.doctorId).subscribe({
      next: (res) => {
        loading.dismiss();
        this.loading = false;
        if (res.IsSuccess) {
          this.infiniteScroll.disabled = true;
          this.childs = res.ResponseData;
          this.searchTerm = '';
          this.filterPa = '';
          this.buildPaGroups();
          this.search = true;
          this.isSearchDisabled = true;
          this.infiniteScroll.complete();
        } else {
          this.toastService.create(res.Message, 'danger');
          this.isSearchDisabled = false;
        }
      },
      error: (err) => {
        loading.dismiss();
        this.loading = false;
        this.toastService.create('Failed to fetch unapproved patients', 'danger');
        this.isSearchDisabled = false;
        console.error(err);
      },
    });
  }

  // Returns the keys (one per distinct pending source) that this child should be grouped under.
  // A child can appear under multiple keys if its profile was added by one PA and a pending
  // vaccine was given by a different PA/doctor.
  getPendingSourceKeys(child: any): string[] {
    const keys = new Set<string>();
    if (!child.IsPAApprove) {
      keys.add(child.AddedByPaId ? (child.AddedByPaName || ('PA #' + child.AddedByPaId)) : 'Doctor');
    }
    for (const s of (child.Schedules || [])) {
      if (s.IsDone && !s.IsPAApprove) {
        keys.add(s.GivenByPaId ? (s.GivenByPaName || ('PA #' + s.GivenByPaId)) : 'Doctor');
      }
    }
    if (keys.size === 0) {
      keys.add(child.AddedByPaId ? (child.AddedByPaName || ('PA #' + child.AddedByPaId)) : 'Doctor');
    }
    return Array.from(keys);
  }

  buildPaGroups() {
    const groups: any = {};
    for (const child of this.childs) {
      for (const key of this.getPendingSourceKeys(child)) {
        if (!groups[key]) { groups[key] = []; }
        groups[key].push(child);
      }
    }
    this.childsByPA = Object.keys(groups).map(k => ({ paName: k, children: groups[k] }));
    this.applyFilter();
  }

  applyFilter() {
    let list = this.childs;
    if (this.filterPa) {
      list = list.filter((c: any) => this.getPendingSourceKeys(c).includes(this.filterPa));
    }
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      list = list.filter((c: any) =>
        (c.Name || '').toLowerCase().includes(term) ||
        (c.FatherName || '').toLowerCase().includes(term)
      );
    }
    this.filteredChilds = list;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFilter();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  togglePaFilter(paName: string) {
    this.filterPa = this.filterPa === paName ? '' : paName;
    this.applyFilter();
  }

  getPendingVaxCount(child: any): number {
    if (!child.Schedules) { return 0; }
    return child.Schedules.filter((s: any) => s.IsDone && !s.IsPAApprove).length;
  }

  getPendingSchedules(child: any): any[] {
    if (!child.Schedules) { return []; }
    return child.Schedules.filter((s: any) => s.IsDone && !s.IsPAApprove);
  }

  getVaccineLabel(schedule: any): string {
    if (schedule && schedule.Dose && schedule.Dose.Vaccine) {
      return schedule.Dose.Vaccine.Name + ' - ' + schedule.Dose.Name;
    }
    return '';
  }

  async approveSchedule(scheduleId: number) {
    const loading = await this.loadingController.create({ message: 'Approving…' });
    await loading.present();
    this.scheduleService.patchIsApproved(scheduleId).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create('Vaccine approved', 'success');
        this.getUnapprovedPatients(false);
      },
      error: () => {
        loading.dismiss();
        this.toastService.create('Failed to approve vaccine', 'danger');
      }
    });
  }

  // Builds the list of pending approve actions (profile + per-vaccine) for one child,
  // restricted to the items attributable to the currently filtered PA (if any).
  private getPendingActionsForChild(child: any): { type: 'child' | 'schedule', id: number }[] {
    const actions: { type: 'child' | 'schedule', id: number }[] = [];
    if (!child.IsPAApprove) {
      const key = child.AddedByPaId ? (child.AddedByPaName || ('PA #' + child.AddedByPaId)) : 'Doctor';
      if (!this.filterPa || this.filterPa === key) {
        actions.push({ type: 'child', id: child.Id });
      }
    }
    for (const s of this.getPendingSchedules(child)) {
      const key = s.GivenByPaId ? (s.GivenByPaName || ('PA #' + s.GivenByPaId)) : 'Doctor';
      if (!this.filterPa || this.filterPa === key) {
        actions.push({ type: 'schedule', id: s.Id });
      }
    }
    return actions;
  }

  async approveAllFromPa() {
    const actions: { type: 'child' | 'schedule', id: number }[] = [];
    for (const c of this.filteredChilds) {
      actions.push(...this.getPendingActionsForChild(c));
    }
    if (actions.length === 0) { return; }
    const loading = await this.loadingController.create({ message: 'Approving all…' });
    await loading.present();
    let done = 0;
    const doNext = () => {
      if (done >= actions.length) {
        loading.dismiss();
        this.toastService.create(`${actions.length} item(s) approved`, 'success');
        this.getUnapprovedPatients(false);
        return;
      }
      const action = actions[done];
      const obs = action.type === 'child'
        ? this.childService.approveChild(action.id)
        : this.scheduleService.patchIsApproved(action.id);
      obs.subscribe({
        next: () => { done++; doNext(); },
        error: () => { done++; doNext(); }
      });
    };
    doNext();
  }

  getStringValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return value.toString();
    }
  }

  loadData() {
    if (this.search)
      this.getChlidbyUser(false);
    else
      this.getChlidByClinic(false);
  }

  async alertforDeleteChild(id) {
    this.alertService.confirmAlert('Are you sure you want to delete this ?', null)
      .then((yes) => {
        if (yes) {
          this.Deletechild(id);
        }
      });
  }

  async Deletechild(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    await this.childService.deleteChild(id, this.usertype ? this.usertype.UserType : null).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create(res.Message);
          this.getUnapprovedPatients(true);
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.alertService.simpleAlert(res.Message, 'Cannot Delete Patient');
        }
      },
      err => {
        loading.dismiss();
        this.alertService.simpleAlert('An error occurred while deleting.', 'Error');
      }
    );
  }

  async getChlidbyUser(keypress: boolean) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    if (keypress) {
      this.search = true;
      this.page = 0;
      this.childs = [];
      this.infiniteScroll.disabled = false;
    }
    this.isSearchDisabled = true;
    await this.childService.getChildByUserSearch(this.doctorId, this.page, this.fg.value.Name).subscribe(
      res => {
        if (res.IsSuccess) {
          if (res.ResponseData.length < 15)
            this.infiniteScroll.disabled = true;
          this.childs = (this.childs.concat(res.ResponseData));
          this.page += 1;
          this.infiniteScroll.complete();
          this.isSearchDisabled = false;
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.isSearchDisabled = false;
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.isSearchDisabled = false;
        this.toastService.create(err, 'danger');
      }
    )
  }

  async getChlidByClinic(isdelete: boolean) {
    const loading = await this.loadingController.create({
      message: 'Loading',
    });
    await loading.present();

    if (isdelete) {
      this.page = 0;
      this.childs = [];
      this.search = false;
      this.fg.controls['Name'].setValue(null);
    }

    this.isSearchDisabled = true;
    // Use clinic.Id for both DOCTOR and PA (clinic should be set correctly in ionViewWillEnter)
    const clinicIdToUse = this.clinic ? this.clinic.Id : null;
    
    if (!clinicIdToUse) {
      loading.dismiss();
      this.toastService.create('No clinic selected or available.', 'danger');
      return;
    }

    this.childService.getChildByClinic(clinicIdToUse, this.page).subscribe({
      next: (res) => {
        if (res.IsSuccess) {
          if (res.ResponseData.length < 10) this.infiniteScroll.disabled = true;
          this.childs = this.childs.concat(res.ResponseData);
          this.page += 1;
          loading.dismiss();
          this.infiniteScroll.complete();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
        this.isSearchDisabled = false;
      },
      error: (err) => {
        loading.dismiss();
        this.isSearchDisabled = false;
        this.toastService.create(err, 'danger');
      },
    });
  }

  navigateToRoute(route: string) {
    this.router.navigate([route]);
  }

  async approveChild(childId: number) {
    const loading = await this.loadingController.create({
      message: 'Approving'
    });
    await loading.present();

    this.childService.approveChild(childId).subscribe({
      next: (res) => {
        loading.dismiss();
        this.toastService.create('Child approved successfully', 'success');
        this.getUnapprovedPatients(false);
      },
      error: (err) => {
        loading.dismiss();
        this.toastService.create('Failed to approve child', 'danger');
        console.error(err);
      },
    });
  }

  callFunction(celnumber) {
    this.callNumber.callNumber(0 + celnumber, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  async toggleChildActiveStatus(childId: number) {
    const loading = await this.loadingController.create({
      message: 'Updating status...'
    });
    await loading.present();

    this.childService.toggleChildActiveStatus(childId).subscribe(
      (res) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.getUnapprovedPatients(false);
        } else {
          this.toastService.create(res.Message, 'danger');
        }
      },
      (err) => {
        loading.dismiss();
        this.toastService.create('An error occurred while updating status', 'danger');
      }
    );
  }

  downloadPdf(childId: number) {
    this.childService.downloadPdf(childId, { observe: 'response', responseType: 'blob' }).subscribe((response: HttpResponse<Blob>) => {
      const blob = new Blob([response.body], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Patient-ID.pdf';
      if (contentDisposition) {
        let matches = /filename=(.*?)(;|$)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/["']/g, '');
        }
      }
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }, error => {
      console.error('Error downloading the PDF', error);
    });
  }
}