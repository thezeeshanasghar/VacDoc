import { Component, OnInit } from '@angular/core';
import { FollowupService } from 'src/app/services/followup.service';
import { ToastService } from 'src/app/shared/toast.service';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/shared/alert.service';
import { PaService } from 'src/app/services/pa.service';
import { ChildService } from 'src/app/services/child.service';
import * as moment from 'moment';
@Component({
  selector: 'app-followup',
  templateUrl: './followup.page.html',
  styleUrls: ['./followup.page.scss']
})
export class FollowupPage implements OnInit {

  childData: any;
  doctorId: any;
  childId: any;
  childName: string;
  childDOB: string;
  childInitials: string;
  canAddFollowup = true;
  canDeleteFollowup = true;
  canDownloadFollowup = true;
  constructor(
    public route: ActivatedRoute,
    public loadingController: LoadingController,
    private followupService: FollowupService,
    private toastService: ToastService,
    private storage: Storage,
    private alertService: AlertService,
    private paService: PaService,
    private childService: ChildService,
  ) { }

  ngOnInit() {
    this.childId = this.route.snapshot.paramMap.get('id');
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
      this.getfollowupchild();
    });
    this.getChildInfo();
    this.storage.get(environment.USER).then(user => {
      if (user && user.UserType === 'PA') {
        this.paService.getPaPermissions(Number(user.PAId)).subscribe(perm => {
          this.canAddFollowup      = (perm && perm.AddFollowUp)         || false;
          this.canDeleteFollowup   = (perm && perm.DeleteFollowUp)      || false;
          this.canDownloadFollowup = (perm && perm.DownloadFollowUpPdf) || false;
        });
      }
    });
  }

  getChildInfo() {
    this.childService.getChildById(this.childId).subscribe(res => {
      if (res.IsSuccess) {
        const child = res.ResponseData;
        this.childName = child.Name;
        this.childDOB = moment(child.DOB).format('DD MMM YYYY');
        this.childInitials = (child.Name || '')
          .split(' ')
          .filter(part => part.length > 0)
          .map(part => part[0].toUpperCase())
          .slice(0, 2)
          .join('');
      }
    });
  }

  async getfollowupchild() {
    let data = { 'ChildId': this.childId, 'DoctorId': this.doctorId }
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.followupService.getFollowupByChild(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          this.childData = res.ResponseData;
          this.computeGrowthVelocities();
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message);
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err)
      });
  }

  // childData is newest-first (Visit #{{ childData.length - i }}), so each item's
  // chronological predecessor is the NEXT entry in the array (higher index), not the previous one.
  computeGrowthVelocities() {
    if (!this.childData || this.childData.length < 2) { return; }
    for (let i = 0; i < this.childData.length; i++) {
      const current = this.childData[i];
      current.WeightVelocity = null;
      current.HeightVelocity = null;

      let prior = null;
      for (let j = i + 1; j < this.childData.length; j++) {
        const candidate = this.childData[j];
        if (current.Weight && candidate.Weight) {
          prior = candidate;
          break;
        }
      }
      const years = prior ? this.yearsBetween(prior.CurrentVisitDate, current.CurrentVisitDate) : 0;
      if (prior && current.Weight && prior.Weight && years > 0) {
        current.WeightVelocity = (current.Weight - prior.Weight) / years;
      }

      let priorHeight = null;
      for (let j = i + 1; j < this.childData.length; j++) {
        const candidate = this.childData[j];
        if (current.Height && candidate.Height) {
          priorHeight = candidate;
          break;
        }
      }
      const heightYears = priorHeight ? this.yearsBetween(priorHeight.CurrentVisitDate, current.CurrentVisitDate) : 0;
      if (priorHeight && current.Height && priorHeight.Height && heightYears > 0) {
        current.HeightVelocity = (current.Height - priorHeight.Height) / heightYears;
      }
    }
  }

  private yearsBetween(fromDateStr: string, toDateStr: string): number {
    const from = moment(fromDateStr, 'DD-MM-YYYY');
    const to = moment(toDateStr, 'DD-MM-YYYY');
    if (!from.isValid() || !to.isValid()) { return 0; }
    return to.diff(from, 'days') / 365.25;
  }
  // async Deletechild(id) {
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   await this.childService.deleteChild(id).subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //         this.toastService.create(res.Message);
  //         this.getChlidByClinic(true);
  //         loading.dismiss();
  //       }
  //       else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, 'danger');
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, 'danger')
  //     }
  //   );
  // }
  async alertforDeleteFollowup(id) {
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
    await this.followupService.deleteFollowupById(id).subscribe(
      res => {
        if (res) {
          this.toastService.create(res.Message);
          this.getfollowupchild();
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      }
  );
    
  }
  
  formatVisitDate(dateStr: string): string {
    if (!dateStr) { return ''; }
    const parsed = moment(dateStr, 'DD-MM-YYYY');
    return parsed.isValid() ? parsed.format('DD MMM YYYY') : dateStr;
  }

  downloadFollowUpPdf(childId) {
    this.followupService.downloadFollowUpPdf(childId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const namePart = (this.childName || 'Follow-Up').replace(/\s+/g, '_');
      a.download = `${namePart}_Follow-Up.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error downloading PDF', error);
    });
  }
}
