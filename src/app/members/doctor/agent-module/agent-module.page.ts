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
    this.agentService.getAllAgents().subscribe(
      (data: any) => {
        this.agents = data;
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
        { name: 'email', type: 'email', placeholder: 'Email Address *' },
        { name: 'password', type: 'password', placeholder: 'Initial Password (min 4 characters) *' },
        { name: 'fee', type: 'number', placeholder: 'Referral Fee per Client (Rs.)' },
      ],
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
            if (!data.email || !data.email.trim()) {
              this.toastService.create('Email address is required', 'danger');
              return false;
            }
            if (!data.password || data.password.length < 4) {
              this.toastService.create('Password must be at least 4 characters', 'danger');
              return false;
            }
            const agent = {
              Name: data.name.trim(),
              PhoneNumber: data.phone.trim(),
              Email: data.email.trim(),
              Password: data.password,
              ReferralFeePerClient: parseFloat(data.fee) || 0
            };
            this.agentService.addAgent(agent).subscribe(
              (res: any) => {
                this.loadAgents();
                const code = (res && res.agentCode) ? res.agentCode : '';
                if (code) {
                  this.toastService.create('Agent added. Agent Code: ' + code, 'success');
                }
              },
              (_err: any) => { this.toastService.create('Failed to add agent', 'danger'); }
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
        { name: 'email', type: 'email', placeholder: 'Email Address', value: agent.Email || agent.email || '' },
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
            const updated = {
              Id: id,
              Name: data.name.trim(),
              PhoneNumber: data.phone || '',
              Email: data.email || '',
              Password: agent.Password || agent.password || '',
              AgentCode: agent.AgentCode || agent.agentCode || '',
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
