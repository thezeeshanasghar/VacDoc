import { Component, ElementRef, ViewChild } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ExpenseService } from 'src/app/services/expense.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
})
export class AddExpensePage {
  @ViewChild('receiptInput', { static: false }) receiptInput: ElementRef;
  @ViewChild('warrantyInput', { static: false }) warrantyInput: ElementRef;

  doctorId: number = 0;
  clinics: any[] = [];

  expenseDate: string = '';
  amount: number = null;
  description: string = '';
  category: string = '';
  expenseType: string = 'Recurring';
  scope: string = 'clinic';
  clinicId: number = null;
  paymentMode: string = 'Cash';
  notes: string = '';

  // Capital / fixed asset fields
  assetName: string = '';
  expectedLifeYrs: number = null;
  warrantyExpiry: string = '';
  receiptFile: File = null;
  warrantyFile: File = null;
  receiptPreview: string = '';
  warrantyPreview: string = '';

  categories = [
    { value: 'Marketing',   label: 'Marketing',   icon: 'megaphone-outline'           },
    { value: 'Printing',    label: 'Printing',    icon: 'print-outline'               },
    { value: 'Gifting',     label: 'Gifting',     icon: 'gift-outline'                },
    { value: 'Fuel',        label: 'Fuel & Ship', icon: 'car-outline'                 },
    { value: 'Salary',      label: 'Salary',      icon: 'people-outline'              },
    { value: 'Disposables', label: 'Disposables', icon: 'medkit-outline'              },
    { value: 'Others',      label: 'Others',      icon: 'ellipsis-horizontal-outline' },
  ];

  paymentModes = [
    { value: 'Cash',             label: 'Cash'      },
    { value: 'Online_Bank',      label: 'Bank'      },
    { value: 'Online_EasyPaisa', label: 'EasyPaisa' },
    { value: 'Online_JazzCash',  label: 'JazzCash'  },
    { value: 'Cheque',           label: 'Cheque'    },
  ];

  constructor(
    private expenseService: ExpenseService,
    private loadingController: LoadingController,
    private router: Router,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const clinic = await this.storage.get(environment.ON_CLINIC);
    const allClinics = await this.storage.get(environment.CLINICS);
    this.clinics = allClinics || (clinic ? [clinic] : []);

    if (this.clinics.length === 1) {
      this.clinicId = this.clinics[0].Id;
    } else if (clinic) {
      this.clinicId = clinic.Id;
    }

    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    this.expenseDate = `${today.getFullYear()}-${mm}-${dd}`;
  }

  selectCategory(val: string) {
    this.category = val;
  }

  setExpenseType(val: string) {
    this.expenseType = val;
    if (val === 'Recurring') {
      this.assetName = '';
      this.expectedLifeYrs = null;
      this.warrantyExpiry = '';
      this.receiptFile = null;
      this.warrantyFile = null;
      this.receiptPreview = '';
      this.warrantyPreview = '';
    } else {
      this.category = '';
    }
  }

  setScope(val: string) {
    this.scope = val;
    if (val === 'all') {
      this.clinicId = null;
    } else if (this.clinics.length === 1) {
      this.clinicId = this.clinics[0].Id;
    }
  }

  pickReceipt() {
    this.receiptInput.nativeElement.click();
  }

  pickWarranty() {
    this.warrantyInput.nativeElement.click();
  }

  onReceiptPicked(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.receiptFile = file;
    this.compressAndPreview(file, (dataUrl) => { this.receiptPreview = dataUrl; });
  }

  onWarrantyPicked(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.warrantyFile = file;
    this.compressAndPreview(file, (dataUrl) => { this.warrantyPreview = dataUrl; });
  }

  private compressAndPreview(file: File, cb: (dataUrl: string) => void) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const maxPx = 800;
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else       { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async save() {
    if (!this.expenseDate) {
      this.toastService.create('Date is required', 'danger'); return;
    }
    if (!this.amount || this.amount <= 0) {
      this.toastService.create('Enter a valid amount', 'danger'); return;
    }
    if (!this.description || this.description.trim() === '') {
      this.toastService.create('Description is required', 'danger'); return;
    }
    if (this.expenseType === 'Recurring' && !this.category) {
      this.toastService.create('Select a category', 'danger'); return;
    }
    if (this.scope === 'clinic' && !this.clinicId) {
      this.toastService.create('Select a clinic', 'danger'); return;
    }

    if (this.expenseType === 'Capital') {
      if (!this.assetName || !this.assetName.trim()) {
        this.toastService.create('Asset name is required', 'danger'); return;
      }
      if (!this.expectedLifeYrs || this.expectedLifeYrs < 1) {
        this.toastService.create('Enter useful life in years', 'danger'); return;
      }
      if (!this.receiptFile) {
        this.toastService.create('Receipt image is required for fixed asset expenses', 'danger'); return;
      }
    }

    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();

    const payload: any = {
      DoctorId:    this.doctorId,
      ClinicId:    this.scope === 'clinic' ? this.clinicId : null,
      IsShared:    this.scope === 'all',
      ExpenseDate: this.expenseDate,
      Amount:      this.amount,
      Description: this.description.trim(),
      Category:    this.category,
      ExpenseType: this.expenseType,
      PaymentMode: this.paymentMode,
      Notes:       this.notes ? this.notes.trim() : null,
    };

    if (this.expenseType === 'Capital') {
      payload.AssetName       = this.assetName.trim();
      payload.ExpectedLifeYrs = this.expectedLifeYrs;
      payload.WarrantyExpiry  = this.warrantyExpiry || null;
      payload.ReceiptImage    = this.receiptPreview;
      payload.WarrantyImage   = this.warrantyPreview || null;
    }

    this.expenseService.create(payload).subscribe(
      (res: any) => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.toastService.create('Expense saved', 'success');
          this.router.navigate(['/members/doctor/financial']);
        } else {
          this.toastService.create(res.Message || 'Failed to save', 'danger');
        }
      },
      () => {
        loading.dismiss();
        this.toastService.create('Failed to save expense', 'danger');
      }
    );
  }
}
