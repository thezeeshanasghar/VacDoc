import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AgentService } from 'src/app/services/agent.service';
import { ClinicService } from 'src/app/services/clinic.service';
import { VaccineService } from 'src/app/services/vaccine.service';
import { ToastService } from 'src/app/shared/toast.service';

/**
 * Edit Agent modal — Name/Phone/Fee, an assigned default clinic (auto-fills the
 * registration form's Clinic field for PA/Manager only), and per-vaccine fee overrides.
 * Replaces the old AlertController "Edit Agent" dialog, which cannot render a select
 * dropdown or a repeatable list.
 */
@Component({
  selector: 'app-agent-edit-modal',
  templateUrl: './agent-edit-modal.component.html',
  styleUrls: ['./agent-edit-modal.component.scss'],
})
export class AgentEditModalComponent implements OnInit {
  @Input() agent: any;
  @Input() doctorId: number;

  name = '';
  phone = '';
  fee: number | null = null;
  clinicId: number | null = null;

  clinics: any[] = [];
  vaccines: any[] = [];
  overrides: Array<{ vaccineId: number | null; fee: number | null }> = [];
  loading = true;

  constructor(
    private modalController: ModalController,
    private agentService: AgentService,
    private clinicService: ClinicService,
    private vaccineService: VaccineService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.name = this.agent.Name || this.agent.name || '';
    this.phone = this.agent.PhoneNumber || this.agent.phoneNumber || '';
    this.fee = this.agent.ReferralFeePerClient || this.agent.referralFeePerClient || 0;
    this.clinicId = this.agent.ClinicId || this.agent.clinicId || null;

    let pending = 3;
    const done = () => { pending--; if (pending === 0) { this.loading = false; } };

    this.clinicService.getClinics(this.doctorId).subscribe(
      // ClinicService returns the raw Response<T> wrapper ({IsSuccess, Message, ResponseData}),
      // not an unwrapped array — same shape as VaccineService below.
      (res: any) => { this.clinics = (res && res.ResponseData) || (Array.isArray(res) ? res : []); done(); },
      () => { done(); }
    );

    this.vaccineService.getVaccine().subscribe(
      (res: any) => { this.vaccines = (res && res.ResponseData) || res || []; done(); },
      () => { done(); }
    );

    const id = this.agent.Id || this.agent.id;
    this.agentService.getFeeOverrides(id).subscribe(
      (res: any) => {
        const rows = res || [];
        this.overrides = rows.map((o: any) => ({
          vaccineId: o.VaccineId || o.vaccineId,
          fee: o.Fee || o.fee
        }));
        done();
      },
      () => { done(); }
    );
  }

  addOverrideRow() {
    this.overrides.push({ vaccineId: null, fee: null });
  }

  removeOverrideRow(index: number) {
    this.overrides.splice(index, 1);
  }

  vaccineName(vaccineId: number): string {
    const v = this.vaccines.find((x: any) => (x.Id || x.id) === vaccineId);
    return v ? (v.Name || v.name) : '';
  }

  async save() {
    if (!this.name.trim()) {
      this.toastService.create('Agent name is required', 'danger');
      return;
    }
    if (!this.phone.trim()) {
      this.toastService.create('Phone number is required', 'danger');
      return;
    }

    const id = this.agent.Id || this.agent.id;
    const updated = {
      Id: id,
      Name: this.name.trim(),
      PhoneNumber: this.phone.trim(),
      ReferralFeePerClient: this.fee || 0,
      ClinicId: this.clinicId
    };

    this.agentService.updateAgent(id, updated).subscribe(
      () => {
        this.saveOverrides(id);
      },
      () => { this.toastService.create('Failed to update agent', 'danger'); }
    );
  }

  private saveOverrides(agentId: number) {
    // Valid rows (both vaccine and fee chosen) get upserted; anything the doctor cleared
    // out or removed from the list is deleted server-side rather than left stale.
    const validRows = this.overrides.filter(o => o.vaccineId != null && o.fee != null);
    const calls: Array<Promise<any>> = validRows.map(o =>
      this.agentService.upsertFeeOverride(agentId, o.vaccineId!, o.fee!).toPromise()
    );

    Promise.all(calls).then(
      () => {
        this.toastService.create('Agent updated.', 'success');
        this.modalController.dismiss({ saved: true }, 'save');
      },
      () => {
        this.toastService.create('Agent saved, but some fee overrides failed to save.', 'warning');
        this.modalController.dismiss({ saved: true }, 'save');
      }
    );
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }
}
