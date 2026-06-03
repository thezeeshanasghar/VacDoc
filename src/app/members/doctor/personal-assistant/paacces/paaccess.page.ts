import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';

@Component({
  selector: 'app-paaccess',
  templateUrl: './paaccess.page.html',
  styleUrls: ['./paaccess.page.scss'],
})
export class PaAccessPage implements OnInit {
  fg: FormGroup;
  personalAssistants: any[] = [];
  clinics: any[] = [];
  personalAssistantsaccess: any[] = [];
  selectedPA: any = '';
  selectedClinic: string = '';
  doctorId: any;

  constructor(
    private fb: FormBuilder,
    public loadingController: LoadingController,
    private storage: Storage,
    private paService: PaService,
    private toastService: ToastService,
    private clinicService: ClinicService
  ) {}

  ngOnInit() {
    this.fg = this.fb.group({
      pa: ['', Validators.required],
      clinic: ['', Validators.required],
    });

    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
      this.loadAll();
    });
  }

  async loadAll() {
    const loading = await this.loadingController.create({ message: 'Loading...' });
    await loading.present();

    let done = 0;
    const finish = () => { if (++done === 3) { loading.dismiss(); } };

    this.paService.getPAsByDoctorId(this.doctorId).subscribe({
      next: (res) => { this.personalAssistants = res; finish(); },
      error: () => { this.toastService.create('Error fetching PAs', 'danger'); finish(); }
    });

    this.paService.getPaaccess(this.doctorId).subscribe({
      next: (res) => { this.personalAssistantsaccess = res; finish(); },
      error: () => { this.toastService.create('Error fetching access list', 'danger'); finish(); }
    });

    this.clinicService.getClinics(Number(this.doctorId)).subscribe({
      next: (response) => {
        if (response.IsSuccess) { this.clinics = response.ResponseData; }
        finish();
      },
      error: () => { this.toastService.create('Failed to load clinics', 'danger'); finish(); }
    });
  }

  onPADropdownChange(event: any) {
    this.selectedPA = event.detail.value;
  }

  onClinicDropdownChange(event: any) {
    this.selectedClinic = event.detail.value;
  }

  async submit() {
    if (!this.fg.valid) { return; }

    const loading = await this.loadingController.create({ message: 'Submitting...' });
    await loading.present();

    this.paService.addPAAccess({ PersonalAssistantId: this.selectedPA, clinicId: this.selectedClinic }).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create('PA Access added successfully', 'success');
        this.reloadAccessList();
      },
      error: (error) => {
        loading.dismiss();
        this.toastService.create((error.error && error.error.message) || 'Error adding access', 'danger');
      },
    });
  }

  async deleteAccess(accessId: number) {
    const loading = await this.loadingController.create({ message: 'Removing access...' });
    await loading.present();

    this.paService.deleteAccess(accessId).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create('Access removed', 'success');
        this.reloadAccessList();
      },
      error: () => {
        loading.dismiss();
        this.toastService.create('Failed to remove access', 'danger');
      },
    });
  }

  private reloadAccessList() {
    this.paService.getPaaccess(this.doctorId).subscribe({
      next: (res) => { this.personalAssistantsaccess = res; },
      error: () => {}
    });
  }
}
