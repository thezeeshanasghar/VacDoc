import { Component } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AgentService } from 'src/app/services/agent.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-agent-module',
  templateUrl: './agent-module.page.html',
  styleUrls: ['./agent-module.page.scss'],
})
export class AgentModulePage {
  agents: any[] = [];

  activeAgents = 0;
  totalReferred = 0;
  totalAvailed = 0;
  totalOwed = 0;

  constructor(
    private agentService: AgentService,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private toastService: ToastService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.loadAgents();
  }

  async loadAgents() {
    const loader = await this.loadingCtrl.create({ message: 'Loading...' });
    await loader.present();
    this.agentService.getAgentsSummary().subscribe(
      (res: any) => {
        const data = res && res.ResponseData;
        this.agents = (data && data.Agents) || [];
        this.activeAgents = (data && data.ActiveAgents) || 0;
        this.totalReferred = (data && data.TotalReferred) || 0;
        this.totalAvailed = (data && data.TotalAvailed) || 0;
        this.totalOwed = (data && data.TotalOwed) || 0;
        loader.dismiss();
      },
      (_err: any) => {
        loader.dismiss();
        this.toastService.create('Failed to load agents', 'danger');
      }
    );
  }

  async addAgent() {
    const alert = await this.alertController.create({
      header: 'Add Agent',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Agent Name *' },
        { name: 'phone', type: 'tel', placeholder: 'Phone Number (used as Login ID) *' },
        { name: 'fee', type: 'number', placeholder: 'Referral Fee per Client (Rs.)' },
      ],
      message: 'A default PIN of 0000 will be issued. The agent must change it the first time they sign in.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data: any) => {
            if (!data.name || !data.name.trim()) {
              this.toastService.create('Agent name is required', 'danger');
              return false;
            }
            if (!data.phone || !data.phone.trim()) {
              this.toastService.create('Phone number is required (used as login ID)', 'danger');
              return false;
            }
            const agent = {
              Name: data.name.trim(),
              PhoneNumber: data.phone.trim(),
              ReferralFeePerClient: parseFloat(data.fee) || 0
            };
            this.agentService.addAgent(agent).subscribe(
              (res: any) => {
                this.loadAgents();
                const code = (res && res.agentCode) ? res.agentCode : '';
                this.toastService.create(
                  code ? ('Agent added. Agent Code: ' + code + '. Default PIN: 0000.') : 'Agent added. Default PIN: 0000.',
                  'success'
                );
              },
              (err: any) => {
                const msg = (err && err.error && err.error.Message) || 'Failed to add agent';
                this.toastService.create(msg, 'danger');
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  async editAgent(agent: any) {
    const alert = await this.alertController.create({
      header: 'Edit Agent',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Agent Name *', value: agent.Name || agent.name },
        { name: 'phone', type: 'tel', placeholder: 'Phone Number (Login ID)', value: agent.PhoneNumber || agent.phoneNumber },
        { name: 'fee', type: 'number', placeholder: 'Referral Fee per Client (Rs.)', value: agent.ReferralFeePerClient || agent.referralFeePerClient },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data: any) => {
            if (!data.name || !data.name.trim()) {
              this.toastService.create('Agent name is required', 'danger');
              return false;
            }
            const id = agent.Id || agent.id;
            // PutAgent merges onto the existing row server-side — only Name/Phone/Fee are
            // ever written by this dialog, so Password/Email/MustChangePassword don't need
            // to be sent at all.
            const updated = {
              Id: id,
              Name: data.name.trim(),
              PhoneNumber: data.phone || '',
              ReferralFeePerClient: parseFloat(data.fee) || 0
            };
            this.agentService.updateAgent(id, updated).subscribe(
              () => { this.loadAgents(); },
              (_err: any) => { this.toastService.create('Failed to update agent', 'danger'); }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  viewReport(agent: any) {
    const id = agent.Id || agent.id;
    this.router.navigate(['/members/doctor/agent-module/report', id]);
  }

  async deleteAgent(agent: any) {
    const confirm = await this.alertController.create({
      header: 'Delete Agent',
      message: 'Delete "' + (agent.Name || agent.name) + '"? This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            const id = agent.Id || agent.id;
            this.agentService.deleteAgent(id).subscribe(
              () => { this.loadAgents(); },
              (_err: any) => { this.toastService.create('Failed to delete agent', 'danger'); }
            );
          }
        }
      ]
    });
    await confirm.present();
  }
}
