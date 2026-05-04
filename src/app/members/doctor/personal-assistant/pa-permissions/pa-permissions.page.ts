import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-pa-permissions',
  templateUrl: './pa-permissions.page.html',
  styleUrls: ['./pa-permissions.page.scss'],
})
export class PaPermissionsPage implements OnInit {
  paId: number = 0;
  paName: string = '';
  perm: any = {};

  sections = [
    {
      key: 'patient',
      label: 'Patient Management',
      icon: 'people-outline',
      fields: [
        { key: 'SearchPatient',    label: 'Search patient' },
        { key: 'AddPatient',       label: 'Add new patient' },
        { key: 'EditPatient',      label: 'Edit patient details' },
        { key: 'DeletePatient',    label: 'Delete patient' },
        { key: 'ActivatePatient',  label: 'Activate patient' },
        { key: 'DeactivatePatient',label: 'Deactivate patient' },
        { key: 'DownloadPidPdf',   label: 'Download Patient ID PDF' },
        { key: 'CallPatient',      label: 'Call patient phone' },
        { key: 'SendSmsPatient',   label: 'Send SMS to patient' },
        { key: 'ViewUnapproved',   label: 'View unapproved patients' },
        { key: 'ApproveUnapproved',label: 'Approve unapproved patient' },
      ]
    },
    {
      key: 'vaccination',
      label: 'Vaccination',
      icon: 'medkit-outline',
      fields: [
        { key: 'ViewSchedule',       label: 'View vaccination schedule' },
        { key: 'GiveVaccine',        label: 'Give vaccine (single)' },
        { key: 'UngiveVaccine',      label: 'Ungive vaccine (own actions only)' },
        { key: 'SkipVaccine',        label: 'Skip vaccine' },
        { key: 'UnskipVaccine',      label: 'Unskip vaccine (own actions only)' },
        { key: 'RescheduleVaccine',  label: 'Reschedule individual vaccine date' },
        { key: 'BulkGiveVaccines',   label: 'Bulk give vaccines for a date' },
        { key: 'BulkUngiveVaccines', label: 'Bulk ungive vaccines (own actions only)' },
        { key: 'BulkReschedule',     label: 'Bulk reschedule vaccines' },
        { key: 'FillVaccineDetails', label: 'Fill vaccine details (brand/batch/expiry)' },
        { key: 'AddVaccineParams',   label: 'Add vaccine parameters (weight/height/OFC)' },
        { key: 'ApproveVaccineRecord',label: 'Approve vaccine record' },
        { key: 'PrintSchedulePdf',   label: 'Print vaccination schedule PDF' },
        { key: 'AddSpecialDoses',    label: 'Add special doses to schedule' },
        { key: 'EditVaccineSchedule',label: 'Edit vaccine schedule' },
      ]
    },
    {
      key: 'followup',
      label: 'Follow-Up',
      icon: 'calendar-outline',
      fields: [
        { key: 'ViewFollowUps',     label: 'View follow-ups' },
        { key: 'AddFollowUp',       label: 'Add follow-up' },
        { key: 'DeleteFollowUp',    label: 'Delete follow-up' },
        { key: 'DownloadFollowUpPdf', label: 'Download follow-up PDF' },
      ]
    },
    {
      key: 'cards',
      label: 'Immunization Cards',
      icon: 'card-outline',
      fields: [
        { key: 'DownloadImmunizationCards', label: 'Download immunization card PDFs' },
      ]
    },
    {
      key: 'growth',
      label: 'Growth',
      icon: 'trending-up-outline',
      fields: [
        { key: 'ViewGrowth',      label: 'View growth chart' },
        { key: 'AddGrowthRecord', label: 'Add growth record (weight/height/OFC)' },
      ]
    },
    {
      key: 'alerts',
      label: 'Alerts & Bulk Messaging',
      icon: 'notifications-outline',
      fields: [
        { key: 'ViewAlerts',       label: 'View vaccine / follow-up / birthday alerts' },
        { key: 'SendBulkEmail',    label: 'Send bulk email to alert patients' },
        { key: 'OpenWhatsApp',     label: 'Open WhatsApp for alert patient' },
        { key: 'DownloadAlertCsv',label: 'Download alert list as CSV' },
        { key: 'RetryMessage',     label: 'Retry failed message' },
      ]
    },
    {
      key: 'invoice',
      label: 'Invoice',
      icon: 'receipt-outline',
      fields: [
        { key: 'ManageInvoice', label: 'Add brands, consultation fee, generate invoice PDF' },
      ]
    },
    {
      key: 'clinics',
      label: 'Clinics',
      icon: 'business-outline',
      fields: [
        { key: 'AddClinic',     label: 'Add new clinic' },
        { key: 'EditClinic',    label: 'Edit clinic details' },
        { key: 'DeleteClinic',  label: 'Delete clinic' },
        { key: 'SetClinicOnline', label: 'Set clinic as online / active' },
      ]
    },
    {
      key: 'templates',
      label: 'Vaccine Schedule Templates',
      icon: 'list-outline',
      fields: [
        { key: 'AddScheduleTemplate', label: 'Add new vaccine schedule template' },
        { key: 'EditScheduleTemplate',label: 'Edit schedule (doses / timing)' },
        { key: 'SetVacationDates',    label: 'Set vacation dates' },
        { key: 'ApplySessionTimings', label: 'Apply session timings to all days' },
      ]
    },
    {
      key: 'stock',
      label: 'Stock Management',
      icon: 'cube-outline',
      fields: [
        { key: 'ViewStock',           label: 'View stock in hand' },
        { key: 'UpdateSalePrice',     label: 'Update sale price per brand' },
        { key: 'AddBrand',            label: 'Add new vaccine brand / product' },
        { key: 'EditBrand',           label: 'Edit brand details' },
        { key: 'AddPurchaseBill',     label: 'Add purchase bill' },
        { key: 'EditPurchaseBill',    label: 'Edit purchase bill' },
        { key: 'DeletePurchaseBill',  label: 'Delete purchase bill (with stock reversal)' },
        { key: 'ApprovePurchaseBill', label: 'Approve purchase bill' },
        { key: 'AdjustStock',         label: 'Adjust stock (increase / stock loss)' },
        { key: 'ViewAdjustHistory',   label: 'View adjust stock history' },
        { key: 'TransferStock',       label: 'Transfer stock between clinics' },
        { key: 'ViewTransferHistory', label: 'View stock transfer history' },
        { key: 'AddDirectSale',       label: 'Add direct sale' },
        { key: 'ViewDirectSaleHistory',label: 'View direct sale history' },
        { key: 'DownloadStockReport', label: 'Download stock / expiry PDF report' },
      ]
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'bar-chart-outline',
      fields: [
        { key: 'ViewAnalytics', label: 'View all analytics reports' },
      ]
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private paService: PaService,
    private loadingController: LoadingController,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.paId = Number(this.route.snapshot.paramMap.get('paId'));
    this.paName = this.route.snapshot.queryParamMap.get('name') || 'PA';
    this.loadPermissions();
  }

  async loadPermissions() {
    const loading = await this.loadingController.create({ message: 'Loading permissions...' });
    await loading.present();
    this.paService.getPaPermissions(this.paId).subscribe({
      next: (res: any) => {
        loading.dismiss();
        this.perm = res || {};
      },
      error: () => {
        loading.dismiss();
        this.perm = {};
        this.toastService.create('Failed to load permissions', 'danger');
      }
    });
  }

  selectAll(section: any) {
    section.fields.forEach((f: any) => { this.perm[f.key] = true; });
  }

  clearAll(section: any) {
    section.fields.forEach((f: any) => { this.perm[f.key] = false; });
  }

  async save() {
    const loading = await this.loadingController.create({ message: 'Saving...' });
    await loading.present();
    this.paService.updatePaPermissions(this.paId, this.perm).subscribe({
      next: () => {
        loading.dismiss();
        this.toastService.create('Permissions saved successfully', 'success');
        this.navCtrl.back();
      },
      error: () => {
        loading.dismiss();
        this.toastService.create('Failed to save permissions', 'danger');
      }
    });
  }

  countGranted(section: any): number {
    let count = 0;
    section.fields.forEach((f: any) => { if (this.perm[f.key]) { count++; } });
    return count;
  }
}
