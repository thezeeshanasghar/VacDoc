import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-edit-pa',
  templateUrl: './edit-pa.page.html',
  styleUrls: ['./edit-pa.page.scss']
})
export class EditPaPage implements OnInit {
  fg: any;
  paId: any;
  paName = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loadingCtrl: LoadingController,
    private paService: PaService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.paId   = this.route.snapshot.paramMap.get('paId');
    this.paName = this.route.snapshot.queryParamMap.get('name') || '';

    const mobile = this.route.snapshot.queryParamMap.get('mobile') || '';
    const email  = this.route.snapshot.queryParamMap.get('email')  || '';

    this.fg = this.fb.group({
      Name:         [this.paName, Validators.required],
      Email:        [email,  [Validators.required, Validators.email]],
      MobileNumber: [mobile, [Validators.required, Validators.pattern('[0-9]{10}$')]]
    });
  }

  async save() {
    if (this.fg.invalid) {
      this.toastService.create('Please fill all fields correctly.', 'danger');
      return;
    }
    const loader = await this.loadingCtrl.create({ message: 'Saving...' });
    await loader.present();

    this.paService.updatePaProfile(this.paId, this.fg.value).subscribe({
      next: (res: any) => {
        loader.dismiss();
        if (res && res.IsSuccess) {
          this.toastService.create('Profile updated successfully', 'success');
          this.router.navigate(['/members/doctor/personal-assistant']);
        } else {
          this.toastService.create(res && res.Message ? res.Message : 'Failed to update', 'danger');
        }
      },
      error: () => { loader.dismiss(); this.toastService.create('Failed to update profile', 'danger'); }
    });
  }
}
