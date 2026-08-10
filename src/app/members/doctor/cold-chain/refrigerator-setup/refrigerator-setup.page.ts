import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { ColdChainService } from 'src/app/services/cold-chain.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-refrigerator-setup',
  templateUrl: './refrigerator-setup.page.html',
  styleUrls: ['./refrigerator-setup.page.scss'],
})
export class RefrigeratorSetupPage implements OnInit {
  doctorId: number;
  clinicId: number;
  clinics: any[] = [];

  refrigerators: any[] = [];
  isLoading = false;
  isSubmitting = false;
  showForm = false;

  formData = {
    name: '',
    serialNumber: '',
    type: 'Refrigerator',
    minTemp: 2,
    maxTemp: 8,
    location: ''
  };

  constructor(
    private storage: Storage,
    private coldChainService: ColdChainService,
    private clinicService: ClinicService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    await this.storage.get(environment.DOCTOR_Id).then(val => { this.doctorId = val; });
    await this.storage.get(environment.CLINIC_Id).then(val => { this.clinicId = val; });

    this.clinicService.getClinics(this.doctorId).subscribe((res: any) => {
      this.clinics = (res && res.ResponseData) || res || [];
    });

    this.loadRefrigerators();
  }

  onClinicChange() {
    this.loadRefrigerators();
  }

  loadRefrigerators() {
    if (!this.clinicId) { return; }
    this.isLoading = true;
    this.coldChainService.getRefrigerators(this.clinicId).subscribe({
      next: (res: any) => {
        this.refrigerators = (res && res.ResponseData) || [];
        this.isLoading = false;
      },
      error: () => {
        this.toastService.create('Error loading refrigerators', 'danger');
        this.isLoading = false;
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  submitRefrigerator() {
    if (!this.formData.name.trim() || !this.formData.serialNumber.trim()) {
      this.toastService.create('Name and serial number are required', 'warning');
      return;
    }
    if (Number(this.formData.minTemp) >= Number(this.formData.maxTemp)) {
      this.toastService.create('Min temperature must be lower than max', 'warning');
      return;
    }

    this.isSubmitting = true;
    const dto = {
      DoctorId: this.doctorId,
      ClinicId: this.clinicId,
      Name: this.formData.name.trim(),
      SerialNumber: this.formData.serialNumber.trim(),
      Type: this.formData.type,
      MinTemp: Number(this.formData.minTemp),
      MaxTemp: Number(this.formData.maxTemp),
      Location: this.formData.location.trim()
    };

    this.coldChainService.addRefrigerator(dto).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.IsSuccess !== false) {
          this.toastService.create('Refrigerator registered');
          this.resetForm();
          this.showForm = false;
          this.loadRefrigerators();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to register refrigerator', 'danger');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.create('Error registering refrigerator', 'danger');
      }
    });
  }

  resetForm() {
    this.formData = { name: '', serialNumber: '', type: 'Refrigerator', minTemp: 2, maxTemp: 8, location: '' };
  }

  deleteRefrigerator(id: number) {
    if (!confirm('Remove this refrigerator? Its reading history will be kept.')) { return; }
    this.coldChainService.deleteRefrigerator(id).subscribe({
      next: (res: any) => {
        if (res && res.IsSuccess !== false) {
          this.toastService.create('Refrigerator removed');
          this.loadRefrigerators();
        } else {
          this.toastService.create((res && res.Message) || 'Failed to remove', 'danger');
        }
      },
      error: () => this.toastService.create('Error removing refrigerator', 'danger')
    });
  }
}
