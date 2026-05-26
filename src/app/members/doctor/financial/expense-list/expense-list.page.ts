import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ExpenseService } from 'src/app/services/expense.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.page.html',
  styleUrls: ['./expense-list.page.scss'],
})
export class ExpenseListPage {

  doctorId: number = 0;
  clinics: any[] = [];
  expenses: any[] = [];
  filtered: any[] = [];
  filter: string = 'All';
  loading: boolean = false;

  get total(): number {
    return this.filtered.reduce((s, e) => s + (e.Amount || 0), 0);
  }

  paymentModes = [
    { value: 'Cash',             label: 'Cash'      },
    { value: 'Online_Bank',      label: 'Bank'      },
    { value: 'Online_EasyPaisa', label: 'EasyPaisa' },
    { value: 'Online_JazzCash',  label: 'JazzCash'  },
    { value: 'Cheque',           label: 'Cheque'    },
  ];

  catIconMap: any = {
    Marketing:   'megaphone-outline',
    Printing:    'print-outline',
    Gifting:     'gift-outline',
    Fuel:        'car-outline',
    Salary:      'people-outline',
    Disposables: 'medkit-outline',
    Capital:     'cube-outline',
    Others:      'ellipsis-horizontal-outline',
  };

  catColorMap: any = {
    Marketing:   'cat-blue',
    Printing:    'cat-grey',
    Gifting:     'cat-pink',
    Fuel:        'cat-orange',
    Salary:      'cat-green',
    Disposables: 'cat-teal',
    Capital:     'cat-purple',
    Others:      'cat-grey',
  };

  constructor(
    private expenseService: ExpenseService,
    private storage: Storage,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    const allClinics = await this.storage.get(environment.CLINICS);
    const clinic     = await this.storage.get(environment.ON_CLINIC);
    this.clinics = allClinics || (clinic ? [clinic] : []);
    this.load();
  }

  load() {
    this.loading = true;
    this.expenseService.getAll(this.doctorId).subscribe(
      (res: any) => {
        this.loading = false;
        if (res.IsSuccess) {
          this.expenses = res.ResponseData || [];
          this.applyFilter();
        }
      },
      () => { this.loading = false; }
    );
  }

  setFilter(f: string) {
    this.filter = f;
    this.applyFilter();
  }

  applyFilter() {
    this.filtered = this.filter === 'All'
      ? this.expenses
      : this.expenses.filter(e => e.ExpenseType === this.filter);
  }

  clinicName(id: number): string {
    const c = this.clinics.find(x => x.Id === id);
    return c ? c.Name : '';
  }

  modeLabel(val: string): string {
    const m = this.paymentModes.find(x => x.value === val);
    return m ? m.label : val;
  }

  catIcon(cat: string): string {
    return this.catIconMap[cat] || 'ellipsis-horizontal-outline';
  }

  catClass(cat: string): string {
    return this.catColorMap[cat] || 'cat-grey';
  }

  async onTap(expense: any) {
    const sheet = await this.actionSheetCtrl.create({
      header: expense.Description,
      buttons: [
        {
          text: 'Edit',
          icon: 'pencil-outline',
          handler: () => {
            this.router.navigate(['/members/doctor/financial/add-expense'], { queryParams: { id: expense.Id } });
          }
        },
        {
          text: 'Delete',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => { this.confirmDelete(expense); }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await sheet.present();
  }

  async confirmDelete(expense: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Expense',
      message: `Delete "${expense.Description}" (Rs ${expense.Amount})?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          cssClass: 'alert-btn-danger',
          handler: () => { this.deleteExpense(expense.Id); }
        }
      ]
    });
    await alert.present();
  }

  deleteExpense(id: number) {
    this.expenseService.delete(id).subscribe(
      (res: any) => {
        if (res.IsSuccess) {
          this.toastService.create('Expense deleted', 'success');
          this.expenses = this.expenses.filter(e => e.Id !== id);
          this.applyFilter();
        } else {
          this.toastService.create(res.Message || 'Failed to delete', 'danger');
        }
      },
      () => { this.toastService.create('Failed to delete', 'danger'); }
    );
  }
}
